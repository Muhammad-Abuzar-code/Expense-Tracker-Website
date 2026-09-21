import api from './client'

export const getBudgets = () => {
  return api.get('/api/v1/budgets/get')
}

export const createBudget = (data) => {
  return api.post('/api/v1/budgets/create', data)
}

export const deleteBudget = (id) => {
  return api.delete(`/api/v1/budgets/${id}`)
}

