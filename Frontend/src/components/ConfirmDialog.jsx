import Modal from './Modal'

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  busy = false,
  onConfirm,
  onClose
}) {
  return (
    <Modal title={title} onClose={busy ? () => {} : onClose}>
      <p className="page-sub">{message}</p>

      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>
          Cancel
        </button>

        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
          {busy && <span className="spinner" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
