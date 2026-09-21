import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Receipt,
  SearchX,
  Trash2,
  X
} from 'lucide-react'

import { categoryNameById, categoryStyle } from '../lib/categories'
import { monthKeysOf } from '../lib/finance'
import { formatDate, monthKey, monthLabel, signedMoney } from '../lib/format'
import EmptyState from './EmptyState'

const PAGE_SIZE = 10
const TYPE_TABS = [
  ['all', 'All'],
  ['income', 'Income'],
  ['expense', 'Expenses']
]

const pageItems = (page, pageCount) => {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1)

  const wanted = [...new Set([1, pageCount, page - 1, page, page + 1])]
    .filter(item => item >= 1 && item <= pageCount)
    .sort((a, b) => a - b)

  const items = []
  let previous = 0

  wanted.forEach(item => {
    if (item - previous > 1) items.push(`gap-${item}`)
    items.push(item)
    previous = item
  })

  return items
}

export default function Transactions({
  transactions,
  categories,
  query,
  onQueryChange,
  onAdd,
  onEdit,
  onDelete
}) {
  const [type, setType] = useState('all')
  const [categoryId, setCategoryId] = useState('all')
  const [month, setMonth] = useState('all')
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' })
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [query, type, categoryId, month])

  const months = useMemo(() => monthKeysOf(transactions), [transactions])
  const hasUncategorized = transactions.some(item => item.category_id == null)

  const counts = useMemo(
    () => ({
      all: transactions.length,
      income: transactions.filter(item => item.type === 'income').length,
      expense: transactions.filter(item => item.type === 'expense').length
    }),
    [transactions]
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return transactions
      .filter(item => {
        if (type !== 'all' && item.type !== type) return false
        if (month !== 'all' && monthKey(item.date) !== month) return false

        if (categoryId === 'none' && item.category_id != null) return false
        if (
          categoryId !== 'all' &&
          categoryId !== 'none' &&
          item.category_id !== Number(categoryId)
        ) {
          return false
        }

        if (!needle) return true

        const name = categoryNameById(item.category_id, categories)
        return `${item.description || ''} ${name}`.toLowerCase().includes(needle)
      })
      .sort((a, b) => {
        const factor = sort.dir === 'asc' ? 1 : -1

        if (sort.field === 'amount') return (a.amount - b.amount) * factor

        const difference = new Date(a.date) - new Date(b.date)
        return (difference !== 0 ? difference : a.id - b.id) * factor
      })
  }, [transactions, categories, type, categoryId, month, query, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * PAGE_SIZE
  const rows = filtered.slice(start, start + PAGE_SIZE)

  const filtersActive = type !== 'all' || categoryId !== 'all' || month !== 'all' || Boolean(query)

  const toggleSort = field =>
    setSort(current =>
      current.field === field
        ? { field, dir: current.dir === 'desc' ? 'asc' : 'desc' }
        : { field, dir: 'desc' }
    )

  const clearFilters = () => {
    setType('all')
    setCategoryId('all')
    setMonth('all')
    onQueryChange('')
  }

  const sortIcon = field =>
    sort.field !== field ? (
      <ArrowUpDown size={12} />
    ) : sort.dir === 'desc' ? (
      <ArrowDown size={12} />
    ) : (
      <ArrowUp size={12} />
    )

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Transactions</p>
          <h1 className="page-title">Every transaction</h1>
          <p className="page-sub">
            {counts.all} {counts.all === 1 ? 'record' : 'records'} · {counts.income} income ·{' '}
            {counts.expense} expenses
          </p>
        </div>

        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={onAdd}>
            <Plus size={16} />
            Add transaction
          </button>
        </div>
      </div>

      <section className="card table-panel">
        <div className="table-toolbar">
          <div className="segmented">
            {TYPE_TABS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={type === value ? 'active' : ''}
                onClick={() => setType(value)}
              >
                {label} <span className="num">{counts[value]}</span>
              </button>
            ))}
          </div>

          <div className="toolbar-filters">
            {query && (
              <span className="chip">
                <span>Search: {query}</span>
                <button type="button" onClick={() => onQueryChange('')} aria-label="Clear search">
                  <X size={12} />
                </button>
              </span>
            )}

            <select
              className="select"
              value={categoryId}
              onChange={event => setCategoryId(event.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
              {hasUncategorized && <option value="none">Uncategorized</option>}
            </select>

            {months.length > 0 && (
              <select
                className="select"
                value={month}
                onChange={event => setMonth(event.target.value)}
                aria-label="Filter by month"
              >
                <option value="all">All months</option>
                {months.map(key => (
                  <option key={key} value={key}>
                    {monthLabel(key)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            message="Record your first income or expense and it will show up here."
            action={
              <button type="button" className="btn btn-outline btn-sm" onClick={onAdd}>
                <Plus size={14} />
                Add transaction
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Nothing matches those filters"
            message="Try a different search term, category or month."
            action={
              <button type="button" className="btn btn-outline btn-sm" onClick={clearFilters}>
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>
                      <button
                        type="button"
                        className={sort.field === 'date' ? 'sort-btn on' : 'sort-btn'}
                        onClick={() => toggleSort('date')}
                      >
                        Date
                        {sortIcon('date')}
                      </button>
                    </th>
                    <th className="col-category">Category</th>
                    <th className="col-right">
                      <button
                        type="button"
                        className={sort.field === 'amount' ? 'sort-btn on' : 'sort-btn'}
                        onClick={() => toggleSort('amount')}
                      >
                        Amount
                        {sortIcon('amount')}
                      </button>
                    </th>
                    <th>Description</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {rows.map(transaction => {
                    const name = categoryNameById(transaction.category_id, categories)
                    const style = categoryStyle(name)

                    return (
                      <tr key={transaction.id}>
                        <td className="num">{formatDate(transaction.date)}</td>

                        <td className="col-category">
                          <span className="chip">
                            <i style={{ background: style.color }} />
                            <span>{name}</span>
                          </span>
                        </td>

                        <td className="col-right">
                          <span className={`amount ${transaction.type}`}>
                            {signedMoney(transaction.amount, transaction.type)}
                          </span>
                        </td>

                        <td>
                          <div className="tx-name">
                            <div
                              className="tx-icon"
                              style={{ background: style.tint, color: style.color }}
                            >
                              {style.label.charAt(0).toUpperCase()}
                            </div>
                            <span>{transaction.description || 'Untitled transaction'}</span>
                          </div>
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => onEdit(transaction)}
                              aria-label={`Edit ${transaction.description || 'transaction'}`}
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              type="button"
                              className="icon-btn danger"
                              onClick={() => onDelete(transaction)}
                              aria-label={`Delete ${transaction.description || 'transaction'}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span className="num">
                Showing {start + 1}–{start + rows.length} of {filtered.length}
                {filtered.length !== transactions.length ? ` (${transactions.length} total)` : ''}
              </span>

              <div className="pager">
                <button
                  type="button"
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>

                {pageItems(currentPage, pageCount).map(item =>
                  typeof item === 'number' ? (
                    <button
                      key={item}
                      type="button"
                      className={item === currentPage ? 'page-btn on' : 'page-btn'}
                      onClick={() => setPage(item)}
                    >
                      {item}
                    </button>
                  ) : (
                    <span key={item} className="page-gap">
                      …
                    </span>
                  )
                )}

                <button
                  type="button"
                  className="page-btn"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}

        {filtersActive && filtered.length > 0 && (
          <div className="pagination plain">
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
              <X size={13} />
              Clear filters
            </button>
          </div>
        )}
      </section>
    </>
  )
}
