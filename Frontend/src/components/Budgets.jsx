import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Target, Trash2 } from 'lucide-react'

import { categoryStyle } from '../lib/categories'
import { budgetTotals, shiftMonth, spendTone } from '../lib/finance'
import { currentMonthKey, money, monthKey, monthLabel } from '../lib/format'
import EmptyState from './EmptyState'

const badgeFor = ratio => {
  if (ratio >= 1) return ['bad', 'Over budget']
  if (ratio >= 0.8) return ['warn', 'Almost there']
  return ['good', 'On track']
}

export default function Budgets({ budgets, categories, onAdd, onDelete }) {
  const thisMonth = currentMonthKey()
  const [month, setMonth] = useState(thisMonth)

  const rows = useMemo(
    () =>
      budgets
        .filter(budget => monthKey(budget.month) === month)
        .map(budget => ({
          ...budget,
          name: categories.find(category => category.id === budget.category_id)?.name || 'Uncategorized'
        }))
        .sort((a, b) => b.actual_spending / b.amount - a.actual_spending / a.amount),
    [budgets, categories, month]
  )

  const summary = budgetTotals(budgets, month)

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Budgets</p>
          <h1 className="page-title">Spending limits</h1>
          <p className="page-sub">
            A monthly cap per category, measured against the expenses you record.
          </p>
        </div>

        <div className="page-actions">
          <div className="month-nav">
            <button
              type="button"
              className="icon-btn plain"
              onClick={() => setMonth(shiftMonth(month, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>

            <b className="num">{monthLabel(month)}</b>

            <button
              type="button"
              className="icon-btn plain"
              onClick={() => setMonth(shiftMonth(month, 1))}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {month !== thisMonth && (
            <button type="button" className="btn btn-ghost" onClick={() => setMonth(thisMonth)}>
              This month
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={onAdd}
            disabled={categories.length === 0}
            title={categories.length === 0 ? 'Create a category first' : undefined}
          >
            <Plus size={16} />
            New budget
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <section className="card">
          <EmptyState
            icon={Target}
            title={`No budgets for ${monthLabel(month)}`}
            message={
              categories.length === 0
                ? 'Create a category first, then set a monthly spending limit for it.'
                : 'Set a limit per category and Pocketwise will track how much of it you have used.'
            }
            action={
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={onAdd}
                disabled={categories.length === 0}
              >
                <Plus size={14} />
                New budget
              </button>
            }
          />
        </section>
      ) : (
        <>
          <section className="card budget-summary">
            <div>
              <small>Budgeted</small>
              <b className="num">{money(summary.budgeted)}</b>
            </div>

            <div>
              <small>Spent</small>
              <b className="num">{money(summary.spent)}</b>
            </div>

            <div>
              <small>Remaining</small>
              <b className={`num ${summary.remaining < 0 ? 'text-expense' : 'text-income'}`}>
                {money(summary.remaining)}
              </b>
            </div>
          </section>

          <div className="budget-grid">
            {rows.map(budget => {
              const style = categoryStyle(budget.name)
              const ratio = budget.amount > 0 ? budget.actual_spending / budget.amount : 0
              const [tone, label] = badgeFor(ratio)

              return (
                <article key={budget.id} className="card budget-tile">
                  <div className="budget-top">
                    <div className="budget-head">
                      <div
                        className="cat-mark"
                        style={{ background: style.tint, color: style.color }}
                        aria-hidden="true"
                      >
                        {style.label.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <h3 className="cat-name">{budget.name}</h3>
                        <p className="cat-meta">{monthLabel(month)}</p>
                      </div>
                    </div>

                    <div className="tile-actions">
                      <span className={`badge ${tone}`}>{label}</span>

                      <button
                        type="button"
                        className="icon-btn plain danger"
                        onClick={() => onDelete(budget)}
                        aria-label={`Delete ${budget.name} budget`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="budget-numbers">
                    <strong className="num">{money(budget.actual_spending)}</strong>
                    <span>of {money(budget.amount)}</span>
                  </div>

                  <div className="progress">
                    <span
                      style={{ width: `${Math.min(ratio * 100, 100)}%`, background: spendTone(ratio) }}
                    />
                  </div>

                  <div className="progress-foot">
                    <span className="num">{Math.round(ratio * 100)}% used</span>
                    <span className="num">
                      {budget.remaining < 0
                        ? `${money(Math.abs(budget.remaining))} over`
                        : `${money(budget.remaining)} left`}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
