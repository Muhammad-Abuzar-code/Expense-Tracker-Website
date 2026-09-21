import api from './client'

export const getCategories = () => {
  return api.get('/api/v1/categories/get')
}

export const createCategory = (data) => {
  return api.post('/api/v1/categories/create', data)
}

export const updateCategory = (id, data) => {
  return api.put(`/api/v1/categories/${id}`, data)
}

export const deleteCategory = (id) => {
  return api.delete(`/api/v1/categories/${id}`)
}

