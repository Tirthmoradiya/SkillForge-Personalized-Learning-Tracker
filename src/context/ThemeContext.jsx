import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const theme = {
    colors: {
      primary: isDarkMode ? '#3B82F6' : '#2563EB',
      secondary: isDarkMode ? '#6B7280' : '#4B5563',
      background: isDarkMode ? '#111827' : '#F3F4F6',
      surface: isDarkMode ? '#1F2937' : '#FFFFFF',
      text: isDarkMode ? '#F9FAFB' : '#111827',
      textSecondary: isDarkMode ? '#D1D5DB' : '#4B5563',
      border: isDarkMode ? '#374151' : '#E5E7EB',
      error: isDarkMode ? '#EF4444' : '#DC2626',
      success: isDarkMode ? '#10B981' : '#059669',
      warning: isDarkMode ? '#F59E0B' : '#D97706',
    },
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};