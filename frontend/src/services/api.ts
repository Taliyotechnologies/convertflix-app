const API_BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get file extension
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

// Helper to build absolute backend URL (for static assets under /uploads)
export const buildAbsoluteUrl = (path: string): string => {
  try {
    if (!path) return path;
    // If already absolute, return as-is
    if (/^https?:\/\//i.test(path)) return path;
    // Derive backend base by stripping a trailing /api from API_BASE_URL
    const backendBase = API_BASE_URL.replace(/\/?api\/?$/i, '');
    const base = backendBase.replace(/\/$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  } catch (_) {
    return path;
  }
};

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const hasBody = options.body !== undefined && options.body !== null;
  const isPublic = endpoint.startsWith('/public');

  // Build headers conditionally to avoid unnecessary preflights
  const defaultHeaders: Record<string, string> = {};
  if (hasBody && !(options.headers && 'Content-Type' in (options.headers as any))) {
    // Only set Content-Type for requests with a body; for GET/HEAD skip to avoid preflight
    defaultHeaders['Content-Type'] = 'application/json';
  }
  if (token && !isPublic) {
    // Avoid attaching Authorization to public endpoints (prevents preflight for simple GETs)
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    // Explicitly set mode to 'cors' for cross-origin deployments
    mode: 'cors',
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const isJson = (response.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = isJson && (data as any)?.error ? (data as any).error : 'API request failed';
      throw new Error(message);
    }

    return data as any;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// File upload API request function
const apiFileUpload = async (endpoint: string, file: File, additionalData?: any) => {
  const token = localStorage.getItem('token');
  
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalData) {
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'File upload failed');
    }

    return data;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  login: async (email: string, password: string) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  signup: async (fullName: string, email: string, password: string) => {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    });
  },

  getProfile: async () => {
    return apiRequest('/auth/me');
  },

  forgotPassword: async (email: string) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, password: string) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  googleAuth: async (googleToken: string, email: string, fullName: string, avatar?: string) => {
    return apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ googleToken, email, fullName, avatar }),
    });
  },
};

// Tools API
export const toolsAPI = {
  compressImage: async (file: File) => {
    return apiFileUpload('/tools/compress-image', file);
  },

  compressVideo: async (file: File) => {
    return apiFileUpload('/tools/compress-video', file);
  },

  compressAudio: async (file: File) => {
    return apiFileUpload('/tools/compress-audio', file);
  },

  compressPDF: async (file: File) => {
    return apiFileUpload('/tools/compress-pdf', file);
  },

  convertImage: async (file: File, targetFormat: string) => {
    return apiFileUpload('/tools/convert-image', file, { targetFormat });
  },

  convertVideo: async (file: File, targetFormat: string) => {
    return apiFileUpload('/tools/convert-video', file, { targetFormat });
  },

  convertAudio: async (file: File, targetFormat: string) => {
    return apiFileUpload('/tools/convert-audio', file, { targetFormat });
  },

  convertPDF: async (file: File, targetFormat: string) => {
    return apiFileUpload('/tools/convert-pdf', file, { targetFormat });
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    return apiRequest('/user/profile');
  },

  updateProfile: async (fullName: string) => {
    return apiRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ fullName }),
    });
  },

  getFiles: async () => {
    return apiRequest('/user/files');
  },

  deleteFile: async (fileId: string) => {
    return apiRequest(`/user/files/${fileId}`, {
      method: 'DELETE',
    });
  },

  getStats: async () => {
    return apiRequest('/user/stats');
  },
};

// Public API (no auth required)
export const publicAPI = {
  getStatus: async (): Promise<{ maintenanceMode: boolean; siteName?: string }> => {
    return apiRequest('/public/status');
  },
  submitContact: async (
    name: string,
    email: string,
    subject: string,
    message: string
  ): Promise<{ success: boolean; id?: string }> => {
    return apiRequest('/public/contact', {
      method: 'POST',
      body: JSON.stringify({ name, email, subject, message }),
    });
  },
  trackVisit: async (
    path: string,
    referrer?: string,
    userAgent?: string,
    source?: string,
    deviceId?: string,
    deviceType?: 'phone' | 'tablet' | 'laptop'
  ): Promise<void> => {
    try {
      await apiRequest('/public/visit', {
        method: 'POST',
        body: JSON.stringify({ path, referrer, userAgent, source: source || 'frontend', deviceId, deviceType }),
      });
    } catch (_) {
      // swallow errors; visit tracking should not break the UX
    }
  },
};

export default {
  auth: authAPI,
  tools: toolsAPI,
  user: userAPI,
  public: publicAPI,
  formatFileSize,
  getFileExtension,
  buildAbsoluteUrl,
};

