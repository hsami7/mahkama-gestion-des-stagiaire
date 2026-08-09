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

// Surface a clear notice when a Manager hits a permission-denied endpoint.
function showForbiddenNotice() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return;
  try {
    const user = JSON.parse(userStr);
    if (user.role === 'Manager') {
      notify('رفض الوصول (403) — لا تملك صلاحية لهذا الإجراء', 'error');
    }
  } catch {}
}

function getAuthHeaders(isFormData: boolean = false) {
  const token = localStorage.getItem('token');
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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));
      }
      if (response.status === 403 || response.status === 404) {
        const user = localStorage.getItem('user');
        if (user && JSON.parse(user).role === 'Intern') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('storage'));
          window.location.href = '/';
        } else if (response.status === 403) {
          showForbiddenNotice();
        }
      }
      const err = new Error(`API Error: ${errMsg}`) as any;
      err.status = response.status;
      throw err;
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
      if (response.status === 403 || response.status === 404) {
        const user = localStorage.getItem('user');
        if (user && JSON.parse(user).role === 'Intern') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('storage'));
          window.location.href = '/';
        } else if (response.status === 403) {
          showForbiddenNotice();
        }
      }
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
      if (response.status === 403 || response.status === 404) {
        const user = localStorage.getItem('user');
        if (user && JSON.parse(user).role === 'Intern') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('storage'));
          window.location.href = '/';
        } else if (response.status === 403) {
          showForbiddenNotice();
        }
      }
      throw new Error(typeof resData === 'object' && resData?.msg ? resData.msg : 'حدث خطأ أثناء العملية');
    }
    return resData;
  },

  uploadFile: async (endpoint: string, file: File, extraFields?: Record<string, string>) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    if (extraFields) {
      Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));
    }
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    const resData = await response.json();
    if (!response.ok) {
      if (response.status === 403 || response.status === 404) {
        const user = localStorage.getItem('user');
        if (user && JSON.parse(user).role === 'Intern') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('storage'));
          window.location.href = '/';
        } else if (response.status === 403) {
          showForbiddenNotice();
        }
      }
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
      if (response.status === 403) showForbiddenNotice();
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  // --- Document Lifecycle ---
  getDocumentQueue: () => api.get('/documents/queue'),

  getInternDocuments: (internId: number) =>
    api.get(`/interns/${internId}/documents`),

  uploadInternDocument: (internId: number, docType: string, file: File, docId?: number, customTitle?: string) =>
    api.uploadFile(`/interns/${internId}/documents/upload`, file, { doc_type: docType, ...(docId ? { doc_id: String(docId) } : {}), ...(customTitle ? { custom_title: customTitle } : {}) }),

  approveDocument: (internId: number, docId: number) =>
    api.post(`/interns/${internId}/documents/${docId}/approve`, {}),

  rejectDocument: (internId: number, docId: number, reason: string) =>
    api.post(`/interns/${internId}/documents/${docId}/reject`, { rejection_reason: reason }),

  uploadSignedDocument: (internId: number, docType: string, file: File, customTitle?: string, actionType?: string) =>
    api.uploadFile(`/interns/${internId}/documents/signed`, file, { doc_type: docType, ...(customTitle ? { custom_title: customTitle } : {}), ...(actionType ? { action_type: actionType } : {}) }),

  getMyDocuments: () => api.get('/intern/documents'),

  openDocument: async (docId: number, returned: boolean = false) => {
    const res = await fetch(`${API_BASE}/intern-documents/${docId}/open?token=${localStorage.getItem('token')}${returned ? '&returned=1' : ''}`);
    if (!res.ok) throw new Error('فشل فتح المستند');
  },
  downloadDocument: (docId: number) =>
    `${API_BASE}/intern-documents/${docId}/download?token=${localStorage.getItem('token')}`,

  exportInternPdf: (
    internId: number,
    mode: 'summary' | 'full' = 'summary',
    disposition: 'attachment' | 'inline' = 'attachment',
  ) =>
    `${API_BASE}/interns/${internId}/profile-pdf?mode=${mode}&disposition=${disposition}&token=${localStorage.getItem('token')}`,
  exportInternMd: (internId: number) =>
    `${API_BASE}/interns/${internId}/profile-md?token=${localStorage.getItem('token')}`,
  exportInterns: (format: 'pdf' | 'excel', ids?: number[]) =>
    `${API_BASE}/interns/export?format=${format}${ids && ids.length ? `&ids=${ids.join(',')}` : ''}&token=${localStorage.getItem('token')}`,
  exportInternZip: (internId: number) =>
    `${API_BASE}/interns/${internId}/export-zip?token=${localStorage.getItem('token')}`,
};
