import axios from 'axios';

const API_BASE_URL = 'http://localhost:6001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`[AXIOS] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  verifySession: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const transactionAPI = {
  getAll: async (filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    category?: string;
  }) => {
    const response = await api.get('/transactions', { params: filters });
    return response.data;
  },
  create: async (transaction: {
    type: 'INCOME' | 'EXPENDITURE';
    amount: number;
    category: string;
    description: string;
    date: string;
  }) => {
    const response = await api.post('/transactions', transaction);
    return response.data;
  },
  update: async (id: string, transaction: Partial<{
    type: 'INCOME' | 'EXPENDITURE';
    amount: number;
    category: string;
    description: string;
    date: string;
  }>) => {
    const response = await api.put(`/transactions/${id}`, transaction);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },
};

export const dashboardAPI = {
  getSummary: async (filters?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get('/dashboard/summary', { params: filters });
    return response.data;
  },
};

export const reportsAPI = {
  getMonthly: async (year: number) => {
    const response = await api.get('/reports/monthly', { params: { year } });
    return response.data;
  },
  getCategory: async (filters?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get('/reports/category', { params: filters });
    return response.data;
  },
  getSummary: async (filters?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get('/reports/summary', { params: filters });
    return response.data;
  },
};

export const adminAPI = {
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  updateUser: async (id: string, updates: {
    role?: 'ADMIN' | 'USER';
    permission?: 'read' | 'write';
    name?: string;
    email?: string;
  }) => {
    const response = await api.put(`/admin/users/${id}`, updates);
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
  approveUser: async (email: string, role: 'ADMIN' | 'USER', permission: 'read' | 'write', name?: string) => {
    const response = await api.post('/admin/approve', { email, role, permission, name });
    return response.data;
  },
  getApprovedUsers: async () => {
    const response = await api.get('/admin/approved');
    return response.data;
  },
};

export default api;