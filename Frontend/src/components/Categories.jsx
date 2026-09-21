import { useEffect, useMemo, useState } from 'react'
import { BarChart3, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react'

import { categoryStyle } from '../lib/categories'
import { categoryUsage, monthShort, spendTone } from '../lib/finance'
import { currentMonthKey, money, monthKey } from '../lib/format'
import EmptyState from './EmptyState'

export default function Categories({
  categories,
  transactions,
  budgets,
  onAdd,
  onRename,
  onDelete
}) {
  const [menuId, setMenuId] = useState(null)
  const thisMonth = currentMonthKey()

  useEffect(() => {
    if (menuId === null) return undefined

    const closeMenu = event => {
      if (!event.target.closest('.menu-wrap')) setMenuId(null)
    }

    document.addEventListener('mousedown', closeMenu)
    return () => document.removeEventListener('mousedown', closeMenu)
  }, [menuId])

  const rows = useMemo(
    () =>
      categories.map(category => {
        let monthlySpend = 0
        let monthlyIncome = 0
        let hasExpense = false
        let hasIncome = false

        transactions.forEach(transaction => {
          if (transaction.category_id !== category.id) return

          if (transaction.type === 'income') {
            hasIncome = true
            if (monthKey(transaction.date) === thisMonth) monthlyIncome += transaction.amount
          } else {
            hasExpense = true
            if (monthKey(transaction.date) === thisMonth) monthlySpend += transaction.amount
          }
        })

        return {
          category,
          usage: categoryUsage(transactions, category.id),
          monthlySpend,
          monthlyIncome,
          incomeOnly: hasIncome && !hasExpense,
          budget: budgets.find(
            item => item.category_id === category.id && monthKey(item.month) === thisMonth
          )
        }
      }),
    [categories, transactions, budgets, thisMonth]
  )

  const uncategorized = useMemo(
    () =>
      transactions.reduce(
        (result, transaction) => {
          if (transaction.category_id != null) return result

          result.count += 1
          result.total += transaction.amount
          if (transaction.type === 'expense' && monthKey(transaction.date) === thisMonth) {
            result.monthlySpend += transaction.amount
          }

          return result
        },
        { count: 0, total: 0, monthlySpend: 0 }
      ),
    [transactions, thisMonth]
  )

  const renderFigures = ({ usage, budget, incomeOnly, monthlyIncome, monthlySpend }) => {
    const ratio = budget && budget.amount > 0 ? budget.actual_spending / budget.amount : 0
    const amount = incomeOnly ? monthlyIncome : monthlySpend

    return (
      <>
        <div className="cat-figures">
          <strong className="num">{money(amount)}</strong>
          <span>{incomeOnly ? 'earned' : 'spent'} in {monthShort(thisMonth)}</span>
        </div>

        {budget ? (
          <>
            <div className="progress">
              <span
                style={{ width: `${Math.min(ratio * 100, 100)}%`, background: spendTone(ratio) }}
              />
            </div>

            <div className="progress-foot">
              <span className="num">{money(budget.amount)} budget</span>
              <span className="num">
                {budget.remaining < 0
                  ? `${money(Math.abs(budget.remaining))} over`
                  : `${money(budget.remaining)} left`}
              </span>
            </div>
          </>
        ) : (
          <p className="cat-meta">
            {usage.count} {usage.count === 1 ? 'transaction' : 'transactions'} · {money(usage.total)}{' '}
            all time
          </p>
        )}
      </>
    )
  }

  if (categories.length === 0 && uncategorized.count === 0) {
    return (
      <>
        <div className="page-head">
          <div>
            <p className="eyebrow">Categories</p>
            <h1 className="page-title">Categories</h1>
            <p className="page-sub">Group your transactions and track a monthly limit per group.</p>
          </div>
        </div>

        <section className="card">
          <EmptyState
            icon={BarChart3}
            title="No categories yet"
            message="Create categories like Groceries, Rent or Salary to organise where your money goes."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={onAdd}>
                <Plus size={14} />
                New category
              </button>
            }
          />
        </section>
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Categories</p>
          <h1 className="page-title">Categories</h1>
          <p className="page-sub">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} ·{' '}
            {uncategorized.count} uncategorized{' '}
            {uncategorized.count === 1 ? 'transaction' : 'transactions'}
          </p>
        </div>

        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={onAdd}>
            <Plus size={16} />
            New category
          </button>
        </div>
      </div>

      <div className="card-grid">
        {rows.map(row => {
          const { category, usage, budget } = row
          const style = categoryStyle(category.name)

          return (
            <article key={category.id} className="card cat-card">
              <div className="cat-top">
                <div
                  className="cat-mark"
                  style={{ background: style.tint, color: style.color }}
                  aria-hidden="true"
                >
                  {style.label.charAt(0).toUpperCase()}
                </div>

                <div className="menu-wrap">
                  <button
                    type="button"
                    className="icon-btn plain"
                    onClick={() => setMenuId(current => (current === category.id ? null : category.id))}
                    aria-label={`Actions for ${category.name}`}
                    aria-expanded={menuId === category.id}
                  >
                    <MoreVertical size={17} />
                  </button>

                  {menuId === category.id && (
                    <div className="dropdown">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuId(null)
                          onRename(category)
                        }}
                      >
                        <Pencil size={14} />
                        Rename
                      </button>

                      <button
                        type="button"
                        className="danger"
                        onClick={() => {
                          setMenuId(null)
                          onDelete(category)
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="cat-name">{category.name}</h3>
                {budget && (
                  <p className="cat-meta">
                    {usage.count} {usage.count === 1 ? 'transaction' : 'transactions'} ·{' '}
                    {money(usage.total)} all time
                  </p>
                )}
              </div>

              {renderFigures(row)}
            </article>
          )
        })}

        {uncategorized.count > 0 && (
          <article className="card cat-card">
            <div className="cat-top">
              <div
                className="cat-mark"
                style={{
                  background: categoryStyle('Uncategorized').tint,
                  color: categoryStyle('Uncategorized').color
                }}
                aria-hidden="true"
              >
                ?
              </div>
            </div>

            <div>
              <h3 className="cat-name">Uncategorized</h3>
              <p className="cat-meta">
                Transactions with no category · {money(uncategorized.total)} all time
              </p>
            </div>

            <div className="cat-figures">
              <strong className="num">{money(uncategorized.monthlySpend)}</strong>
              <span>spent in {monthShort(thisMonth)}</span>
            </div>

            <p className="cat-meta">
              Edit a transaction and pick a category to file it under one.
            </p>
          </article>
        )}

        <button type="button" className="add-tile" onClick={onAdd}>
          <Plus size={20} />
          New category
        </button>
      </div>
    </>
  )
}
