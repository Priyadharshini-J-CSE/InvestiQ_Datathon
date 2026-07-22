import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 45000 })
const aiApi = axios.create({ baseURL: '/ai', timeout: 30000 })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authService = {
  login: (credentials) => api.post('/login', credentials),
  logout: () => { localStorage.removeItem('token'); localStorage.removeItem('user') },
}

export const dashboardService = {
  getStats: () => api.get('/dashboard'),
  getAnalytics: () => api.get('/analytics'),
}

export const firService = {
  getAll: (params) => api.get('/fir', { params }),
  getById: (id) => api.get(`/fir/${id}`),
  upload: (formData) => api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export const criminalService = {
  getAll: (params) => api.get('/criminals', { params }),
  getById: (id) => api.get(`/criminals/${id}`),
}

export const searchService = {
  search: (query, filters) => api.post('/search', { query, filters }),
}

export const assistantService = {
  ask: (message, history) => api.post('/assistant', { message, history }),
}

export const aiService = {
  ask: (query) => aiApi.post('/ask', { query }),
  search: (query) => aiApi.post('/search', { query }),
  ingest: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return aiApi.post('/ingest', fd)
  },
}

export default api
