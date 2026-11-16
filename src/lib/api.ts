import type {
  Customer,
  CustomerDetail,
  DashboardStats,
  Device,
  DeviceType,
  RepairRequest,
  RepairStatus,
  StaffUser,
} from '../types.ts';

const TOKEN_KEY = 'fixtrack_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    setStoredToken(null);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.error || 'Request failed');
  }
  return data as T;
}

export const api = {
  register: (payload: {fullName: string; email: string; password: string}) =>
    request<{access_token: string; user: StaffUser}>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: {email: string; password: string}) =>
    request<{access_token: string; user: StaffUser}>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: () => request<StaffUser>('/api/auth/me'),

  getDashboardStats: () => request<DashboardStats>('/api/dashboard/stats'),

  getCustomers: (search = '') =>
    request<Customer[]>(
      `/api/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`,
    ),

  getCustomerDetail: (id: number) =>
    request<CustomerDetail>(`/api/customers/${id}`),

  createCustomer: (payload: {
    name: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
  }) =>
    request<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCustomer: (
    id: number,
    payload: {
      name: string;
      phone: string;
      email: string;
      address: string;
      notes: string;
    },
  ) =>
    request<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteCustomer: (id: number) =>
    request<{message: string}>(`/api/customers/${id}`, {
      method: 'DELETE',
    }),

  getDevices: (params?: {
    customerId?: number;
    type?: string;
    search?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.customerId) qs.set('customerId', String(params.customerId));
    if (params?.type) qs.set('type', params.type);
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    return request<Device[]>(`/api/devices${query ? `?${query}` : ''}`);
  },

  createDevice: (payload: {
    customerId: number;
    deviceType: DeviceType;
    brand: string;
    model: string;
    serialNumber: string;
  }) =>
    request<Device>('/api/devices', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteDevice: (id: number) =>
    request<{message: string}>(`/api/devices/${id}`, {
      method: 'DELETE',
    }),

  getRepairs: (params?: {
    status?: string;
    paymentStatus?: string;
    search?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.paymentStatus) qs.set('paymentStatus', params.paymentStatus);
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    return request<RepairRequest[]>(
      `/api/repairs${query ? `?${query}` : ''}`,
    );
  },

  createRepair: (payload: {
    customerId: number;
    deviceId: number;
    issueDescription: string;
    diagnosisNotes: string;
    estimatedCost: number;
    amountPaid: number;
  }) =>
    request<RepairRequest>('/api/repairs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateRepair: (
    id: number,
    payload: Partial<{
      status: RepairStatus;
      issueDescription: string;
      diagnosisNotes: string;
      finalCost: number;
      amountPaid: number;
    }>,
  ) =>
    request<RepairRequest>(`/api/repairs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteRepair: (id: number) =>
    request<{message: string}>(`/api/repairs/${id}`, {
      method: 'DELETE',
    }),
};
