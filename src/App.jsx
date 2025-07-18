import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LearningPath from './pages/LearningPath';
import TopicView from './pages/TopicView';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ChatBot from './components/ChatBot';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import TopicGraph from './pages/TopicGraph';
import QuizPage from './pages/QuizPage';
import useSessionTimeout from './hooks/useSessionTimeout';
import SessionTimeoutHandler from './components/SessionTimeoutHandler';
import ResourcesComingSoon from './pages/ResourcesComingSoon';

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 transition-colors duration-200">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="py-6 lg:py-10 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm ring-1 ring-gray-900/5 p-6 transition-all duration-200">
            {children}
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 right-6 z-50">
        <ChatBot />
      </div>
    </div>
  );
};

const AppRoutes = () => (
  <Routes>
    <Route path="/admin" element={<AdminPanel />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/settings" element={<Settings />} />
    
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    
    <Route
      path="/learning-path"
      element={
        <ProtectedRoute>
          <AppLayout>
            <LearningPath />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    
    <Route
      path="/topic/:topicId"
      element={
        <ProtectedRoute>
          <AppLayout>
            <TopicView />
          </AppLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/topic-graph"
      element={
        <ProtectedRoute>
          <AppLayout>
            <TopicGraph />
          </AppLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/quiz"
      element={
        <ProtectedRoute>
          <AppLayout>
            <QuizPage />
          </AppLayout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/resources"
      element={
        <ProtectedRoute>
          <AppLayout>
            <ResourcesComingSoon />
          </AppLayout>
        </ProtectedRoute>
      }
    />

    {/* Catch all route */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeProvider>
          <AuthProvider>
            <SessionTimeoutHandler />
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
