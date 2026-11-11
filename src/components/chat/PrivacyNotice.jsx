import { ShieldCheck } from 'lucide-react';

// ─── Texto del aviso de privacidad ─────────────────────────────────────────────
// Edita aquí el contenido. {botName} y {retentionDays} se reemplazan con los datos reales.
// Es un texto base: conviene que lo revise quien asesore al negocio en protección de datos.
const NOTICE_TITLE = 'Aviso de privacidad';

const NOTICE_PARAGRAPHS = [
  'Responsable: el negocio que administra el asistente «{botName}» es el responsable del tratamiento de los datos que escribas en este chat.',
  'Finalidad: tus mensajes se usan únicamente para atender tus consultas y, si lo pides, gestionar citas con el negocio. Para generar las respuestas, los mensajes se procesan con un servicio de inteligencia artificial de terceros (Google Gemini).',
  'Conservación: la conversación se guarda durante {retentionDays} días desde tu último mensaje y después se elimina automáticamente. Puedes borrarla antes con la opción «Borrar mi conversación».',
  'Tus derechos: de acuerdo con la Ley 1581 de 2012 de protección de datos personales de Colombia, puedes conocer, actualizar, rectificar y suprimir tus datos, y revocar esta autorización. Para ejercerlos, contacta al negocio.',
  'No compartas en este chat datos sensibles como información de salud, datos financieros o contraseñas.',
];

const ACCEPT_LABEL = 'Acepto y quiero continuar';
// ───────────────────────────────────────────────────────────────────────────────

function fill(text, values) {
  return text.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));
}

export default function PrivacyNotice({ botName, retentionDays, onAccept, onClose }) {
  const values = { botName, retentionDays };

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-brand-400" />
        <h2 className="text-sm font-semibold text-slate-100">{NOTICE_TITLE}</h2>
      </div>
      <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-300">
        {NOTICE_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph}>{fill(paragraph, values)}</p>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          >
            Cerrar
          </button>
        )}
        {onAccept && (
          <button
            type="button"
            onClick={onAccept}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-500"
          >
            {ACCEPT_LABEL}
          </button>
        )}
      </div>
    </div>
  );
}
