import { useRef, useState } from 'react';
import { FileText, Sheet, Upload, X, Loader2, AlertTriangle } from 'lucide-react';

const ACCEPTED = '.pdf,.xlsx,.xls,.csv';
const MAX_CHARS = 50000;
const WARN_CHARS = 15000;

async function extractPdf(file) {
  const pdfjsLib = await import('pdfjs-dist');
  // Vite resuelve este patrón y copia el worker al build output correctamente
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const parts = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    if (pageText.trim()) parts.push(`[Página ${i}]\n${pageText.trim()}`);
  }

  return parts.join('\n\n');
}

async function extractExcel(file) {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const parts = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rows.length) continue;

    const tableText = rows
      .filter((row) => row.some((cell) => String(cell).trim()))
      .map((row) => row.map((cell) => String(cell)).join(' | '))
      .join('\n');

    parts.push(`[Hoja: ${sheetName}]\n${tableText}`);
  }

  return parts.join('\n\n');
}

async function extractCsv(file) {
  const XLSX = await import('xlsx');
  const text = await file.text();
  const workbook = XLSX.read(text, { type: 'string' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  return rows
    .filter((row) => row.some((cell) => String(cell).trim()))
    .map((row) => row.map((cell) => String(cell)).join(' | '))
    .join('\n');
}

function fileIcon(name) {
  if (name.endsWith('.pdf')) return <FileText className="h-4 w-4 text-red-400" />;
  return <Sheet className="h-4 w-4 text-emerald-400" />;
}

export default function FileKnowledgeUploader({ onExtracted }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [lastFile, setLastFile] = useState(null);

  const processFile = async (file) => {
    setError('');
    setProcessing(true);
    setLastFile(null);

    try {
      const name = file.name.toLowerCase();
      let text = '';

      if (name.endsWith('.pdf')) {
        text = await extractPdf(file);
      } else if (name.endsWith('.csv')) {
        text = await extractCsv(file);
      } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        text = await extractExcel(file);
      } else {
        setError('Formato no soportado. Usa PDF, Excel o CSV.');
        return;
      }

      if (!text.trim()) {
        setError('No se pudo extraer texto del archivo. Puede ser un PDF escaneado (solo imagen).');
        return;
      }

      const trimmed = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;
      setLastFile({ name: file.name, chars: trimmed.length, truncated: text.length > MAX_CHARS });
      onExtracted(trimmed);
    } catch (err) {
      console.error('Error procesando archivo:', err);
      setError('Error al procesar el archivo. Verifica que no esté dañado.');
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleFiles = (files) => {
    const file = files[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">Cargar archivo como fuente</span>
        <span className="text-xs text-slate-500">PDF, Excel, CSV</span>
      </div>

      {/* Zona de drop */}
      <div
        onClick={() => !processing && inputRef.current?.click()}
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
            <p className="text-sm text-slate-400">Procesando archivo...</p>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-slate-500" />
            <p className="text-sm text-slate-400">
              Arrastra un archivo aquí o{' '}
              <span className="text-brand-400 underline underline-offset-2">selecciónalo</span>
            </p>
            <p className="text-xs text-slate-600">El texto extraído se añadirá a la base de conocimiento</p>
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

      {/* Resultado */}
      {lastFile && (
        <div className="flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
          {fileIcon(lastFile.name)}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-200">{lastFile.name}</p>
            <p className="text-xs text-slate-400">
              {lastFile.chars.toLocaleString()} caracteres extraídos
              {lastFile.truncated && (
                <span className="ml-1 text-amber-400">(truncado al límite de {MAX_CHARS.toLocaleString()})</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Aviso de contexto largo */}
      {lastFile && lastFile.chars > WARN_CHARS && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-800/40 bg-amber-950/20 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          <p className="text-xs text-amber-300">
            El contexto es extenso ({lastFile.chars.toLocaleString()} caracteres). Considera resumir la información más relevante para mejores respuestas.
          </p>
        </div>
      )}
    </div>
  );
}
