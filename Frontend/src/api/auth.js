import api from './client'

export const login = ({ email, password }) => {
  const formData = new URLSearchParams()

  formData.append('username', email)
  formData.append('password', password)

  return api.post('/api/v1/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
}

export const register = (userData) => {
  return api.post('/api/v1/auth/register', userData)
}

export const getCurrentUser = () => {
  return api.get('/api/v1/auth/me')
}

