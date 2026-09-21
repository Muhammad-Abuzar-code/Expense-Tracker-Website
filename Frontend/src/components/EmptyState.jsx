export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="empty">
      {Icon && (
        <div className="empty-icon">
          <Icon size={20} />
        </div>
      )}

      <b>{title}</b>
      {message && <p>{message}</p>}
      {action}
    </div>
  )
}
