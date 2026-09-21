import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Info } from 'lucide-react'

import { currentMonthKey, monthKey, monthLabel } from '../lib/format'
import { errorText } from '../lib/useFinanceData'
import Modal from './Modal'

export default function BudgetModal({ categories, budgets, defaultMonth, onClose, onSubmit }) {
  const [month, setMonth] = useState(defaultMonth || currentMonthKey())
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const available = useMemo(
    () =>
      categories.filter(
        category =>
          !budgets.some(
            budget => budget.category_id === category.id && monthKey(budget.month) === month
          )
      ),
    [categories, budgets, month]
  )

  useEffect(() => {
    setCategoryId(current =>
      available.some(item => String(item.id) === current) ? current : String(available[0]?.id ?? '')
    )
  }, [available])

  const submit = async event => {
    event.preventDefault()

    const value = Number(amount)

    if (!categoryId) {
      setError('Choose a category for this budget.')
      return
    }

    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a budget greater than zero.')
      return
    }

    setBusy(true)
    setError('')

    try {
      await onSubmit({
        category_id: Number(categoryId),
        amount: value,
        month: `${month}-01`
      })

      onClose()
    } catch (submitError) {
      setError(errorText(submitError, 'Could not save this budget.'))
      setBusy(false)
    }
  }

  return (
    <Modal
      title="New budget"
      subtitle="One limit per category per month — spending is counted from your expenses."
      onClose={busy ? () => {} : onClose}
    >
      <form onSubmit={submit}>
        <div className="modal-body">
          <label className="field">
            <span>Month</span>
            <input
              className="input"
              type="month"
              value={month}
              onChange={event => setMonth(event.target.value || currentMonthKey())}
            />
          </label>

          {available.length === 0 ? (
            <p className="note">
              <Info size={15} />
              {categories.length === 0
                ? 'Create a category first, then set a monthly budget for it.'
                : `Every category already has a budget for ${monthLabel(month)}.`}
            </p>
          ) : (
            <label className="field">
              <span>Category</span>
              <select
                className="select"
                value={categoryId}
                onChange={event => setCategoryId(event.target.value)}
              >
                {available.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="field">
            <span>Monthly limit</span>
            <input
              className="input num"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={event => setAmount(event.target.value)}
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

          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || available.length === 0}
          >
            {busy && <span className="spinner" />}
            Create budget
          </button>
        </div>
      </form>
    </Modal>
  )
}
