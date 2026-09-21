import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  PiggyBank,
  PieChart,
  Plus,
  Receipt,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react'

import { categoryStyle, sortByDateDesc } from '../lib/categories'
import {
  budgetTotals,
  categoryTotals,
  monthStats,
  monthShort,
  recentMonths,
  shiftMonth,
  spendTone,
  totals
} from '../lib/finance'
import {
  currentMonthKey,
  formatDate,
  formatLongDate,
  greeting,
  money,
  monthKey,
  monthLabel,
  percentChange,
  signedMoney
} from '../lib/format'
import EmptyState from './EmptyState'

const DONUT_SLICES = 4

const Delta = ({ value, invert = false }) => {
  if (value === null) return <span className="delta flat">No prior data</span>

  const rounded = Math.round(Math.abs(value) * 10) / 10
  const isFlat = rounded < 0.1
  const isGood = invert ? value < 0 : value > 0
  const tone = isFlat ? 'flat' : isGood ? 'up' : 'down'

  return (
    <span className={`delta ${tone}`} title={`${value > 0 ? 'Up' : 'Down'} vs last month`}>
      {!isFlat && (value > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
      <span className="num">{rounded}%</span>
    </span>
  )
}

export default function Dashboard({ user, transactions, categories, budgets, onAddTransaction, onNavigate }) {
  const thisMonth = currentMonthKey()
  const lastMonth = shiftMonth(thisMonth, -1)

  const current = monthStats(transactions, thisMonth)
  const previous = monthStats(transactions, lastMonth)
  const allTime = totals(transactions)
  const budget = budgetTotals(budgets, thisMonth)

  const firstName = user.name?.trim().split(/\s+/)[0] || user.email.split('@')[0]

  const byCategory = categoryTotals(transactions, categories, thisMonth)
  const topExpense = byCategory[0]
  const groups = (() => {
    const top = byCategory.slice(0, DONUT_SLICES)
    const rest = byCategory.slice(DONUT_SLICES).reduce((sum, item) => sum + item.total, 0)

    return rest > 0 ? [...top, { id: 'other', name: 'Other', total: rest }] : top
  })()

  let cursor = 0
  const donutGradient = `conic-gradient(${groups
    .map(group => {
      const start = cursor
      cursor += current.expenses > 0 ? (group.total / current.expenses) * 100 : 0
      const color = group.id === 'other' ? 'var(--faint)' : categoryStyle(group.name).color

      return `${color} ${start}% ${cursor}%`
    })
    .join(', ')})`

  const months = recentMonths(6)
  const peak = Math.max(
    1,
    ...months.map(key => {
      const stats = monthStats(transactions, key)
      return Math.max(stats.income, stats.expenses)
    })
  )

  const recent = sortByDateDesc(transactions).slice(0, 5)

  const budgetWatch = budgets
    .filter(item => monthKey(item.month) === thisMonth)
    .map(item => ({
      ...item,
      name: categories.find(category => category.id === item.category_id)?.name || 'Uncategorized'
    }))
    .sort((a, b) => b.actual_spending / b.amount - a.actual_spending / a.amount)
    .slice(0, 4)

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">{formatLongDate(new Date())}</p>
          <h1 className="page-title">
            {greeting()}, {firstName}
          </h1>
          <p className="page-sub">Here&apos;s how your money is moving this month.</p>
        </div>

        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={onAddTransaction}>
            <Plus size={16} />
            Add transaction
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <article className="card kpi">
          <div className="kpi-top">
            <span className="kpi-icon income">
              <TrendingUp size={17} />
            </span>
            <Delta value={percentChange(current.income, previous.income)} />
          </div>

          <div>
            <p className="kpi-label">Income this month</p>
            <p className="kpi-value num">{money(current.income)}</p>
          </div>

          <p className="kpi-foot">
            {previous.income
              ? `${money(previous.income)} last month`
              : 'No income recorded last month'}
          </p>
        </article>

        <article className="card kpi">
          <div className="kpi-top">
            <span className="kpi-icon expense">
              <TrendingDown size={17} />
            </span>
            <Delta value={percentChange(current.expenses, previous.expenses)} invert />
          </div>

          <div>
            <p className="kpi-label">Expenses this month</p>
            <p className="kpi-value num">{money(current.expenses)}</p>
          </div>

          <p className="kpi-foot">
            {topExpense
              ? `Top: ${topExpense.name} · ${money(topExpense.total)}`
              : 'No expenses recorded yet'}
          </p>
        </article>

        <article className="card kpi">
          <div className="kpi-top">
            <span className="kpi-icon accent">
              <Wallet size={17} />
            </span>
          </div>

          <div>
            <p className="kpi-label">Total balance</p>
            <p className="kpi-value num">{money(allTime.balance)}</p>
          </div>

          <p className="kpi-foot">
            Net this month
            <b className={`amount ${current.net >= 0 ? 'text-income' : 'text-expense'}`}>
              {signedMoney(current.net, current.net >= 0 ? 'income' : 'expense')}
            </b>
          </p>
        </article>

        <article className="card kpi">
          <div className="kpi-top">
            <span className="kpi-icon warning">
              <PiggyBank size={17} />
            </span>

            {budget.count > 0 && (
              <span className={`badge ${budget.over > 0 ? 'bad' : 'good'}`}>
                {budget.over > 0 ? `${budget.over} over` : 'On track'}
              </span>
            )}
          </div>

          <div>
            <p className="kpi-label">Budget left</p>
            <p className="kpi-value num">{budget.count > 0 ? money(budget.remaining) : '—'}</p>
          </div>

          <p className="kpi-foot">
            {budget.count > 0
              ? `${money(budget.budgeted)} budgeted across ${budget.count} ${
                  budget.count === 1 ? 'category' : 'categories'
                }`
              : 'No budgets set for this month'}
          </p>
        </article>
      </div>

      <div className="grid-2">
        <section className="card chart">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Cash flow</h2>
              <p className="panel-sub">Income and expenses over the last six months</p>
            </div>

            <div className="legend">
              <span>
                <i className="legend-dot income" />
                Income
              </span>
              <span>
                <i className="legend-dot expense" />
                Expenses
              </span>
            </div>
          </div>

          <div className="bar-chart">
            {months.map(key => {
              const stats = monthStats(transactions, key)

              return (
                <div
                  key={key}
                  className="bar-group"
                  title={`${monthLabel(key)} — income ${money(stats.income)}, expenses ${money(
                    stats.expenses
                  )}`}
                >
                  <div className="bars">
                    <span
                      className={stats.income > 0 ? 'bar income' : 'bar zero'}
                      style={{ height: `${(stats.income / peak) * 100}%` }}
                    />
                    <span
                      className={stats.expenses > 0 ? 'bar expense' : 'bar zero'}
                      style={{ height: `${(stats.expenses / peak) * 100}%` }}
                    />
                  </div>

                  <small className="bar-label">{monthShort(key)}</small>
                </div>
              )
            })}
          </div>
        </section>

        <section className="card chart">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Where it went</h2>
              <p className="panel-sub">{monthLabel(thisMonth)} expenses by category</p>
            </div>
          </div>

          {groups.length === 0 ? (
            <EmptyState
              icon={PieChart}
              title="No expenses yet"
              message={`Add an expense in ${monthLabel(thisMonth)} to see where your money goes.`}
            />
          ) : (
            <>
              <div className="donut-wrap">
                <div className="donut" style={{ background: donutGradient }}>
                  <div className="donut-center">
                    <strong className="num">{money(current.expenses)}</strong>
                    <span>spent in {monthShort(thisMonth)}</span>
                  </div>
                </div>
              </div>

              <div className="legend-list">
                {groups.map(group => (
                  <div key={group.id} className="legend-row">
                    <i
                      style={{
                        background:
                          group.id === 'other' ? 'var(--faint)' : categoryStyle(group.name).color
                      }}
                    />
                    <span>{group.name}</span>
                    <b className="num">{money(group.total)}</b>
                    <small className="num">
                      {current.expenses > 0
                        ? `${Math.round((group.total / current.expenses) * 100)}%`
                        : '0%'}
                    </small>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <div className="grid-2">
        <section className="card chart">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Recent activity</h2>
              <p className="panel-sub">Your five latest transactions</p>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('transactions')}
            >
              View all
              <ArrowRight size={14} />
            </button>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              message="Add your first income or expense to get started."
              action={
                <button type="button" className="btn btn-outline btn-sm" onClick={onAddTransaction}>
                  <Plus size={14} />
                  Add transaction
                </button>
              }
            />
          ) : (
            <div className="feed">
              {recent.map(transaction => {
                const name =
                  categories.find(category => category.id === transaction.category_id)?.name ||
                  'Uncategorized'
                const style = categoryStyle(name)

                return (
                  <div key={transaction.id} className="feed-item">
                    <div className="feed-mark" style={{ background: style.tint, color: style.color }}>
                      {style.label.charAt(0).toUpperCase()}
                    </div>

                    <div className="feed-text">
                      <b>{transaction.description || 'Untitled transaction'}</b>
                      <small>
                        {name} · {formatDate(transaction.date)}
                      </small>
                    </div>

                    <span
                      className={`feed-amount ${
                        transaction.type === 'income' ? 'text-income' : ''
                      }`}
                    >
                      {signedMoney(transaction.amount, transaction.type)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="card chart">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Budget watch</h2>
              <p className="panel-sub">{monthLabel(thisMonth)} progress</p>
            </div>

            {budgetWatch.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onNavigate('budgets')}
              >
                Manage
                <ArrowRight size={14} />
              </button>
            )}
          </div>

          {budgetWatch.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No budgets this month"
              message="Set a monthly budget per category to track your spending limits."
              action={
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => onNavigate('budgets')}
                >
                  Create a budget
                </button>
              }
            />
          ) : (
            <div className="watch-list">
              {budgetWatch.map(item => {
                const ratio = item.amount > 0 ? item.actual_spending / item.amount : 0

                return (
                  <div key={item.id} className="watch-row">
                    <div className="watch-top">
                      <b>{item.name}</b>
                      <span className="num">
                        {money(item.actual_spending)} / {money(item.amount)}
                      </span>
                    </div>

                    <div className="progress">
                      <span
                        style={{
                          width: `${Math.min(ratio * 100, 100)}%`,
                          background: spendTone(ratio)
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
