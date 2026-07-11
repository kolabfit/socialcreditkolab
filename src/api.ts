/**
 * API Client — Ko+Lab Social Credit Score
 * 
 * Wrapper fetch yang otomatis menambahkan JWT token
 * dan handle response/error secara konsisten.
 */

const API_BASE = '/api';

function getToken(): string | null {
  return sessionStorage.getItem('kolab_token');
}

export function setToken(token: string): void {
  sessionStorage.setItem('kolab_token', token);
}

export function clearToken(): void {
  sessionStorage.removeItem('kolab_token');
}

export function hasToken(): boolean {
  return !!sessionStorage.getItem('kolab_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request gagal' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==========================================
// Auth API
// ==========================================

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    nim?: string;
    startup?: string;
    lecturerCode?: string;
    advisedStartups?: string[];
  }) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<any>('/auth/me'),
};

// ==========================================
// Users API
// ==========================================

export const usersApi = {
  list: (params?: { role?: string; startup?: string }) => {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.startup) query.set('startup', params.startup);
    const qs = query.toString();
    return request<any[]>(`/users${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) => request<any>(`/users/${id}`),

  create: (data: any) =>
    request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),

  suspend: (id: string, suspended: boolean) =>
    request<any>(`/users/${id}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ suspended }),
    }),

  updateScore: (id: string, score: number, rubricScores?: Record<string, number>) =>
    request<any>(`/users/${id}/score`, {
      method: 'PATCH',
      body: JSON.stringify({ score, rubricScores }),
    }),
};

// ==========================================
// Reports API (Behavior Reports)
// ==========================================

export const reportsApi = {
  list: (params?: { targetId?: string; reporterId?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.targetId) query.set('targetId', params.targetId);
    if (params?.reporterId) query.set('reporterId', params.reporterId);
    if (params?.type) query.set('type', params.type);
    const qs = query.toString();
    return request<any[]>(`/reports${qs ? `?${qs}` : ''}`);
  },

  create: (data: {
    targetId: string;
    targetType?: string;
    reporterId: string;
    date: string;
    type: 'good' | 'bad';
    description: string;
    photoUrl?: string;
    pointsImpact: number;
    aspectId?: string;
  }) =>
    request<any>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ message: string }>(`/reports/${id}`, { method: 'DELETE' }),
};

// ==========================================
// Rubrics API
// ==========================================

export const rubricsApi = {
  list: () => request<any[]>('/rubrics'),

  update: (aspects: { id: string; name: string; weight: number }[]) =>
    request<any[]>('/rubrics', {
      method: 'PUT',
      body: JSON.stringify({ aspects }),
    }),
};

// ==========================================
// Startups API
// ==========================================

export const startupsApi = {
  list: () => request<any[]>('/startups'),

  create: (data: { name: string; description?: string }) =>
    request<any>('/startups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; description?: string }) =>
    request<any>(`/startups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/startups/${id}`, { method: 'DELETE' }),
};

// ==========================================
// Batches API
// ==========================================

export const batchesApi = {
  list: () => request<any[]>('/batches'),

  create: (data: { name: string; date_range: string; status: 'active' | 'completed' }) =>
    request<any>('/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; date_range?: string; status?: 'active' | 'completed' }) =>
    request<any>(`/batches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/batches/${id}`, { method: 'DELETE' }),
};

// ==========================================
// Activities API
// ==========================================

export const activitiesApi = {
  list: () => request<any[]>('/activities'),

  create: (data: any) =>
    request<any>('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string) =>
    request<any>(`/activities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/activities/${id}`, { method: 'DELETE' }),
};

