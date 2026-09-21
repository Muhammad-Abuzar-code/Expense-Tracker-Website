import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div>
            <h2 className="modal-title">{title}</h2>
            {subtitle && <p className="modal-sub">{subtitle}</p>}
          </div>

          <button type="button" className="icon-btn plain" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
