import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import UserAvatar from '../components/UserAvatar';
import MotivationalQuote from '../components/MotivationalQuote';
import AnimatedBlobs from '../components/AnimatedBlobs';
import ProgressStepper from '../components/ProgressStepper';
import Confetti from '../components/Confetti';
import { StarIcon as StarSolid, StarIcon as StarOutline, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';

export default function LearningPath() {
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [viewedTopicIds, setViewedTopicIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalTopic, setModalTopic] = useState(null);
  const [savingViewed, setSavingViewed] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [favoriteTopics, setFavoriteTopics] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isDarkMode, toggleTheme } = useTheme();
  const [highContrast, setHighContrast] = useState(false);

  // Helper: get localStorage key for this user
  const getLocalKey = () => user ? `viewedTopics_${user._id || user.id || user.username}` : null;

  // On mount: load progress from localStorage, then sync with backend
  useEffect(() => {
    if (!user) return;
    setError('');
    setLoading(true);
    // 1. Load from localStorage
    const localKey = getLocalKey();
    let localViewed = [];
    if (localKey) {
      try {
        localViewed = JSON.parse(localStorage.getItem(localKey)) || [];
        setViewedTopicIds(localViewed);
      } catch {}
    }
    // 2. Fetch from backend and merge
    fetch('/api/user/learning-paths', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        console.log('API /api/user/learning-paths response:', data);
        if (Array.isArray(data)) {
          // Extract courses from all learning paths
          const allCourses = data.reduce((acc, path) => {
            if (path.courses && Array.isArray(path.courses)) {
              acc.push(...path.courses);
            }
            return acc;
          }, []);
          
          // Remove duplicates based on course ID
          const uniqueCourses = allCourses.filter((course, index, self) => 
            index === self.findIndex(c => c._id === course._id)
          );
          
          setCourses(uniqueCourses);
          if (location.state && location.state.courseId) {
            const found = uniqueCourses.find(c => c._id === location.state.courseId);
            if (found) setSelectedCourse(found);
          }
        } else {
          setCourses([]);
          setError('Failed to load courses.');
        }
      })
      .catch(() => {
        setCourses([]);
        setError('Failed to load courses.');
      })
      .finally(() => setLoading(false));
    // Fetch viewed topics from backend
    fetch('/api/user/profile', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.viewedTopics)) {
          const backendViewed = data.viewedTopics.map(vt => vt.topic?._id || vt.topic);
          // Merge: prefer backend, but keep any local topics not in backend (optimistic UI)
          const merged = Array.from(new Set([...backendViewed, ...localViewed]));
          setViewedTopicIds(merged);
          if (localKey) localStorage.setItem(localKey, JSON.stringify(merged));
        } else {
          setViewedTopicIds(localViewed);
        }
      })
      .catch(() => setViewedTopicIds(localViewed));
  }, [user, selectedCourse]);

  // Confetti on course completion
  useEffect(() => {
    if (!selectedCourse) return;
    const allViewed = selectedCourse.topics.every(t => viewedTopicIds.includes(t._id));
    if (allViewed && selectedCourse.topics.length > 0) {
      setShowConfetti(true);
      const timeout = setTimeout(() => setShowConfetti(false), 2200);
      return () => clearTimeout(timeout);
    }
  }, [selectedCourse, viewedTopicIds]);

  // On topic view: update local state, localStorage, and backend
  const handleTopicClick = async (topic, idx) => {
    setModalTopic(topic);
    setShowModal(true);
    setSavingViewed(true);
    const shortDescription = `${topic.description}\nHere you will learn the essentials of this topic.`;
    // Optimistically update local state and localStorage
    setViewedTopicIds(prev => {
      const updated = [...prev, topic._id];
      const localKey = getLocalKey();
      if (localKey) localStorage.setItem(localKey, JSON.stringify(updated));
      return updated;
    });
    // Send to backend
    try {
      await fetch(`/api/user/topics/${topic._id}/viewed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ shortDescription })
      });
    } catch (e) {}
    setSavingViewed(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalTopic(null);
  };

  const toggleExpand = topicId => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const toggleFavorite = topicId => {
    setFavoriteTopics(prev => prev.includes(topicId)
      ? prev.filter(id => id !== topicId)
      : [...prev, topicId]);
  };

  // On logout: clear localStorage for this user
  useEffect(() => {
    const handleLogout = () => {
      const localKey = getLocalKey();
      if (localKey) localStorage.removeItem(localKey);
    };
    window.addEventListener('logout', handleLogout);
    return () => window.removeEventListener('logout', handleLogout);
  }, [user]);

  // Skeleton loader for courses
  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <AnimatedBlobs />
        <div className="space-y-4 w-full max-w-2xl mx-auto">
          {[1,2].map(i => (
            <div key={i} className="animate-pulse bg-white/70 dark:bg-gray-900/70 rounded-2xl h-32 w-full mb-4 shadow-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen py-4 px-1 sm:py-6 sm:px-2 animate-fade-in overflow-x-hidden w-full">
      <AnimatedBlobs />
      <Confetti active={showConfetti} />
      <div className="flex flex-col items-center mb-6 sm:mb-8 gap-2 w-full">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full justify-center">
          <UserAvatar user={user} size={48} />
          <div className="text-center sm:text-left w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight drop-shadow-lg animate-fade-in-up">Welcome, {user?.username || 'Learner'}!</h1>
            <MotivationalQuote />
          </div>
        </div>
      </div>
      {error && <div className="text-red-500 animate-pulse text-center mb-4">{error}</div>}
      {showConfetti && (
        <div aria-live="polite" className="sr-only">Course completed! 🎉</div>
      )}
      {courses.length === 0 ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8 text-center">
          <AcademicCapIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
            No Courses Available
          </h2>
          <p className="text-blue-700 dark:text-blue-300 mb-4">
            You don't have any courses assigned yet. Please contact your administrator to get access to learning materials.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8 w-full">
        {courses.map((course, i) => (
          <div
            key={course._id}
            className={`group p-4 sm:p-7 rounded-2xl shadow-xl border cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.03] hover:shadow-2xl bg-gradient-to-br ${selectedCourse && selectedCourse._id === course._id ? 'from-blue-100 to-blue-50 border-blue-500 ring-2 ring-blue-300 dark:from-blue-900 dark:to-blue-800 shadow-blue-200/60 dark:shadow-blue-900/40 animate-glow' : 'from-white to-gray-50 border-gray-200 dark:from-gray-800 dark:to-gray-900'} animate-fade-in-up backdrop-blur-md bg-opacity-80 w-full`}
            style={{ animationDelay: `${i * 60}ms` }}
            onClick={() => setSelectedCourse(course)}
            tabIndex={0}
            aria-label={`Select course ${course.title}`}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <span className="inline-block w-6 h-6 sm:w-7 sm:h-7 bg-blue-500 rounded-full" />
              <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white break-words truncate max-w-xs sm:max-w-none">{course.title}</div>
            </div>
            <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-base line-clamp-2">{course.description}</div>
          </div>
        ))}
      </div>
      )}
      {selectedCourse && (
        <div className="mt-8 sm:mt-12 animate-fade-in-up w-full">
          <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            Learning Path: <span className="text-blue-600 dark:text-blue-400">{selectedCourse.title}</span>
          </h2>
          <ProgressStepper topics={selectedCourse.topics} viewedTopicIds={viewedTopicIds} />
          <div className="mb-6 sm:mb-8">
            <CourseProgressBar topics={selectedCourse.topics} viewedTopicIds={viewedTopicIds} />
          </div>
          <ul className="space-y-4 sm:space-y-6 w-full">
            {selectedCourse.topics.map((topic, idx) => {
              const unlocked = idx === 0 || viewedTopicIds.includes(selectedCourse.topics[idx - 1]._id);
              const viewed = viewedTopicIds.includes(topic._id);
              const expanded = expandedTopics[topic._id];
              const isFavorite = favoriteTopics.includes(topic._id);
              return (
                <li
                  key={topic._id}
                  className={`relative p-4 sm:p-6 bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between transition-all duration-300 group hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up focus-within:ring-2 focus-within:ring-blue-400 w-full`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                  tabIndex={0}
                  aria-label={`Topic: ${topic.title}`}
                >
                  <div className="flex items-center gap-2 sm:gap-4 w-full">
                    <button
                      className={`mr-2 focus:outline-none ${isFavorite ? 'text-yellow-400 animate-star-pop' : 'text-gray-300 hover:text-yellow-400'} transition-colors`}
                      onClick={() => toggleFavorite(topic._id)}
                      aria-label={isFavorite ? 'Unmark as favorite' : 'Mark as favorite'}
                      tabIndex={0}
                    >
                      {isFavorite ? <StarSolid className="h-5 w-5 sm:h-6 sm:w-6" /> : <StarOutline className="h-5 w-5 sm:h-6 sm:w-6" />}
                    </button>
                    <div className="flex-1">
                      <div className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white flex items-center gap-2 break-words truncate max-w-xs sm:max-w-none">
                        {topic.title}
                        {viewed && <span className="ml-1 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 animate-fade-in">Viewed</span>}
                        {!viewed && unlocked && <span className="ml-1 px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 animate-fade-in">Unlocked</span>}
                        {!unlocked && <span className="ml-1 px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400 animate-fade-in">Locked</span>}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mt-1">
                        {expanded ? topic.description : topic.description.slice(0, 80) + (topic.description.length > 80 ? '...' : '')}
                        {topic.description.length > 80 && (
                          <button
                            className="ml-2 text-blue-500 hover:underline focus:outline-none"
                            onClick={() => toggleExpand(topic._id)}
                            aria-label={expanded ? 'Collapse description' : 'Expand description'}
                          >
                            {expanded ? <ChevronUpIcon className="inline h-4 w-4" /> : <ChevronDownIcon className="inline h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    className={`ml-0 sm:ml-4 mt-3 sm:mt-0 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow hover:scale-105 transition-transform text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${!unlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => unlocked && handleTopicClick(topic, idx)}
                    disabled={!unlocked}
                    aria-label={unlocked ? 'View topic' : 'Locked topic'}
                    tabIndex={0}
                  >
                    {viewed ? 'Review' : unlocked ? 'Start' : 'Locked'}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {showModal && modalTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/80 dark:bg-gray-900/90 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-blue-100 dark:border-blue-900/40 relative animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center justify-center">
              <span className="inline-block w-12 h-12 bg-blue-500 rounded-full" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white mt-6">{modalTopic.title}</h2>
            <p className="mb-2 text-gray-700 dark:text-gray-300 text-center">{modalTopic.description}</p>
            <p className="mb-6 text-blue-700 dark:text-blue-300 text-center">Here you will learn the essentials of this topic. Please review the description before proceeding.</p>
            {savingViewed ? (
              <div className="flex justify-center"><LoadingSpinner /></div>
            ) : (
              <button
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 rounded-xl font-semibold shadow hover:from-blue-700 hover:to-blue-600 transition-all duration-200 w-full mt-2 animate-fade-in"
                onClick={handleCloseModal}
                aria-label="Continue to next topic"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      )}
      <style>{`
        .animate-fade-in { animation: fadeIn 0.7s both; }
        .animate-fade-in-up { animation: fadeInUp 0.7s both; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
        .contrast-200 { filter: contrast(2); }
        .animate-glow { box-shadow: 0 0 16px 4px #60a5fa33, 0 0 32px 8px #818cf833; }
        .animate-star-pop { animation: starPop 0.4s; }
        @keyframes starPop { 0% { transform: scale(0.5) rotate(-20deg); } 60% { transform: scale(1.3) rotate(10deg); } 100% { transform: scale(1) rotate(0); } }
        .ripple-effect {
          position: absolute;
          left: 50%; top: 50%;
          width: 120px; height: 120px;
          background: rgba(59,130,246,0.2);
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          animation: ripple 0.6s linear;
          pointer-events: none;
          z-index: 1;
        }
        @keyframes ripple { to { transform: translate(-50%, -50%) scale(2); opacity: 0; } }
        .shine-bar {
          position: relative;
          overflow: hidden;
        }
        .shine-bar::after {
          content: '';
          position: absolute;
          top: 0; left: 0; height: 100%; width: 40px;
          background: linear-gradient(120deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.2) 100%);
          animation: shineMove 2s infinite linear;
          opacity: 0.7;
        }
        @keyframes shineMove { 0% { left: -40px; } 100% { left: 100%; } }
        .animate-pulse-next { animation: pulseNext 1.2s infinite alternate; }
        @keyframes pulseNext { 0% { box-shadow: 0 0 0 0 #60a5fa44; } 100% { box-shadow: 0 0 0 8px #60a5fa11; } }
      `}</style>
    </div>
  );
}

function CourseProgressBar({ topics, viewedTopicIds }) {
  const total = topics.length;
  const viewed = topics.filter(t => viewedTopicIds.includes(t._id)).length;
  const percent = total === 0 ? 0 : Math.round((viewed / total) * 100);
  return (
    <div className="w-full h-5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner relative">
      <div
        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-700 dark:to-blue-500 transition-all duration-500 shine-bar"
        style={{ width: `${percent}%` }}
      ></div>
      <div className="absolute left-1/2 -translate-x-1/2 top-0 h-5 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-200 w-full">
        {percent}% Complete
        </div>
    </div>
  );
}