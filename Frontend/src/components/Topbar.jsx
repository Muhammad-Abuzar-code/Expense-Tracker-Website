import { useEffect, useRef } from 'react'
import { Menu, Moon, Search, Sun, X } from 'lucide-react'

import { initials } from '../lib/format'

export default function Topbar({ query, onQueryChange, onOpenNav, theme, onToggleTheme, user }) {
  const inputRef = useRef(null)

  useEffect(() => {
    const onKeyDown = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <header className="topbar">
      <button type="button" className="icon-btn hamburger" onClick={onOpenNav} aria-label="Open navigation">
        <Menu size={18} />
      </button>

      <div className="search">
        <Search size={16} />

        <input
          ref={inputRef}
          value={query}
          onChange={event => onQueryChange(event.target.value)}
          placeholder="Search transactions…"
          aria-label="Search transactions"
        />

        {query && (
          <button
            type="button"
            className="search-clear"
            onClick={() => onQueryChange('')}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="topbar-actions">
        <span className="theme-label">
          {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        </span>

        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="avatar" title={user.email}>
          {initials(user.name || user.email)}
        </div>
      </div>
    </header>
  )
}
