import { BarChart3, LayoutDashboard, LogOut, Receipt, Target } from 'lucide-react'

import { initials } from '../lib/format'

export const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'categories', label: 'Categories', icon: BarChart3 },
  { id: 'budgets', label: 'Budgets', icon: Target }
]

export default function Sidebar({ user, page, onNavigate, onLogout, open, onClose }) {
  return (
    <>
      {open && <button type="button" className="drawer-backdrop" onClick={onClose} aria-label="Close navigation" />}

      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <div className="brand-mark">
            <img src="/budget.png" alt="Expense Tracker" width={24} height={24} />
          </div>

          <div>
            <div className="brand-name">Expense Tracker</div>
          </div>
        </div>

        <nav className="nav">
          <p className="nav-label">Workspace</p>

          {PAGES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={page === id ? 'nav-item active' : 'nav-item'}
              onClick={() => {
                onNavigate(id)
                onClose()
              }}
              aria-current={page === id ? 'page' : undefined}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-card">
            <div className="avatar">{initials(user.name || user.email)}</div>

            <div className="user-card-text">
              <b>{user.name || 'Your account'}</b>
              <small>{user.email}</small>
            </div>
          </div>

          <button type="button" className="btn btn-outline btn-block" onClick={onLogout}>
            <LogOut size={15} />
            Log out
          </button>
        </div>
      </aside>
    </>
  )
}
