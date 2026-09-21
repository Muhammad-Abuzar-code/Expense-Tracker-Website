import { useState } from 'react'
import { AlertTriangle, Info, RefreshCw } from 'lucide-react'

import AuthScreen from './components/AuthScreen'
import BudgetModal from './components/BudgetModal'
import Budgets from './components/Budgets'
import Categories from './components/Categories'
import CategoryModal from './components/CategoryModal'
import ConfirmDialog from './components/ConfirmDialog'
import Dashboard from './components/Dashboard'
import EmptyState from './components/EmptyState'
import PageSkeleton from './components/PageSkeleton'
import Sidebar from './components/Sidebar'
import ToastStack from './components/ToastStack'
import Topbar from './components/Topbar'
import TransactionModal from './components/TransactionModal'
import Transactions from './components/Transactions'
import { useAuth } from './context/AuthContext'
import { useTheme } from './lib/useTheme'
import { useToasts } from './lib/useToasts'
import { errorText, useFinanceData } from './lib/useFinanceData'

function FinanceApp({ user, onLogout }) {
  const {
    transactions,
    categories,
    budgets,
    truncated,
    status,
    error,
    warnings,
    reload,
    saveTransaction,
    removeTransaction,
    addCategory,
    renameCategory,
    removeCategory,
    addBudget,
    removeBudget
  } = useFinanceData()

  const { theme, toggleTheme } = useTheme()
  const { toasts, notify, dismiss } = useToasts()

  const [page, setPage] = useState('dashboard')
  const [query, setQuery] = useState('')
  const [navOpen, setNavOpen] = useState(false)

  const [transactionForm, setTransactionForm] = useState(null)
  const [categoryForm, setCategoryForm] = useState(null)
  const [budgetOpen, setBudgetOpen] = useState(false)

  const [confirmState, setConfirmState] = useState(null)
  const [confirmBusy, setConfirmBusy] = useState(false)

  const openTransaction = (transaction = null) => setTransactionForm({ transaction })
  const openCategory = (category = null) => setCategoryForm({ category })

  const handleQueryChange = value => {
    setQuery(value)
    if (value && page !== 'transactions') setPage('transactions')
  }

  const submitTransaction = async (payload, editingId) => {
    await saveTransaction(payload, editingId)
    notify(editingId ? 'Transaction updated.' : 'Transaction added.')
  }

  const submitCategory = async name => {
    if (categoryForm?.category) {
      await renameCategory(categoryForm.category.id, name)
      notify('Category renamed.')
    } else {
      await addCategory(name)
      notify('Category created.')
    }
  }

  const submitBudget = async payload => {
    await addBudget(payload)
    notify('Budget created.')
  }

  const requestDeleteTransaction = transaction =>
    setConfirmState({
      title: 'Delete transaction',
      message: `"${
        transaction.description || 'Untitled transaction'
      }" will be permanently removed. This cannot be undone.`,
      confirmLabel: 'Delete transaction',
      run: async () => {
        await removeTransaction(transaction.id)
        notify('Transaction deleted.')
      }
    })

  const requestDeleteCategory = category =>
    setConfirmState({
      title: `Delete "${category.name}"?`,
      message:
        'Its budgets are removed and every transaction in it becomes uncategorized. Transactions are kept.',
      confirmLabel: 'Delete category',
      run: async () => {
        await removeCategory(category.id)
        notify(`"${category.name}" deleted.`)
      }
    })

  const requestDeleteBudget = budget =>
    setConfirmState({
      title: 'Delete budget',
      message: `The ${budget.amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      })} limit for this category will be removed. Transactions stay untouched.`,
      confirmLabel: 'Delete budget',
      run: async () => {
        await removeBudget(budget.id)
        notify('Budget deleted.')
      }
    })

  const runConfirm = async () => {
    if (!confirmState) return

    setConfirmBusy(true)

    try {
      await confirmState.run()
    } catch (actionError) {
      notify(errorText(actionError, 'That action could not be completed.'), 'error')
    } finally {
      setConfirmBusy(false)
      setConfirmState(null)
    }
  }

  const pageContent = {
    dashboard: (
      <Dashboard
        user={user}
        transactions={transactions}
        categories={categories}
        budgets={budgets}
        onAddTransaction={() => openTransaction()}
        onNavigate={setPage}
      />
    ),
    transactions: (
      <Transactions
        transactions={transactions}
        categories={categories}
        query={query}
        onQueryChange={setQuery}
        onAdd={() => openTransaction()}
        onEdit={openTransaction}
        onDelete={requestDeleteTransaction}
      />
    ),
    categories: (
      <Categories
        categories={categories}
        transactions={transactions}
        budgets={budgets}
        onAdd={() => openCategory()}
        onRename={openCategory}
        onDelete={requestDeleteCategory}
      />
    ),
    budgets: (
      <Budgets
        budgets={budgets}
        categories={categories}
        onAdd={() => setBudgetOpen(true)}
        onDelete={requestDeleteBudget}
      />
    )
  }

  return (
    <div className="shell">
      <Sidebar
        user={user}
        page={page}
        onNavigate={setPage}
        onLogout={onLogout}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <div className="main">
        <Topbar
          user={user}
          query={query}
          onQueryChange={handleQueryChange}
          onOpenNav={() => setNavOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="content">
          {warnings.length > 0 && (
            <p className="banner">
              <AlertTriangle size={15} />
              <span>
                Some data could not be loaded ({warnings.join(', ')}), so the numbers below may be
                incomplete.
              </span>
              <button type="button" className="btn btn-outline btn-sm" onClick={reload}>
                <RefreshCw size={13} />
                Retry
              </button>
            </p>
          )}

          {truncated && (
            <p className="banner">
              <Info size={15} />
              <span>
                Showing your 2,000 most recent transactions. Older records are not included in these
                totals.
              </span>
            </p>
          )}

          {status === 'loading' ? (
            <PageSkeleton />
          ) : status === 'error' ? (
            <section className="card">
              <EmptyState
                icon={AlertTriangle}
                title="We could not load your data"
                message={error}
                action={
                  <button type="button" className="btn btn-primary btn-sm" onClick={reload}>
                    <RefreshCw size={14} />
                    Try again
                  </button>
                }
              />
            </section>
          ) : (
            pageContent[page]
          )}
        </main>
      </div>

      {transactionForm && (
        <TransactionModal
          transaction={transactionForm.transaction}
          categories={categories}
          onClose={() => setTransactionForm(null)}
          onSubmit={submitTransaction}
          onCreateCategory={addCategory}
        />
      )}

      {categoryForm && (
        <CategoryModal
          category={categoryForm.category}
          categories={categories}
          onClose={() => setCategoryForm(null)}
          onSubmit={submitCategory}
        />
      )}

      {budgetOpen && (
        <BudgetModal
          categories={categories}
          budgets={budgets}
          onClose={() => setBudgetOpen(false)}
          onSubmit={submitBudget}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          busy={confirmBusy}
          onConfirm={runConfirm}
          onClose={() => setConfirmState(null)}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

export default function App() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="boot">
        <div className="boot-inner">
          <span className="spinner" />
          Restoring your session…
        </div>
      </div>
    )
  }

  return user ? <FinanceApp user={user} onLogout={logout} /> : <AuthScreen />
}
