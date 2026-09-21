import api from './client'

const PAGE_SIZE = 100

export const getTransactions = (params = {}) => {
  return api.get('/api/v1/transactions/get', {
    params,
  })
}

// Pages through the API so search, filters and totals always see every transaction.
export const getAllTransactions = async (maxPages = 20) => {
  const first = await getTransactions({ page: 1, limit: PAGE_SIZE })

  if (!Array.isArray(first.data?.items)) {
    throw new Error(
      'The API returned an unexpected response. Check that VITE_API_URL points at the backend.'
    )
  }

  const totalPages = first.data.pages || 1
  const pages = Math.min(totalPages, maxPages)
  const items = [...first.data.items]

  if (pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, index) =>
        getTransactions({ page: index + 2, limit: PAGE_SIZE })
      )
    )

    rest.forEach(response => items.push(...response.data.items))
  }

  return {
    items,
    total: first.data.total,
    truncated: totalPages > pages
  }
}

export const createTransaction = (data) => {
  return api.post('/api/v1/transactions/create', data)
}

export const updateTransaction = (id, data) => {
  return api.put(`/api/v1/transactions/update/${id}`, data)
}

export const deleteTransaction = (id) => {
  return api.delete(`/api/v1/transactions/delete/${id}`)
}
