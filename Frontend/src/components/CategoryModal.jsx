import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

import { errorText } from '../lib/useFinanceData'
import Modal from './Modal'

export default function CategoryModal({ category, categories, onClose, onSubmit }) {
  const editing = Boolean(category)

  const [name, setName] = useState(category?.name || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async event => {
    event.preventDefault()

    const value = name.trim()

    if (!value) {
      setError('Enter a category name.')
      return
    }

    const taken = categories.some(
      item =>
        item.id !== category?.id && item.name.trim().toLowerCase() === value.toLowerCase()
    )

    if (taken) {
      setError(`You already have a category called "${value}".`)
      return
    }

    setBusy(true)
    setError('')

    try {
      await onSubmit(value)
      onClose()
    } catch (submitError) {
      setError(errorText(submitError, 'Could not save this category.'))
      setBusy(false)
    }
  }

  return (
    <Modal
      title={editing ? 'Rename category' : 'New category'}
      subtitle={
        editing
          ? 'Transactions keep their history when a category is renamed.'
          : 'Categories group your transactions and can hold a monthly budget.'
      }
      onClose={busy ? () => {} : onClose}
    >
      <form onSubmit={submit}>
        <div className="modal-body">
          <label className="field">
            <span>Name</span>
            <input
              className="input"
              type="text"
              placeholder="e.g. Groceries"
              value={name}
              onChange={event => setName(event.target.value)}
              maxLength={60}
              autoFocus
            />
          </label>

          {error && (
            <p className="form-error">
              <AlertCircle size={14} />
              {error}
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>
            Cancel
          </button>

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy && <span className="spinner" />}
            {editing ? 'Save changes' : 'Create category'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
