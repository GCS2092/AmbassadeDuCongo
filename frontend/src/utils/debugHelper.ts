/**
 * Helper utilities for data handling
 * Production-safe version (no console logs)
 */

export const safeArrayAccess = (data: any, fallback: any[] = []) => {
  if (Array.isArray(data)) {
    return data;
  }
  
  if (data?.results && Array.isArray(data.results)) {
    return data.results;
  }
  
  if (data?.data && Array.isArray(data.data)) {
    return data.data;
  }
  
  return fallback;
};

// Debug functions (only in development)
export const debugAPI = {
  logRequest: (url: string, method: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`🚀 ${method.toUpperCase()} ${url}`, data ? { data } : '');
    }
  },
  
  logResponse: (url: string, status: number, data: any) => {
    if (import.meta.env.DEV) {
      console.log(`✅ ${status} ${url}`, {
        dataType: Array.isArray(data) ? 'array' : typeof data,
        dataLength: Array.isArray(data) ? data.length : 'N/A'
      });
    }
  },
  
  logError: (url: string, error: any) => {
    if (import.meta.env.DEV) {
      console.error(`❌ ERROR ${url}`, {
        status: error.response?.status,
        message: error.message
      });
    }
  }
};

export const debugComponent = (componentName: string, props: any) => {
  if (import.meta.env.DEV) {
    console.log(`🔍 ${componentName} rendered with:`, props);
  }
};
