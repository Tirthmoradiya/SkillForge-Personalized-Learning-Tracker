import { Link, useNavigate } from 'react-router-dom';
import { AcademicCapIcon, CodeBracketIcon, BeakerIcon, ChartBarIcon, ClockIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

export default function Dashboard() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [learningPaths, setLearningPaths] = useState([]);
  const [progress, setProgress] = useState({}); // {pathId: percent}
  const [recentTopics, setRecentTopics] = useState([]);
  const [completedTopics, setCompletedTopics] = useState([]); // [{ id, title, completedAt }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentViewedTopics, setRecentViewedTopics] = useState([]);
  const [courseProgress, setCourseProgress] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Helpers for localStorage keys
  const getKey = (type) => user ? `${type}_${user._id || user.id || user.username}` : null;

  // On mount: load from localStorage, then sync with backend
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError('');
    // 1. Load from localStorage
    const keys = {
      learningPaths: getKey('learningPaths'),
      recentTopics: getKey('recentTopics'),
      completedTopics: getKey('completedTopics'),
      recentViewedTopics: getKey('recentViewedTopics'),
      courseProgress: getKey('courseProgress'),
      progress: getKey('progress'),
    };
    let local = {};
    for (const k in keys) {
      try {
        local[k] = JSON.parse(localStorage.getItem(keys[k])) || [];
      } catch { local[k] = []; }
    }
    setLearningPaths(local.learningPaths);
    setRecentTopics(local.recentTopics);
    setCompletedTopics(local.completedTopics);
    setRecentViewedTopics(local.recentViewedTopics);
    setCourseProgress(local.courseProgress);
    setProgress(local.progress);
    // 2. Fetch from backend and merge
    Promise.all([
      // Fetch user's assigned learning paths with populated courses
      fetch(`${API_BASE_URL}/api/user/learning-paths`, { 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
      }).then(res => res.json()),
      fetch(`${API_BASE_URL}/api/user/recent-activity`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json()),
      fetch(`${API_BASE_URL}/api/user/account/export`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json()),
      fetch(`${API_BASE_URL}/api/user/topics/recent-viewed`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json()),
      fetch(`${API_BASE_URL}/api/user/progress/courses`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json()),
    ])
      .then(([paths, recent, userData, recentViewed, courseProg]) => {
        setLearningPaths(Array.isArray(paths) ? paths : local.learningPaths);
        setRecentTopics(Array.isArray(recent) ? recent : local.recentTopics);
        setRecentViewedTopics(Array.isArray(recentViewed) ? recentViewed : local.recentViewedTopics);
        setCourseProgress(Array.isArray(courseProg) ? courseProg : local.courseProgress);
        // Extract completed topics with title and date
        if (userData && Array.isArray(userData.completedTopics)) {
          setCompletedTopics(userData.completedTopics.map(ct => ({
            id: ct.topic?._id || ct.topic,
            title: ct.topic?.title || ct.topic,
            completedAt: ct.completedAt
          })));
        } else {
          setCompletedTopics(local.completedTopics);
        }
        // Save merged data to localStorage
        if (Array.isArray(paths)) localStorage.setItem(keys.learningPaths, JSON.stringify(paths));
        if (Array.isArray(recent)) localStorage.setItem(keys.recentTopics, JSON.stringify(recent));
        if (Array.isArray(recentViewed)) localStorage.setItem(keys.recentViewedTopics, JSON.stringify(recentViewed));
        if (Array.isArray(courseProg)) localStorage.setItem(keys.courseProgress, JSON.stringify(courseProg));
        if (userData && Array.isArray(userData.completedTopics)) {
          localStorage.setItem(keys.completedTopics, JSON.stringify(userData.completedTopics.map(ct => ({
            id: ct.topic?._id || ct.topic,
            title: ct.topic?.title || ct.topic,
            completedAt: ct.completedAt
          }))));
        }
      })
      .catch((err) => {
        setError('Failed to load dashboard data. Please try again later.');
        console.error('Dashboard data fetch error:', err);
      })
      .finally(() => setLoading(false));
  }, [user, location]);

  // Add refresh mechanism for learning paths
  const refreshLearningPaths = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/learning-paths`, { 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
      });
      const paths = await res.json();
      if (Array.isArray(paths)) {
        setLearningPaths(paths);
        const key = getKey('learningPaths');
        if (key) localStorage.setItem(key, JSON.stringify(paths));
      }
    } catch (err) {
      console.error('Error refreshing learning paths:', err);
    }
  };

  // Listen for admin changes (poll every 30 seconds)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refreshLearningPaths, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  // On logout: clear all relevant localStorage keys
  useEffect(() => {
    const handleLogout = () => {
      ['learningPaths','recentTopics','completedTopics','recentViewedTopics','courseProgress','progress'].forEach(type => {
        const key = getKey(type);
        if (key) localStorage.removeItem(key);
      });
    };
    window.addEventListener('logout', handleLogout);
    return () => window.removeEventListener('logout', handleLogout);
  }, [user]);

  // Poll only progress every second
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    let intervalId;
    const fetchProgress = () => {
      fetch(`${API_BASE_URL}/api/user/progress/learning-paths`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
        .then(res => res.json())
        .then(progressArr => {
          if (!isMounted) return;
          setProgress(Object.fromEntries((Array.isArray(progressArr) ? progressArr : []).map(lp => [lp.id, lp.percentage])));
        })
        .catch((err) => {
          if (!isMounted) return;
          // Optionally handle error
        });
    };
    fetchProgress();
    intervalId = setInterval(fetchProgress, 1000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [user, location]);

  if (!user || loading) return <LoadingSpinner fullScreen />;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="space-y-8 animate-fade-in w-full px-2 sm:px-4 md:px-8">
      {/* Recently Viewed Topics */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center break-words">
          <BeakerIcon className="h-6 w-6 mr-2 text-blue-500 dark:text-blue-400" />
          Recently Viewed Topics (Last 5)
        </h2>
        <div className="space-y-3 sm:space-y-4">
          {recentViewedTopics.length === 0 ? (
            <div className="text-gray-500">No recently viewed topics yet.</div>
          ) : (
            recentViewedTopics.map((topic) => (
              <div key={topic.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-3 sm:p-4 border border-gray-100 dark:border-gray-700 w-full overflow-x-auto">
                <div className="font-semibold text-gray-900 dark:text-white break-words truncate max-w-xs sm:max-w-none">{topic.title}</div>
                <div className="text-xs text-gray-400 mt-1 sm:mt-0">{new Date(topic.viewedAt).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-4 sm:p-8 border border-gray-100 dark:border-gray-700 transform hover:scale-[1.01] transition-all duration-300 relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-grid-gray-900/[0.02] dark:bg-grid-gray-100/[0.02] bg-[size:16px_16px]" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between w-full">
          <div className="w-full md:w-auto">
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 break-words">
              Welcome back, {user.username}!
            </h1>
            <p className="mt-2 text-base sm:text-lg text-gray-600 dark:text-gray-300">
              Your learning journey continues. You've made great progress!
            </p>
          </div>
          <div className="hidden md:flex space-x-4">
            <div className="p-3 bg-blue-500/10 dark:bg-blue-400/10 rounded-xl">
              <ChartBarIcon className="h-12 w-12 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Learning Paths */}
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center break-words">
            <ArrowTrendingUpIcon className="h-6 w-6 mr-2 text-blue-500 dark:text-blue-400" />
            Your Learning Paths
          </h2>
          <button
            onClick={refreshLearningPaths}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="Refresh learning paths"
          >
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 w-full">
          {learningPaths.length === 0 ? (
            <div className="col-span-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 text-center">
              <AcademicCapIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                No Learning Paths Assigned
              </h3>
              <p className="text-blue-700 dark:text-blue-300 mb-4">
                You don't have any learning paths assigned yet. Please contact your administrator to get access to courses.
              </p>
              <button
                onClick={refreshLearningPaths}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          ) : (
            learningPaths
              .filter(path =>
                (Array.isArray(path.courses) && path.courses.length > 0
                  ? path.courses
                      .map(cid => courseProgress.find(c => c.id === (cid._id || cid)))
                      .filter(c => c && c.viewedTopics < c.totalTopics).length > 0
                  : false)
              )
              .map(path => (
              <div
                key={path.id || path._id}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 relative overflow-hidden w-full touch-manipulation"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent dark:from-gray-900/50 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    <div className="bg-blue-500 p-2 sm:p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <AcademicCapIcon className="h-8 w-8 text-white" aria-hidden="true" />
                    </div>
                    <div className="ml-0 sm:ml-4 flex-1 mt-2 sm:mt-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white break-words truncate max-w-xs sm:max-w-none">
                        <Link to={`/learning-path/${path.id || path._id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                          {path.name || path.title}
                        </Link>
                      </h3>
                      <p className="mt-1 text-gray-600 dark:text-gray-300 text-sm sm:text-base break-words line-clamp-2">{path.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                    {/* Only show in-progress courses, not completed ones */}
                    {(Array.isArray(path.courses) && path.courses.length > 0 ? path.courses : [])
                      .filter(courseId => {
                        const course = courseProgress.find(c => c.id === (courseId._id || courseId));
                        return course && course.viewedTopics < course.totalTopics;
                      })
                      .map(courseId => {
                        const course = courseProgress.find(c => c.id === (courseId._id || courseId));
                        if (!course) return null;
                        return (
                          <button
                            key={course.id}
                            className="mb-2 w-full text-left"
                            onClick={() => navigate('/learning-path', { state: { courseId: course.id } })}
                            style={{ background: 'none', border: 'none', padding: 0 }}
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 cursor-pointer hover:underline">
                              <span className="font-semibold text-gray-900 dark:text-white break-words truncate max-w-xs sm:max-w-none">{course.title}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                              <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: `${course.percentage}%` }}></div>
                            </div>
                          </button>
                        );
                      })}
                    <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2">
                      <span className="flex items-center"><AcademicCapIcon className="h-4 w-4 mr-1" />
                        {Array.isArray(path.courses) && path.courses.length > 0 && courseProgress.length > 0
                          ? (() => {
                              // Only count in-progress courses for the summary
                              const inProgressCourses = (Array.isArray(path.courses) ? path.courses : []).map(cid => courseProgress.find(c => c.id === (cid._id || cid))).filter(c => c && c.viewedTopics < c.totalTopics);
                              if (inProgressCourses.length === 1) {
                                const course = inProgressCourses[0];
                                return `${course.viewedTopics} / ${course.totalTopics} topics viewed`;
                              } else if (inProgressCourses.length > 1) {
                                const totalViewed = inProgressCourses.reduce((sum, c) => sum + c.viewedTopics, 0);
                                const totalTopics = inProgressCourses.reduce((sum, c) => sum + c.totalTopics, 0);
                                return `${totalViewed} / ${totalTopics} topics viewed`;
                              } else {
                                return 'No in-progress courses';
                              }
                            })()
                          : 'No courses'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Completed Courses Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <AcademicCapIcon className="h-6 w-6 mr-2 text-green-500 dark:text-green-400" />
          Completed Courses
        </h2>
        {courseProgress.filter(c => c.viewedTopics === c.totalTopics && c.totalTopics > 0).length === 0 ? (
          <div className="text-gray-500">No courses completed yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topics Completed</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {courseProgress.filter(c => c.viewedTopics === c.totalTopics && c.totalTopics > 0).map((c, idx) => (
                  <tr key={c.id || idx}>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">{c.title}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{c.viewedTopics} / {c.totalTopics}</td>
                    <td className="px-4 py-2 text-green-600 dark:text-green-400 font-bold">100% complete</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Link
          to="/learning-path"
          className="group relative rounded-2xl border border-gray-100 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 shadow-lg flex items-center space-x-4 hover:shadow-xl hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-grid-gray-900/[0.02] dark:bg-grid-gray-100/[0.02] bg-[size:16px_16px]"></div>
          <div className="relative flex items-center space-x-4">
            <div className="flex-shrink-0 p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <AcademicCapIcon className="h-8 w-8 text-white" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                Start New Path
              </h3>
              <p className="mt-1 text-gray-600 dark:text-gray-300">Explore new learning opportunities</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}