// Centralized API configuration
// Handles trailing slashes and provides a fallback URL

const getApiUrl = () => {
  // Get URL from environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  
  // Fallback URL if env var is missing (useful for local dev or if env var is not set)
  // Using the Render URL provided by the user as a safe default
  const fallbackUrl = 'https://skillforge-personalized-learning-tracker.onrender.com';
  
  const url = envUrl || fallbackUrl;
  
  // Remove trailing slashes to ensure consistency
  return url.replace(/\/+$/, '');
};

export const API_BASE_URL = getApiUrl();
