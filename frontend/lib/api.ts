import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: `${API_URL}/api` })

api.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post('/auth/register', data),
  login: (email: string, password: string) => {
    const form = new FormData()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form)
  },
  me: () => api.get('/auth/me'),
}

export const projectsApi = {
  list: () => api.get('/projects'),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: { name: string; model_name: string; description?: string }) =>
    api.post('/projects', data),
  update: (id: string, data: Partial<{ name: string; model_name: string; description: string }>) =>
    api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
}

export const datasetsApi = {
  listByProject: (projectId: string) => api.get(`/datasets/project/${projectId}`),
  upload: (projectId: string, datasetType: string, file: File) => {
    const form = new FormData()
    form.append('project_id', projectId)
    form.append('dataset_type', datasetType)
    form.append('file', file)
    return api.post('/datasets', form)
  },
}

export const auditsApi = {
  create: (data: { project_id: string; reference_dataset_id: string; generated_dataset_id: string }) =>
    api.post('/audits', data),
  get: (id: string) => api.get(`/audits/${id}`),
  listByProject: (projectId: string) => api.get(`/audits/project/${projectId}`),
}

export const reportsApi = {
  generate: (auditId: string) => api.post(`/reports/${auditId}/generate`),
  downloadUrl: (auditId: string) => `${API_URL}/api/reports/${auditId}/download`,
}

export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
}

export const notificationsApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
}

export default api

// Add download method (returns blob for PDF)
export const reportsApiExtended = {
  generate: (auditId: string) => api.post(`/reports/${auditId}/generate`),
  download: (auditId: string) => api.get(`/reports/${auditId}/download`, { responseType: 'blob' }),
  downloadUrl: (auditId: string) => `${API_URL}/api/reports/${auditId}/download`,
}
