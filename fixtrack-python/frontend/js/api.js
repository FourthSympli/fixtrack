const TOKEN_STORAGE_KEY = "fixtrack_python_jwt";

function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    setToken(null);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).join(", ")
      : data.detail || "Request failed.";
    throw new Error(detail);
  }
  return data;
}

window.FixTrackAPI = {
  getToken,
  setToken,
  register: (body) =>
    apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body) =>
    apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => apiRequest("/api/auth/me"),
  getStats: () => apiRequest("/api/dashboard/stats"),
  getCustomers: (search = "") =>
    apiRequest(`/api/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getCustomerDetail: (id) => apiRequest(`/api/customers/${id}`),
  createCustomer: (body) =>
    apiRequest("/api/customers", { method: "POST", body: JSON.stringify(body) }),
  updateCustomer: (id, body) =>
    apiRequest(`/api/customers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCustomer: (id) =>
    apiRequest(`/api/customers/${id}`, { method: "DELETE" }),
  getDevices: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.device_type) qs.set("device_type", params.device_type);
    if (params.search) qs.set("search", params.search);
    const q = qs.toString();
    return apiRequest(`/api/devices${q ? `?${q}` : ""}`);
  },
  createDevice: (body) =>
    apiRequest("/api/devices", { method: "POST", body: JSON.stringify(body) }),
  deleteDevice: (id) =>
    apiRequest(`/api/devices/${id}`, { method: "DELETE" }),
  getRepairs: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.payment_status) qs.set("payment_status", params.payment_status);
    if (params.search) qs.set("search", params.search);
    const q = qs.toString();
    return apiRequest(`/api/repairs${q ? `?${q}` : ""}`);
  },
  createRepair: (body) =>
    apiRequest("/api/repairs", { method: "POST", body: JSON.stringify(body) }),
  updateRepair: (id, body) =>
    apiRequest(`/api/repairs/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteRepair: (id) =>
    apiRequest(`/api/repairs/${id}`, { method: "DELETE" }),
};
