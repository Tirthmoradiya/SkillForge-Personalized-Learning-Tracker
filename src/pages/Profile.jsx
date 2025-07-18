import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { BellIcon, CheckCircleIcon, ExclamationCircleIcon, StarIcon, ClockIcon, EyeIcon, EyeSlashIcon, PencilIcon, CalendarIcon, UserIcon, EnvelopeIcon, InformationCircleIcon, SparklesIcon, LockClosedIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import UserAvatar from '../components/UserAvatar';
import { useTheme } from '../context/ThemeContext';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Profile() {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', about: '', interests: '' });
  const [message, setMessage] = useState('');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [completedTopics, setCompletedTopics] = useState([]);
  const [openedTopics, setOpenedTopics] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [viewedTopics, setViewedTopics] = useState([]);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Helpers for localStorage keys
  const getKey = (type) => user ? `${type}_${user._id || user.id || user.username}` : null;

  useEffect(() => {
    if (!user) return;
    // 1. Load from localStorage
    const keys = {
      profile: getKey('profile'),
      completedTopics: getKey('completedTopics'),
      openedTopics: getKey('openedTopics'),
      learningPaths: getKey('learningPaths'),
      viewedTopics: getKey('viewedTopics'),
      notifications: getKey('notifications'),
    };
    let local = {};
    for (const k in keys) {
      try {
        local[k] = JSON.parse(localStorage.getItem(keys[k])) || [];
      } catch { local[k] = []; }
    }
    setProfile(local.profile);
    setCompletedTopics(local.completedTopics);
    setOpenedTopics(local.openedTopics);
    setLearningPaths(local.learningPaths);
    setViewedTopics(local.viewedTopics);
    setNotifications(local.notifications);
    // 2. Fetch from backend and merge
    fetch('/api/user/profile', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setForm({
          username: data.username,
          email: data.email,
          about: data.about || '',
          interests: (data.interests || []).join(', ')
        });
        setViewedTopics(data.viewedTopics || local.viewedTopics);
        localStorage.setItem(keys.profile, JSON.stringify(data));
        localStorage.setItem(keys.viewedTopics, JSON.stringify(data.viewedTopics || []));
      });
    fetch('/api/user/notifications', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setNotifications(data);
        else if (data && Array.isArray(data.notifications)) setNotifications(data.notifications);
        else setNotifications([]);
        localStorage.setItem(keys.notifications, JSON.stringify(data));
      });
    fetch('/api/user/progress/completed-topics', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json()).then(data => { setCompletedTopics(data); localStorage.setItem(keys.completedTopics, JSON.stringify(data)); });
    fetch('/api/user/progress/opened-topics', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json()).then(data => { setOpenedTopics(data); localStorage.setItem(keys.openedTopics, JSON.stringify(data)); });
    fetch('/api/user/progress/learning-paths', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json()).then(data => { setLearningPaths(data); localStorage.setItem(keys.learningPaths, JSON.stringify(data)); });
  }, [user]);

  // On logout: clear all relevant localStorage keys
  useEffect(() => {
    const handleLogout = () => {
      ['profile','completedTopics','openedTopics','learningPaths','viewedTopics','notifications'].forEach(type => {
        const key = getKey(type);
        if (key) localStorage.removeItem(key);
      });
    };
    window.addEventListener('logout', handleLogout);
    return () => window.removeEventListener('logout', handleLogout);
  }, [user]);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setForm({ username: profile.username, email: profile.email });
    setMessage('');
  };
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSave = async () => {
    setMessage('');
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        username: form.username,
        about: form.about,
        interests: form.interests.split(',').map(s => s.trim()).filter(Boolean)
      })
    });
    const data = await res.json();
    if (res.ok) {
      setProfile(p => ({ ...p, ...form, interests: form.interests.split(',').map(s => s.trim()).filter(Boolean) }));
      setEditMode(false);
      setMessage('Profile updated!');
    } else {
      setMessage(data.message || 'Error updating profile');
    }
  };
  const handlePwChange = e => setPwForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handlePwSubmit = async e => {
    e.preventDefault();
    setPwMsg('');
    const res = await fetch('/api/user/profile/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(pwForm)
    });
    const data = await res.json();
    if (res.ok) {
      setPwMsg('Password updated!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } else {
      setPwMsg(data.message || 'Error updating password');
    }
  };

  // Progress Analytics: Topics viewed per week (last 8 weeks)
  const getWeeklyData = () => {
    const now = new Date();
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = new Date(now);
      start.setDate(now.getDate() - (7 * (7 - i)));
      start.setHours(0, 0, 0, 0);
      return start;
    });
    const counts = Array(8).fill(0);
    viewedTopics.forEach(vt => {
      const viewedAt = new Date(vt.viewedAt);
      for (let i = 0; i < 8; i++) {
        const weekStart = weeks[i];
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        if (viewedAt >= weekStart && viewedAt < weekEnd) {
          counts[i]++;
          break;
        }
      }
    });
    return {
      labels: weeks.map(d => `${d.getMonth() + 1}/${d.getDate()}`),
      datasets: [
        {
          label: 'Topics Viewed',
          data: counts,
          backgroundColor: 'rgba(37, 99, 235, 0.7)',
        },
      ],
    };
  };
  // Streak counter (consecutive days with at least one topic viewed)
  const getStreak = () => {
    if (!viewedTopics.length) return 0;
    const days = new Set(viewedTopics.map(vt => new Date(vt.viewedAt).toDateString()));
    let streak = 0;
    let current = new Date();
    while (days.has(current.toDateString())) {
      streak++;
      current.setDate(current.getDate() - 1);
    }
    return streak;
  };

  // Helper for notification icon and color
  const notifTypeInfo = type => {
    switch (type) {
      case 'reminder': return { icon: <ClockIcon className="h-5 w-5 text-yellow-500" />, color: 'bg-yellow-50 dark:bg-yellow-900/30' };
      case 'achievement': return { icon: <StarIcon className="h-5 w-5 text-green-500" />, color: 'bg-green-50 dark:bg-green-900/30' };
      case 'progress': return { icon: <CheckCircleIcon className="h-5 w-5 text-blue-500" />, color: 'bg-blue-50 dark:bg-blue-900/30' };
      case 'admin': return { icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />, color: 'bg-red-50 dark:bg-red-900/30' };
      default: return { icon: <BellIcon className="h-5 w-5 text-gray-400" />, color: 'bg-gray-50 dark:bg-gray-900' };
    }
  };
  const unreadCount = (Array.isArray(notifications) ? notifications : []).filter(n => !(n.readBy || []).includes(user?._id)).length;
  const markAsRead = async id => {
    await fetch(`/api/user/notifications/${id}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    setNotifications(notifications => notifications.map(n => n._id === id ? { ...n, readBy: [...(n.readBy || []), user._id] } : n));
    window.dispatchEvent(new Event('notifications-updated'));
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(45deg,_#f3f4f6_25%,_transparent_25%,_transparent_75%,_#f3f4f6_75%,_#f3f4f6),linear-gradient(45deg,_#f3f4f6_25%,_transparent_25%,_transparent_75%,_#f3f4f6_75%,_#f3f4f6)] dark:bg-[linear-gradient(45deg,_#1f2937_25%,_transparent_25%,_transparent_75%,_#1f2937_75%,_#1f2937),linear-gradient(45deg,_#1f2937_25%,_transparent_25%,_transparent_75%,_#1f2937_75%,_#1f2937)] bg-[length:32px_32px] [background-position:0_0,_16px_16px] opacity-[0.1] pointer-events-none select-none"></div>
      <div className="max-w-2xl w-full relative mx-auto">
      {/* Header with Avatar and Gradient */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl mb-8 bg-gradient-to-br from-blue-500/80 via-blue-400/60 to-green-400/60 p-0">
        <div className="flex flex-col items-center py-8 px-4">
          <div className="mb-4">
            <UserAvatar user={profile} size={80} />
          </div>
          <div className="text-2xl font-extrabold text-white drop-shadow mb-1 flex items-center gap-2">
            {profile.username}
            {profile.role === 'admin' && <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-400 text-xs font-bold text-gray-900">Admin</span>}
          </div>
          <div className="text-white/90 flex items-center gap-2 mb-2"><EnvelopeIcon className="h-5 w-5" />{profile.email}</div>
          <div className="flex items-center gap-2 text-white/80 text-sm"><CalendarIcon className="h-4 w-4" />Joined: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}</div>
        </div>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><UserIcon className="h-6 w-6 text-blue-400" />Profile Info</h2>
          {!editMode && <button className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-xs shadow hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400" onClick={handleEdit}><PencilIcon className="h-4 w-4" />Edit</button>}
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Username</label>
            {editMode ? (
              <input name="username" value={form.username} onChange={handleChange} className="w-full p-2 rounded border" />
            ) : (
              <div className="text-gray-900 dark:text-white">{profile.username}</div>
            )}
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">About</label>
            {editMode ? (
              <textarea name="about" value={form.about} onChange={handleChange} className="w-full p-2 rounded border" />
            ) : (
              <div className="text-gray-900 dark:text-white whitespace-pre-line flex items-center gap-2"><InformationCircleIcon className="h-5 w-5 text-blue-300" />{profile.about}</div>
            )}
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Interests</label>
            {editMode ? (
              <input name="interests" value={form.interests} onChange={handleChange} className="w-full p-2 rounded border" placeholder="Comma separated interests" />
            ) : (
              <div className="text-gray-900 dark:text-white flex items-center gap-2"><SparklesIcon className="h-5 w-5 text-green-400" />{(profile.interests || []).join(', ')}</div>
            )}
          </div>
        </div>
        {editMode && (
          <div className="flex gap-2 mt-6">
            <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition" onClick={handleSave}>Save</button>
            <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded shadow hover:bg-gray-400 transition" onClick={handleCancel}>Cancel</button>
          </div>
        )}
        {message && <div className="mt-4 text-green-600 font-semibold">{message}</div>}
      </div>

      {/* Progress Analytics Only */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition-all duration-200 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><ChartBarIcon className="h-5 w-5 text-blue-400" />Progress Analytics</h2>
          <div className="mb-4">
            <span className="font-medium text-gray-900 dark:text-white">Current Streak:</span>{' '}
            <span className="text-blue-600 dark:text-white font-bold">{getStreak()}</span> <span className="text-gray-900 dark:text-white">day(s)</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full">
              <Bar data={getWeeklyData()} options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: { display: true, text: 'Topics Viewed Per Week (Last 8 Weeks)', color: theme.isDarkMode ? '#fff' : '#111' },
                },
                scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 1, color: theme.isDarkMode ? '#fff' : '#111' } },
                  x: { ticks: { color: theme.isDarkMode ? '#fff' : '#111' } },
                },
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 transition-all duration-200">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><BellIcon className="h-5 w-5 text-yellow-400" />Your Notifications
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">{unreadCount}</span>
          )}
        </h2>
        {notifLoading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (Array.isArray(notifications) ? notifications : []).length === 0 ? (
          <div className="text-gray-500">No notifications</div>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {(Array.isArray(notifications) ? notifications : []).map((n, i) => {
              const { icon, color } = notifTypeInfo(n.type);
              return (
                <li key={i} className={`p-2 rounded flex items-center gap-2 ${color} ${!n.read ? 'ring-2 ring-blue-400' : ''}`}>
                  {icon}
                  <div className="flex-1">
                    <div className="text-sm text-gray-800 dark:text-gray-200">{n.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                  {!(n.readBy || []).includes(user?._id) && (
                    <button className="ml-2 text-xs text-blue-600 underline" onClick={() => markAsRead(n._id)}>Mark as read</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Change Password Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 transition-all duration-200">
        <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white flex items-center gap-2"><LockClosedIcon className="h-5 w-5 text-blue-400" />Change Password</h2>
        <form onSubmit={handlePwSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Current Password</label>
            <div className="relative">
              <input type={showCurrentPw ? 'text' : 'password'} name="currentPassword" value={pwForm.currentPassword} onChange={handlePwChange} className="w-full p-2 rounded border pr-10" required />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 focus:outline-none"
                tabIndex={-1}
                onClick={() => setShowCurrentPw(v => !v)}
                aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
              >
                {showCurrentPw ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">New Password</label>
            <div className="relative">
              <input type={showNewPw ? 'text' : 'password'} name="newPassword" value={pwForm.newPassword} onChange={handlePwChange} className="w-full p-2 rounded border pr-10" required />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 focus:outline-none"
                tabIndex={-1}
                onClick={() => setShowNewPw(v => !v)}
                aria-label={showNewPw ? 'Hide password' : 'Show password'}
              >
                {showNewPw ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">Update Password</button>
          {pwMsg && <div className="text-green-600 mt-2 font-semibold">{pwMsg}</div>}
        </form>
      </div>

      <button className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition w-full" onClick={logout}>Sign Out</button>
      </div>
    </div>
  );
} 