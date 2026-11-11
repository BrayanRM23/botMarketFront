import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Sheet, Upload, X, Loader2, Trash2, CheckCircle2, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getSupabase, KNOWLEDGE_BUCKET } from '../../lib/supabase.js';

const ACCEPTED = '.pdf,.xlsx,.xls,.csv,.txt,.docx';
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ROWS_PER_SEGMENT = 100;
// Un segmento de texto genera como mucho ~30 fragmentos; así cualquier lote cabe en el presupuesto
const TEXT_SEGMENT_CHARS = 20000;
// El backend admite hasta 300 fragmentos por petición; se deja margen por la estimación
const CHUNK_BUDGET_PER_REQUEST = 200;
const TEXT_STEP = 750;
const ROWS_PER_CHUNK = 10;
// Espera antes del 2.º y 3.er intento de cada paso de la carga
const RETRY_DELAYS_MS = [1000, 3000];
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;

// Solo se reintenta lo que puede ser pasajero: sin conexión, error del servidor o límite de uso
function isTransient(err) {
  const status = err?.response?.status;
  return !status || status >= 500 || status === 429;
}

async function withRetry(task, onRetry) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await task();
    } catch (err) {
      if (attempt >= MAX_ATTEMPTS || !isTransient(err)) throw err;
      onRetry?.(attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]));
    }
  }
}

// ─── Extracción: cada función devuelve segmentos para el backend ───────────────

async function extractPdf(file) {
  const pdfjsLib = await import('pdfjs-dist');
  // Vite resuelve este patrón y copia el worker al build output correctamente
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const segments = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(' ').trim();
    if (text) segments.push({ type: 'text', page: i, text });
  }

  return segments;
}

// Convierte una hoja (matriz de celdas) en segmentos de filas con su número de fila real
function sheetToSegments(rows, sheetName) {
  if (!rows.length) return [];
  const header = rows[0].map((cell) => String(cell ?? ''));
  const dataRows = rows.slice(1);
  const segments = [];

  for (let i = 0; i < dataRows.length; i += ROWS_PER_SEGMENT) {
    segments.push({
      type: 'rows',
      sheet: sheetName,
      header,
      rows: dataRows.slice(i, i + ROWS_PER_SEGMENT).map((row) => row.map((cell) => String(cell ?? ''))),
      startRow: i + 2,
    });
  }
  return segments;
}

async function extractExcel(file) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  return workbook.SheetNames.flatMap((name) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '' });
    return sheetToSegments(rows, name);
  });
}

async function extractCsv(file) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(await file.text(), { type: 'string' });
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: '' });
  return sheetToSegments(rows, file.name);
}

// TXT y DOCX no tienen páginas ni hojas: se parten en bloques por párrafo para que
// cada segmento quepa en una petición
function textToSegments(text) {
  const segments = [];
  let rest = text.replace(/\r/g, '').trim();

  while (rest.length) {
    let end = Math.min(TEXT_SEGMENT_CHARS, rest.length);
    if (end < rest.length) {
      const cut = rest.lastIndexOf('\n\n', end);
      if (cut > TEXT_SEGMENT_CHARS * 0.5) end = cut;
    }
    const piece = rest.slice(0, end).trim();
    if (piece) segments.push({ type: 'text', text: piece });
    rest = rest.slice(end).trim();
  }
  return segments;
}

async function extractTxt(file) {
  return textToSegments(await file.text());
}

async function extractDocx(file) {
  const { default: mammoth } = await import('mammoth');
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return textToSegments(value);
}

// Estimación de fragmentos que generará el backend, para agrupar peticiones
function estimateChunks(segment) {
  if (segment.type === 'text') return Math.ceil(segment.text.length / TEXT_STEP) || 1;
  return Math.ceil(segment.rows.length / ROWS_PER_CHUNK) || 1;
}

function batchSegments(segments) {
  const batches = [];
  let current = [];
  let budget = 0;

  for (const segment of segments) {
    const cost = estimateChunks(segment);
    if (current.length && budget + cost > CHUNK_BUDGET_PER_REQUEST) {
      batches.push(current);
      current = [];
      budget = 0;
    }
    current.push(segment);
    budget += cost;
  }
  if (current.length) batches.push(current);
  return batches;
}

function fileIcon(name) {
  if (name.endsWith('.pdf')) return <FileText className="h-4 w-4 shrink-0 text-red-400" />;
  if (name.endsWith('.docx') || name.endsWith('.txt')) return <FileText className="h-4 w-4 shrink-0 text-sky-400" />;
  return <Sheet className="h-4 w-4 shrink-0 text-emerald-400" />;
}

function StatusBadge({ doc }) {
  if (doc.status === 'ready') {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {doc.chunkCount} fragmentos
      </span>
    );
  }
  if (doc.status === 'error') {
    return (
      <span className="flex items-center gap-1 text-xs text-red-400">
        <AlertTriangle className="h-3.5 w-3.5" />
        Error: el asistente no usa este documento
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-amber-400">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      En proceso
    </span>
  );
}

export default function FileKnowledgeUploader({ botId }) {
  const { api } = useAuth();
  const inputRef = useRef(null);
  // Documento a reemplazar con el próximo archivo que se elija (null = carga nueva)
  const replaceTargetRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [documents, setDocuments] = useState([]);

  const loadDocuments = useCallback(async () => {
    try {
      const res = await api.get(`/bots/${botId}/documents`);
      setDocuments(res.data.documents);
    } catch {
      setError('No se pudo cargar la lista de documentos.');
    }
  }, [api, botId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const closeDocument = (docId, failure) =>
    api.post(`/bots/${botId}/documents/${docId}/complete`, failure ? { error: failure } : {});

  // Devuelve el resultado del cierre: { status, chunkCount, replaced }.
  // Si falla un paso tras sus reintentos, cierra el documento con error (el backend borra
  // los fragmentos parciales) y lanza un Error con un mensaje corto para el usuario.
  const indexFile = async (file, segments, replaceDoc) => {
    const { data: created } = await api.post(`/bots/${botId}/documents`, {
      filename: file.name,
      mimeType: file.type,
      ...(replaceDoc && { replacesDocId: replaceDoc.id }),
    });
    const { docId, path, token } = created;
    const batches = batchSegments(segments);
    let step = 'subir el archivo';

    try {
      setProgress('Subiendo archivo original...');
      await withRetry(
        async () => {
          const { error: uploadError } = await getSupabase()
            .storage.from(KNOWLEDGE_BUCKET)
            .uploadToSignedUrl(path, token, file, { upsert: true });
          if (uploadError) throw new Error(uploadError.message);
        },
        (n) => setProgress(`Reintentando la subida (intento ${n} de ${MAX_ATTEMPTS})...`)
      );

      // Cada lote lleva su batchIndex: reenviarlo reemplaza lo insertado, así reintentar no duplica
      for (let i = 0; i < batches.length; i++) {
        step = `indexar el lote ${i + 1} de ${batches.length}`;
        setProgress(`Indexando lote ${i + 1} de ${batches.length}...`);
        await withRetry(
          () => api.post(`/bots/${botId}/documents/${docId}/chunks`, { batchIndex: i, segments: batches[i] }),
          (n) => setProgress(`Reintentando lote ${i + 1} de ${batches.length} (intento ${n} de ${MAX_ATTEMPTS})...`)
        );
      }

      step = 'finalizar la carga';
      setProgress('Finalizando...');
      try {
        const { data } = await withRetry(() => closeDocument(docId));
        return data;
      } catch (err) {
        // 409: un intento anterior sí cerró el documento; la lista mostrará su estado real
        if (err?.response?.status === 409) return { status: 'unknown' };
        throw err;
      }
    } catch (err) {
      const reason = err?.response?.data?.message || (err?.response ? 'error del servidor' : 'sin conexión');
      const message = `No se pudo ${step}: ${reason}`.slice(0, 300);
      await closeDocument(docId, message).catch(() => {});
      throw new Error(message);
    }
  };

  const processFile = async (file, replaceDoc = null) => {
    setError('');
    setNotice('');
    if (file.size > MAX_FILE_BYTES) {
      setError('El archivo supera el límite de 10 MB.');
      return;
    }

    const name = file.name.toLowerCase();
    if (!ACCEPTED.split(',').some((ext) => name.endsWith(ext))) {
      setError('Formato no soportado. Usa PDF, Word, Excel, CSV o TXT.');
      return;
    }

    const keepPrevious = replaceDoc ? ` Se conserva la versión anterior de «${replaceDoc.filename}».` : '';

    setProcessing(true);
    setProgress(replaceDoc ? `Reemplazando «${replaceDoc.filename}»: leyendo archivo...` : 'Leyendo archivo...');
    try {
      let segments;
      if (name.endsWith('.pdf')) segments = await extractPdf(file);
      else if (name.endsWith('.csv')) segments = await extractCsv(file);
      else if (name.endsWith('.txt')) segments = await extractTxt(file);
      else if (name.endsWith('.docx')) segments = await extractDocx(file);
      else segments = await extractExcel(file);

      if (!segments.length) {
        setError(`No se pudo extraer texto del archivo. Puede ser un PDF escaneado (solo imagen).${keepPrevious}`);
        return;
      }

      const result = await indexFile(file, segments, replaceDoc);
      if (result.status === 'error') {
        setError(`El archivo no generó información utilizable.${keepPrevious}`);
      } else if (replaceDoc && result.replaced) {
        setNotice(`Se reemplazó «${replaceDoc.filename}» por «${file.name}».`);
      } else if (result.status === 'ready') {
        setNotice(`«${file.name}» quedó listo: el asistente ya puede usarlo.`);
      }
    } catch (err) {
      console.error('Error procesando archivo:', err);
      const detail = err?.response?.data?.message || err?.message || 'Error al procesar el archivo.';
      setError(`${detail}${keepPrevious}`);
    } finally {
      setProcessing(false);
      setProgress('');
      if (inputRef.current) inputRef.current.value = '';
      loadDocuments();
    }
  };

  const handleFiles = (files) => {
    const file = files[0];
    const replaceDoc = replaceTargetRef.current;
    replaceTargetRef.current = null;
    if (file) processFile(file, replaceDoc);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    replaceTargetRef.current = null;
    handleFiles(e.dataTransfer.files);
  };

  const openPicker = (replaceDoc = null) => {
    if (processing) return;
    replaceTargetRef.current = replaceDoc;
    inputRef.current?.click();
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('¿Eliminar este documento y sus fragmentos?')) return;
    try {
      await api.delete(`/bots/${botId}/documents/${docId}`);
      loadDocuments();
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo eliminar el documento.');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">Archivos de conocimiento</span>
        <span className="text-xs text-slate-500">PDF, Word, Excel, CSV, TXT · máx. 10 MB</span>
      </div>

      {/* Ayuda: formatos, estados y qué hacer si falla */}
      <div className="flex gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
        <div className="space-y-1 text-xs text-slate-400">
          <p>
            Formatos: PDF, Word (.docx), Excel (.xlsx, .xls), CSV y TXT, hasta 10 MB por archivo. Los PDF
            escaneados (solo imagen) no sirven: el texto debe poder seleccionarse.
          </p>
          <p>
            <span className="text-amber-400">En proceso</span>: se está leyendo e indexando.{' '}
            <span className="text-emerald-400">Listo</span>: el asistente ya lo usa.{' '}
            <span className="text-red-400">Error</span>: no se pudo indexar y el asistente no lo usa.
          </p>
          <p>
            Si falla, lee el motivo debajo del documento, revisa el archivo y vuelve a subirlo. Para actualizar
            un documento usa <span className="text-slate-300">Reemplazar</span>: la versión anterior solo se borra
            cuando la nueva queda lista.
          </p>
        </div>
      </div>

      {/* Zona de drop */}
      <div
        onClick={() => openPicker(null)}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition
          ${dragging ? 'border-brand-400 bg-brand-500/10' : 'border-slate-700 bg-slate-950/40 hover:border-slate-500 hover:bg-slate-950/60'}
          ${processing ? 'cursor-wait opacity-70' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {processing ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
            <p className="text-sm text-slate-400">{progress}</p>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-slate-500" />
            <p className="text-sm text-slate-400">
              Arrastra un archivo aquí o{' '}
              <span className="text-brand-400 underline underline-offset-2">selecciónalo</span>
            </p>
            <p className="text-xs text-slate-600">El asistente buscará en el archivo solo lo relevante a cada pregunta</p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2">
          <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Aviso de éxito */}
      {notice && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-3 py-2">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <p className="text-xs text-emerald-300">{notice}</p>
        </div>
      )}

      {/* Documentos del bot */}
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2"
        >
          <span className="mt-0.5">{fileIcon(doc.filename)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-200">{doc.filename}</p>
            <StatusBadge doc={doc} />
            {doc.status === 'error' && doc.error && (
              <p className="mt-0.5 text-xs text-red-300/80">{doc.error}</p>
            )}
            {doc.status === 'processing' && doc.replacesId && (
              <p className="mt-0.5 text-xs text-slate-500">Nueva versión de un documento existente</p>
            )}
          </div>
          {doc.status !== 'processing' && (
            <button
              type="button"
              onClick={() => openPicker(doc)}
              disabled={processing}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-700 hover:text-brand-300 disabled:opacity-40"
              aria-label={`Reemplazar ${doc.filename}`}
              title="Reemplazar por una nueva versión"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDelete(doc.id)}
            disabled={processing}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-700 hover:text-red-400 disabled:opacity-40"
            aria-label={`Eliminar ${doc.filename}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
