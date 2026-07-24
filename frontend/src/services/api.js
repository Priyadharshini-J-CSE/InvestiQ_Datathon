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
  getHeatmap: () => api.get('/heatmap'),
}

const crud = (base) => ({
  getAll: (params) => api.get(base, { params }),
  getById: (id) => api.get(`${base}/${id}`),
  create: (data) => api.post(base, data),
  update: (id, data) => api.put(`${base}/${id}`, data),
  remove: (id) => api.delete(`${base}/${id}`),
})

export const firService = crud('/fir')
export const personService = crud('/persons')
export const criminalService = crud('/criminals')
export const wantedService = crud('/wanted')
export const caseService = crud('/cases')
export const chargeService = crud('/charges')
export const arrestService = crud('/arrests')
export const convictionService = crud('/convictions')
export const evidenceService = crud('/evidence')
export const officerService = {
  ...crud('/officers'),
  getList: () => api.get('/officers/list'),
}
export const userService = crud('/users')

export const adminService = {
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getActivityLogs: (params) => api.get('/admin/activity-logs', { params }),
  getStations: (params) => api.get('/admin/stations', { params }),
  createStation: (data) => api.post('/admin/stations', data),
  getDistricts: () => api.get('/admin/districts'),
}

export const searchService = {
  search: (query, filters) => api.post('/search', { query, filters }),
  semanticSearch: (query, top_k = 10) => api.post('/ai/search', { query, top_k }),
}

export const assistantService = {
  ask: (message, history) => api.post('/assistant', { message, history }),
  getChatHistory: () => api.get('/ai/chat-history'),
  saveChatHistory: (message, response) => api.post('/ai/chat-history', { message, response }),
}

export const aiService = {
  ask: (query) => aiApi.post('/ask', { query }),
  summarize: (text, fir_id) => api.post('/ai/summarize', { text, fir_id }),
  predict: (district) => api.post('/ai/predict', { district }),
  behavioralProfile: (criminal_id, name) => api.post('/ai/profile', { criminal_id, name }),
  network: (query) => api.post('/ai/network', { query }),
}

export const reportService = {
  getSummary: () => api.get('/reports/summary'),
  getMonthly: (year) => api.get('/reports/monthly', { params: { year } }),
}

export const uploadService = {
  upload: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  }
}

// ── New services ──────────────────────────────────────────────────────────────

export const complainantService = {
  ...crud('/complainants'),
  getByFIR: (firId) => api.get(`/fir/${firId}/complainants`),
}

export const victimService = {
  ...crud('/victims'),
  getByFIR: (firId) => api.get(`/fir/${firId}/victims`),
}

export const accusedService = {
  ...crud('/accused'),
  getByFIR: (firId) => api.get(`/fir/${firId}/accused`),
}

export const chargesheetService = {
  ...crud('/chargesheets'),
  getByFIR: (firId) => api.get(`/fir/${firId}/chargesheets`),
}

export const firDetailService = {
  getDetail: (id) => api.get(`/fir/${id}/detail`),
}

export const policeUnitService = crud('/police-units')
export const courtService = crud('/courts')

export const masterService = {
  // States
  getStates: () => api.get('/master/states'),
  createState: (d) => api.post('/master/states', d),
  updateState: (id, d) => api.put(`/master/states/${id}`, d),
  deleteState: (id) => api.delete(`/master/states/${id}`),
  // Districts
  getDistricts: () => api.get('/master/districts'),
  createDistrict: (d) => api.post('/master/districts', d),
  updateDistrict: (id, d) => api.put(`/master/districts/${id}`, d),
  deleteDistrict: (id) => api.delete(`/master/districts/${id}`),
  // Occupations
  getOccupations: () => api.get('/master/occupations'),
  createOccupation: (d) => api.post('/master/occupations', d),
  updateOccupation: (id, d) => api.put(`/master/occupations/${id}`, d),
  deleteOccupation: (id) => api.delete(`/master/occupations/${id}`),
  // Religions
  getReligions: () => api.get('/master/religions'),
  createReligion: (d) => api.post('/master/religions', d),
  updateReligion: (id, d) => api.put(`/master/religions/${id}`, d),
  deleteReligion: (id) => api.delete(`/master/religions/${id}`),
  // Castes
  getCastes: () => api.get('/master/castes'),
  createCaste: (d) => api.post('/master/castes', d),
  updateCaste: (id, d) => api.put(`/master/castes/${id}`, d),
  deleteCaste: (id) => api.delete(`/master/castes/${id}`),
  // Ranks
  getRanks: () => api.get('/master/ranks'),
  createRank: (d) => api.post('/master/ranks', d),
  updateRank: (id, d) => api.put(`/master/ranks/${id}`, d),
  deleteRank: (id) => api.delete(`/master/ranks/${id}`),
  // Designations
  getDesignations: () => api.get('/master/designations'),
  createDesignation: (d) => api.post('/master/designations', d),
  updateDesignation: (id, d) => api.put(`/master/designations/${id}`, d),
  deleteDesignation: (id) => api.delete(`/master/designations/${id}`),
  // Acts
  getActs: (params) => api.get('/master/acts', { params }),
  createAct: (d) => api.post('/master/acts', d),
  updateAct: (id, d) => api.put(`/master/acts/${id}`, d),
  deleteAct: (id) => api.delete(`/master/acts/${id}`),
  // Sections
  getSections: (params) => api.get('/master/sections', { params }),
  createSection: (d) => api.post('/master/sections', d),
  updateSection: (id, d) => api.put(`/master/sections/${id}`, d),
  deleteSection: (id) => api.delete(`/master/sections/${id}`),
  // Crime Heads
  getCrimeHeads: () => api.get('/master/crime-heads'),
  createCrimeHead: (d) => api.post('/master/crime-heads', d),
  updateCrimeHead: (id, d) => api.put(`/master/crime-heads/${id}`, d),
  deleteCrimeHead: (id) => api.delete(`/master/crime-heads/${id}`),
  // Crime Subheads
  getCrimeSubheads: (params) => api.get('/master/crime-subheads', { params }),
  createCrimeSubhead: (d) => api.post('/master/crime-subheads', d),
  updateCrimeSubhead: (id, d) => api.put(`/master/crime-subheads/${id}`, d),
  deleteCrimeSubhead: (id) => api.delete(`/master/crime-subheads/${id}`),
  // Case Statuses
  getCaseStatuses: () => api.get('/master/case-statuses'),
  createCaseStatus: (d) => api.post('/master/case-statuses', d),
  updateCaseStatus: (id, d) => api.put(`/master/case-statuses/${id}`, d),
  deleteCaseStatus: (id) => api.delete(`/master/case-statuses/${id}`),
}

export default api
