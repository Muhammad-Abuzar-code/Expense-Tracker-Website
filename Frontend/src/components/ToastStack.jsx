import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export default function ToastStack({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.tone}`}>
          {toast.tone === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}

          <span>{toast.message}</span>

          <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
