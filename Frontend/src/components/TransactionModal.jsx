import { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'

import { toISODate } from '../lib/format'
import { errorText } from '../lib/useFinanceData'
import Modal from './Modal'

const TYPES = [
  ['expense', 'Expense'],
  ['income', 'Income']
]

const NEW_CATEGORY = '__new__'

export default function TransactionModal({
  transaction,
  categories,
  onClose,
  onSubmit,
  onCreateCategory
}) {
  const editing = Boolean(transaction)

  const [type, setType] = useState(transaction?.type || 'expense')
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [description, setDescription] = useState(transaction?.description || '')
  const [date, setDate] = useState(transaction?.date || toISODate(new Date()))
  const [categoryId, setCategoryId] = useState(
    transaction?.category_id != null ? String(transaction.category_id) : 'none'
  )
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async event => {
    event.preventDefault()

    const value = Number(amount)
    const name = newCategory.trim()

    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }

    if (!date) {
      setError('Pick the date this transaction happened.')
      return
    }

    if (creatingCategory) {
      if (!name) {
        setError('Give the new category a name.')
        return
      }

      if (categories.some(category => category.name.trim().toLowerCase() === name.toLowerCase())) {
        setError(`"${name}" already exists — choose it from the list instead.`)
        return
      }
    }

    setBusy(true)
    setError('')

    try {
      let targetId = categoryId === 'none' ? null : Number(categoryId)

      if (creatingCategory) {
        const created = await onCreateCategory(name)
        targetId = created.id
      }

      await onSubmit(
        {
          amount: value,
          type,
          description: description.trim() || null,
          date,
          category_id: targetId
        },
        transaction?.id
      )

      onClose()
    } catch (submitError) {
      setError(errorText(submitError, 'Could not save this transaction.'))
      setBusy(false)
    }
  }

  return (
    <Modal
      title={editing ? 'Edit transaction' : 'New transaction'}
      subtitle={
        editing ? 'Change the details and save.' : 'Log money coming in or going out of your account.'
      }
      onClose={busy ? () => {} : onClose}
    >
      <form onSubmit={submit}>
        <div className="modal-body">
          <div className="field">
            <span>Type</span>

            <div className="segmented fill">
              {TYPES.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={type === value ? 'active' : ''}
                  onClick={() => setType(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Amount</span>
              <input
                className="input num"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={event => setAmount(event.target.value)}
                autoFocus
              />
            </label>

            <label className="field">
              <span>Date</span>
              <input
                className="input"
                type="date"
                value={date}
                onChange={event => setDate(event.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span>Description</span>
            <input
              className="input"
              type="text"
              placeholder="e.g. Groceries at the market"
              value={description}
              onChange={event => setDescription(event.target.value)}
              maxLength={255}
            />
          </label>

          <label className="field">
            <span>Category</span>
            <select
              className="select"
              value={creatingCategory ? NEW_CATEGORY : categoryId}
              onChange={event => {
                if (event.target.value === NEW_CATEGORY) setCreatingCategory(true)
                else {
                  setCreatingCategory(false)
                  setCategoryId(event.target.value)
                }
              }}
            >
              <option value="none">No category</option>

              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}

              <option value={NEW_CATEGORY}>+ New category…</option>
            </select>
          </label>

          {creatingCategory && (
            <div className="field">
              <span>New category name</span>

              <div className="inline-field">
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Groceries"
                  value={newCategory}
                  onChange={event => setNewCategory(event.target.value)}
                  maxLength={60}
                  autoFocus
                />

                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => {
                    setCreatingCategory(false)
                    setNewCategory('')
                  }}
                  aria-label="Cancel new category"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

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
            {editing ? 'Save changes' : 'Add transaction'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
