import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;
console.log('API Base URL:', API_BASE_URL); // Temporary debug log

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { logout } = useAuth();

  const fetchApi = useCallback(async (url, options = {}) => {
    if (url.startsWith('/api')) {
      url = `${API_BASE_URL}${url}`;
    }
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        logout();
        throw new Error('Session expired. Please login again.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const get = useCallback((url) => {
    return fetchApi(url, { method: 'GET' });
  }, [fetchApi]);

  const post = useCallback((url, data) => {
    return fetchApi(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, [fetchApi]);

  const put = useCallback((url, data) => {
    return fetchApi(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }, [fetchApi]);

  const del = useCallback((url) => {
    return fetchApi(url, { method: 'DELETE' });
  }, [fetchApi]);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
    clearError: () => setError(null),
  };
};

export default useApi;