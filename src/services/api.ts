export const API_BASE = '/api';
import { notify } from '../components/Toast';

// Parse JSON safely; return a plain object (with optional msg) when the body isn't JSON
// (e.g. an HTML error page from the server) instead of throwing a parse error.
async function safeJson(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { msg: text || response.statusText };
  }
}

function getAuthHeaders(isFormData: boolean = false) {
  const token = sessionStorage.getItem('token');
  const headers: any = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  get: async (endpoint: string) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      let errMsg = response.statusText;
      try {
        const errData = await response.json();
        errMsg = errData.msg || errData.message || JSON.stringify(errData);
      } catch (e) {}
      
      if (response.status === 401 || response.status === 422) {
        notify(`Backend returned ${response.status}: ${errMsg}. Logging out.`, 'error');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));
      }
      throw new Error(`API Error: ${errMsg}`);
    }
    return response.json();
  },
  
  post: async (endpoint: string, data: any) => {
    const isFormData = data instanceof FormData;
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? data : JSON.stringify(data)
    });
    const resData = await safeJson(response);
    if (!response.ok) {
      throw new Error(typeof resData === 'object' && resData?.msg ? resData.msg : 'حدث خطأ أثناء العملية');
    }
    return resData;
  },

  put: async (endpoint: string, data: any) => {
    const isFormData = data instanceof FormData;
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? data : JSON.stringify(data)
    });
    const resData = await safeJson(response);
    if (!response.ok) {
      throw new Error(typeof resData === 'object' && resData?.msg ? resData.msg : 'حدث خطأ أثناء العملية');
    }
    return resData;
  },

  uploadFile: async (endpoint: string, file: File) => {
    const token = sessionStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.msg || 'Upload failed');
    }
    return resData;
  },

  delete: async (endpoint: string) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }
};
