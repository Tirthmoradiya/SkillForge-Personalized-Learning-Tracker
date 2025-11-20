import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

import { API_BASE_URL } from '../config/api';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { logout } = useAuth();

  const fetchApi = useCallback(async (url, options = {}) => {
    // Ensure we have a valid base URL and properly construct the full URL
    if (url.startsWith('/api')) {
      // Clean up the URL path and ensure no undefined in the URL
      const cleanPath = url.replace(/^\/+/, '');
      url = `${API_BASE_URL}/${cleanPath}`;
      console.log('Making API request to:', url); // Debug log
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