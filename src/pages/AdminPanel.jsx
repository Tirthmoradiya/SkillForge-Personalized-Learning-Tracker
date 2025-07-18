import React, { useState, useEffect, useRef } from 'react';
import { AcademicCapIcon, UserIcon, PencilIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
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
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
import { saveAs } from 'file-saver';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminUserTable from '../components/AdminUserTable';

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Course/Topic state
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [topics, setTopics] = useState([]); // {title, txtFile, requiredIds:[]}
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [selectedTxt, setSelectedTxt] = useState('');
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Analytics state
  const [stats, setStats] = useState({ users: 0, courses: 0, topics: 0, recentSignups: 0 });
  const [signupChart, setSignupChart] = useState(null);
  const [popularTopics, setPopularTopics] = useState(null);
  const [courseCompletion, setCourseCompletion] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Retention & engagement analytics state
  const [retention, setRetention] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [engagementType, setEngagementType] = useState('daily');
  const [loadingRetention, setLoadingRetention] = useState(false);
  const [loadingEngagement, setLoadingEngagement] = useState(false);

  // User management state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', email: '', about: '', interests: '' });
  const [roleChanging, setRoleChanging] = useState('');
  const [userMsg, setUserMsg] = useState('');

  // Course editing state
  const [editCourseId, setEditCourseId] = useState(null);
  const [editCourseForm, setEditCourseForm] = useState({ title: '', description: '', level: 'Beginner' });
  const [courseMsg, setCourseMsg] = useState('');
  // Topic editing state
  const [editTopicId, setEditTopicId] = useState(null);
  const [editTopicForm, setEditTopicForm] = useState({ title: '', content: '' });
  const [topicMsg, setTopicMsg] = useState('');

  // Toast state
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });

  // Admin notification broadcast state
  const [notifMsg, setNotifMsg] = useState('');
  const [notifType, setNotifType] = useState('info');
  const [notifStatus, setNotifStatus] = useState('');

  // Admin notifications list state
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Learning Path Management state
  const [learningPaths, setLearningPaths] = useState([]);
  const [loadingLearningPaths, setLoadingLearningPaths] = useState(false);
  const [usersWithPaths, setUsersWithPaths] = useState([]);
  const [loadingUsersWithPaths, setLoadingUsersWithPaths] = useState(false);
  const [newPathForm, setNewPathForm] = useState({ title: '', description: '' });
  const [creatingPath, setCreatingPath] = useState(false);
  const [pathMsg, setPathMsg] = useState('');

  // Add state for file preview
  const [txtPreview, setTxtPreview] = useState('');
  const fileInputRef = useRef(null);

  // --- LIMITS ---
  const USER_LIMIT = 10;
  const ADMIN_LIMIT = 2;
  const COURSE_LIMIT = 10;
  const TOPIC_LIMIT = 5;

  // Compute counts
  const userCount = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const courseCount = courses.length;
  // For each course, topics count is c.subjects?.length or c.topics?.length

  const sendBroadcast = async () => {
    setNotifStatus('');
    const res = await fetch('/api/admin/notifications/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ message: notifMsg, type: notifType })
    });
    const data = await res.json();
    if (res.ok) {
      setNotifStatus('Notification sent!');
      setNotifMsg('');
    } else {
      setNotifStatus(data.message || 'Error sending notification');
    }
  };

  // Fetch existing courses for deletion
  useEffect(() => {
    if (!user) return;
    setLoadingCourses(true);
    fetch('/api/admin/courses', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => setCourses(data))
      .finally(() => setLoadingCourses(false));
  }, [user, creating]);

  // Fetch analytics on login
  useEffect(() => {
    if (!user) return;
    setLoadingStats(true);
    Promise.all([
      fetch('/api/admin/analytics/user-signups', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json()),
      fetch('/api/admin/courses', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json()),
      fetch('/api/admin/analytics/popular-topics', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json()),
      fetch('/api/admin/analytics/course-completion', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json()),
    ]).then(([signups, courses, topics, completion]) => {
      // Stat cards
      const totalUsers = signups.data.reduce((a, b) => a + b, 0);
      const recentSignups = signups.data[signups.data.length - 1] || 0;
      const totalCourses = Array.isArray(courses) ? courses.length : 0;
      // For topics, sum all topics in all courses
      let totalTopics = 0;
      if (Array.isArray(courses)) {
        courses.forEach(c => {
          if (Array.isArray(c.subjects)) totalTopics += c.subjects.length;
        });
      }
      setStats({ users: totalUsers, courses: totalCourses, topics: totalTopics, recentSignups });
      // Signup chart
      setSignupChart({
        labels: signups.labels,
        datasets: [{ label: 'User Signups', data: signups.data, backgroundColor: 'rgba(37, 99, 235, 0.7)' }]
      });
      // Popular topics chart
      setPopularTopics({
        labels: topics.map(t => t.title),
        datasets: [{ label: 'Views', data: topics.map(t => t.count), backgroundColor: 'rgba(16, 185, 129, 0.7)' }]
      });
      // Course completion chart
      setCourseCompletion({
        labels: completion.map(c => c.title),
        datasets: [{ label: 'Users Completed', data: completion.map(c => c.completedUsers), backgroundColor: 'rgba(59, 130, 246, 0.7)' }]
      });
    }).finally(() => setLoadingStats(false));
  }, [user]);

  // Fetch users
  useEffect(() => {
    if (!user) return;
    setLoadingUsers(true);
    fetch('/api/admin/users', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => setUsers(data))
      .finally(() => setLoadingUsers(false));
  }, [user]);

  // Fetch topics for each course (populate subjectsData)
  useEffect(() => {
    if (!user || !courses.length) return;
    const fetchSubjects = async () => {
      const updated = await Promise.all(courses.map(async c => {
        if (!c.subjects || c.subjects.length === 0) return { ...c, subjectsData: [] };
        const res = await fetch(`/api/topics?ids=${c.subjects.join(',')}`);
        const data = await res.json();
        return { ...c, subjectsData: data };
      }));
      setCourses(updated);
    };
    fetchSubjects();
  }, [user, loadingCourses]);

  // Fetch retention analytics
  useEffect(() => {
    if (!user) return;
    setLoadingRetention(true);
    fetch('/api/admin/analytics/retention', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(setRetention)
      .finally(() => setLoadingRetention(false));
  }, [user]);
  // Fetch engagement analytics
  useEffect(() => {
    if (!user) return;
    setLoadingEngagement(true);
    fetch('/api/admin/analytics/engagement', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(setEngagement)
      .finally(() => setLoadingEngagement(false));
  }, [user, engagementType]);

  // Fetch learning paths
  useEffect(() => {
    if (!user) return;
    setLoadingLearningPaths(true);
    fetch('/api/admin/learning-paths', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => setLearningPaths(data))
      .finally(() => setLoadingLearningPaths(false));
  }, [user]);

  // Fetch users with their learning paths
  useEffect(() => {
    if (!user) return;
    setLoadingUsersWithPaths(true);
    fetch('/api/admin/users/learning-paths', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        console.log('Users with learning paths data:', data);
        setUsersWithPaths(data);
      })
      .finally(() => setLoadingUsersWithPaths(false));
  }, [user]);

  // Fetch all notifications for admin
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    setLoadingNotifications(true);
    fetch('/api/admin/notifications', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(setAdminNotifications)
      .finally(() => setLoadingNotifications(false));
  }, [user, notifStatus]);

  // Export analytics as CSV
  const exportCSV = (data, filename) => {
    const rows = [Object.keys(data[0] || {}).join(',')];
    data.forEach(row => rows.push(Object.values(row).join(',')));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    saveAs(blob, filename);
  };

  // Dependency selection
  const handleRequiredChange = (topicIdx, reqIdx) => {
    setTopics(topics => topics.map((t, i) =>
      i === topicIdx ? { ...t, requiredIds: t.requiredIds.includes(reqIdx) ? t.requiredIds.filter(id => id !== reqIdx) : [...t.requiredIds, reqIdx] } : t
    ));
  };

  // Add topic to local state
  const handleAddTopic = () => {
    if (!newTopicTitle || !selectedTxt) {
      setErrorMsg('Please enter a topic title and select a .txt file.');
      return;
    }
    if (topics.some(t => t.title === newTopicTitle)) {
      setErrorMsg('A topic with this title already exists.');
      return;
    }
    if (topics.length >= TOPIC_LIMIT) {
      setErrorMsg('Topic limit reached for this course. No more than 5 topics allowed.');
      showToast('Topic limit reached for this course. No more than 5 topics allowed.', 'error');
      return;
    }
    setTopics([...topics, { title: newTopicTitle, txtFile: selectedTxt, preview: txtPreview, requiredIds: [] }]);
    setNewTopicTitle('');
    setSelectedTxt('');
    setTxtPreview('');
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // New handler for file input
  const handleTxtFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.txt')) return;
    const text = await file.text();
    setSelectedTxt(text);
    const lines = text.split('\n');
    setTxtPreview(lines.slice(0, 2).join('\n'));
  };

  // Backend integration for course creation
  const handleCreateCourse = async () => {
    if (courseCount >= COURSE_LIMIT) {
      setErrorMsg('Course limit reached. No more than 10 courses allowed.');
      showToast('Course limit reached. No more than 10 courses allowed.', 'error');
      return;
    }
    setCreating(true);
    setSuccessMsg('');
    setErrorMsg('');
    if (!courseTitle.trim() || !courseDesc.trim() || topics.length === 0) {
      setErrorMsg('Please fill in all course fields and add at least one topic.');
      setCreating(false);
      return;
    }
    for (const t of topics) {
      if (!t.title.trim() || !t.txtFile.trim()) {
        setErrorMsg('Each topic must have a title and content.');
        setCreating(false);
        return;
      }
    }
    try {
      // 1. Create topics in backend, one by one, with error handling
      const createdTopics = [];
      for (const t of topics) {
        const res = await fetch('/api/topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({
            title: t.title,
            description: t.title,
            content: t.txtFile,
            type: 'core',
            difficulty: 'beginner',
            estimatedMinutes: 10
          })
        });
        if (!res.ok) {
          setErrorMsg(`Failed to create topic: ${t.title}`);
          setCreating(false);
          return;
        }
        const topic = await res.json();
        if (!topic || !topic._id) {
          setErrorMsg(`Invalid topic created: ${t.title}`);
          setCreating(false);
          return;
        }
        createdTopics.push(topic);
      }
      if (createdTopics.length !== topics.length) {
        setErrorMsg('Some topics failed to create. Please try again.');
        setCreating(false);
        return;
      }
      // 2. Create course in backend, set firstTopic as the first topic
      const courseRes = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: courseTitle,
          description: courseDesc,
          topics: createdTopics.map(t => t._id),
          level: editCourseForm.level || 'Beginner'
        })
      });
      if (!courseRes.ok) throw new Error('Failed to create course');
      const course = await courseRes.json();
      // 3. Set dependencies for each topic
      await Promise.all(topics.map(async (t, i) => {
        if (t.requiredIds.length > 0) {
          await fetch(`/api/admin/courses/${course._id}/dependencies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject: createdTopics[i]._id, requiredSubjects: t.requiredIds.map(idx => createdTopics[idx]._id) })
          });
        }
      }));
      // 4. Notify all users (mock: notify all, real: fetch user list)
      await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: ['all'], message: `A new course "${courseTitle}" has been added!`, course: course._id })
      });
      setSuccessMsg('Course created and users notified!');
      setCourseTitle('');
      setCourseDesc('');
      setTopics([]);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setCreating(false);
    }
  };

  // Delete a topic from a course
  const handleDeleteTopic = async (courseId, topicId) => {
    await fetch(`/api/admin/topics/${topicId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
    setCourses(courses => courses.map(c => c._id === courseId ? { ...c, subjects: c.subjects.filter(t => t !== topicId) } : c));
  };

  // Delete a course
  const handleDeleteCourse = async (courseId) => {
    await fetch(`/api/admin/courses/${courseId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
    setCourses(courses => courses.filter(c => c._id !== courseId));
  };

  // Edit user handlers
  const handleEditUser = (user) => {
    setEditUserId(user._id);
    setEditForm({
      username: user.username,
      email: user.email,
      about: user.about || '',
      interests: (user.interests || []).join(', ')
    });
    setUserMsg('');
  };
  const handleEditChange = e => setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditSave = async (id) => {
    setUserMsg('');
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: editForm.username,
        email: editForm.email,
        about: editForm.about,
        interests: editForm.interests.split(',').map(s => s.trim()).filter(Boolean)
      })
    });
    const data = await res.json();
    if (res.ok) {
      setUsers(users => users.map(u => u._id === id ? { ...u, ...editForm, interests: editForm.interests.split(',').map(s => s.trim()).filter(Boolean) } : u));
      setEditUserId(null);
      showToast('User updated!', 'success');
    } else {
      showToast(data.message || 'Error updating user', 'error');
    }
  };
  const handleEditCancel = () => {
    setEditUserId(null);
    setUserMsg('');
  };

  // Change role
  const handleChangeRole = async (id, newRole) => {
    if (newRole === 'admin' && adminCount >= ADMIN_LIMIT && users.find(u => u._id === id)?.role !== 'admin') {
      showToast('Admin limit reached. No more than 2 admins allowed.', 'error');
      return;
    }
    setRoleChanging(id + newRole);
    setUserMsg('');
    const res = await fetch(`/api/admin/users/${id}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    });
    const data = await res.json();
    if (res.ok) {
      setUsers(users => users.map(u => u._id === id ? { ...u, role: newRole } : u));
      showToast('Role updated!', 'success');
    } else {
      showToast(data.message || 'Error updating role', 'error');
    }
    setRoleChanging('');
  };

  // Delete user
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setUserMsg('');
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
    if (res.ok) {
      setUsers(users => users.filter(u => u._id !== id));
      showToast('User deleted!', 'success');
    } else {
      const data = await res.json();
      showToast(data.message || 'Error deleting user', 'error');
    }
  };

  // Edit course handlers
  const handleEditCourse = (course) => {
    setEditCourseId(course._id);
    setEditCourseForm({
      title: course.title,
      description: course.description,
      level: course.level || 'Beginner',
    });
    setCourseMsg('');
  };
  const handleEditCourseChange = e => setEditCourseForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditCourseSave = async (id) => {
    setCourseMsg('');
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editCourseForm)
    });
    const data = await res.json();
    if (res.ok) {
      setCourses(courses => courses.map(c => c._id === id ? { ...c, ...editCourseForm } : c));
      setEditCourseId(null);
      showToast('Course updated!', 'success');
    } else {
      showToast(data.message || 'Error updating course', 'error');
    }
  };
  const handleEditCourseCancel = () => {
    setEditCourseId(null);
    setCourseMsg('');
  };

  // Edit topic handlers
  const handleEditTopic = (topicId, course) => {
    const topic = course.subjectsData?.find(t => t._id === topicId);
    if (!topic) return;
    setEditTopicId(topicId);
    setEditTopicForm({
      title: topic.title,
      content: topic.content || '',
    });
    setTopicMsg('');
  };
  const handleEditTopicChange = e => setEditTopicForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditTopicSave = async (id, courseId) => {
    setTopicMsg('');
    const res = await fetch(`/api/admin/topics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editTopicForm)
    });
    const data = await res.json();
    if (res.ok) {
      setCourses(courses => courses.map(c => {
        if (c._id !== courseId) return c;
        return {
          ...c,
          subjectsData: c.subjectsData?.map(t => t._id === id ? { ...t, ...editTopicForm } : t)
        };
      }));
      setEditTopicId(null);
      showToast('Topic updated!', 'success');
    } else {
      showToast(data.message || 'Error updating topic', 'error');
    }
  };
  const handleEditTopicCancel = () => {
    setEditTopicId(null);
    setTopicMsg('');
  };

  // Learning Path Management Functions
  const handleCreateLearningPath = async () => {
    if (!newPathForm.title.trim()) {
      setPathMsg('Title is required');
      return;
    }
    setCreatingPath(true);
    setPathMsg('');
    try {
      const res = await fetch('/api/admin/learning-paths', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newPathForm)
      });
      const data = await res.json();
      if (res.ok) {
        setNewPathForm({ title: '', description: '' });
        setLearningPaths([...learningPaths, data]);
        showToast('Learning path created successfully');
      } else {
        setPathMsg(data.message || 'Error creating learning path');
      }
    } catch (err) {
      setPathMsg('Error creating learning path');
    } finally {
      setCreatingPath(false);
    }
  };

  const handleAddCourseToPath = async (pathId, courseId) => {
    try {
      const res = await fetch(`/api/admin/learning-paths/${pathId}/add-course`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ courseId })
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh the learning paths data to get populated courses
        const refreshRes = await fetch('/api/admin/learning-paths', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const refreshedPaths = await refreshRes.json();
        setLearningPaths(refreshedPaths);
        showToast('Course added to learning path');
      } else {
        showToast(data.message || 'Error adding course', 'error');
      }
    } catch (err) {
      showToast('Error adding course to learning path', 'error');
    }
  };

  const handleRemoveCourseFromPath = async (pathId, courseId) => {
    try {
      const res = await fetch(`/api/admin/learning-paths/${pathId}/remove-course`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ courseId })
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh the learning paths data to get populated courses
        const refreshRes = await fetch('/api/admin/learning-paths', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const refreshedPaths = await refreshRes.json();
        setLearningPaths(refreshedPaths);
        showToast('Course removed from learning path');
      } else {
        showToast(data.message || 'Error removing course', 'error');
      }
    } catch (err) {
      showToast('Error removing course from learning path', 'error');
    }
  };

  const handleAssignPathToUser = async (userId, pathId) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/add-path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ pathId })
      });
      const data = await res.json();
      if (res.ok) {
        setUsersWithPaths(usersWithPaths.map(u => u._id === userId ? data.user : u));
        showToast('Learning path assigned to user');
      } else {
        showToast(data.message || 'Error assigning learning path', 'error');
      }
    } catch (err) {
      showToast('Error assigning learning path to user', 'error');
    }
  };

  const handleRemovePathFromUser = async (userId, pathId) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/remove-path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ pathId })
      });
      const data = await res.json();
      if (res.ok) {
        setUsersWithPaths(usersWithPaths.map(u => u._id === userId ? data.user : u));
        showToast('Learning path removed from user');
      } else {
        showToast(data.message || 'Error removing learning path', 'error');
      }
    } catch (err) {
      showToast('Error removing learning path from user', 'error');
    }
  };

  const handleDeleteLearningPath = async (pathId) => {
    if (!confirm('Are you sure you want to delete this learning path? This will remove it from all users.')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/learning-paths/${pathId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        setLearningPaths(learningPaths.filter(p => p._id !== pathId));
        setUsersWithPaths(usersWithPaths.map(u => ({
          ...u,
          learningPaths: u.learningPaths.filter(p => p._id !== pathId)
        })));
        showToast('Learning path deleted');
      } else {
        const data = await res.json();
        showToast(data.message || 'Error deleting learning path', 'error');
      }
    } catch (err) {
      showToast('Error deleting learning path', 'error');
    }
  };

  // Defensive: always use an array for users
  const safeUsers = Array.isArray(users) ? users : [];

  // Logout handler
  const handleLogout = () => {
    if (logout) logout();
    localStorage.removeItem('token');
    navigate('/login');
  };

  // If not admin, show access denied
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-md w-full space-y-8 relative">
          <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl px-8 pt-6 pb-8 border border-gray-100 dark:border-gray-700 backdrop-blur-sm backdrop-filter text-center">
            <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-300">You do not have permission to view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Logout Button */}
      <button
        className="absolute top-6 right-6 bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition z-50"
        onClick={handleLogout}
      >
        Logout
      </button>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,_#f3f4f6_25%,_transparent_25%,_transparent_75%,_#f3f4f6_75%,_#f3f4f6),linear-gradient(45deg,_#f3f4f6_25%,_transparent_25%,_transparent_75%,_#f3f4f6_75%,_#f3f4f6)] dark:bg-[linear-gradient(45deg,_#1f2937_25%,_transparent_25%,_transparent_75%,_#1f2937_75%,_#1f2937),linear-gradient(45deg,_#1f2937_25%,_transparent_25%,_transparent_75%,_#1f2937_75%,_#1f2937)] bg-[length:32px_32px] [background-position:0_0,_16px_16px] opacity-[0.1] pointer-events-none"></div>
      {/* LIMITS OVERVIEW */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-lg font-bold">Users</div>
          <div className="text-2xl font-mono">{userCount} / {USER_LIMIT}</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-lg font-bold">Admins</div>
          <div className="text-2xl font-mono">{adminCount} / {ADMIN_LIMIT}</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-lg font-bold">Courses</div>
          <div className="text-2xl font-mono">{courseCount} / {COURSE_LIMIT}</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-lg font-bold">Topics (per course)</div>
          <div className="text-xs">Max {TOPIC_LIMIT} per course</div>
        </div>
      </div>
      {/* Admin Notification Broadcast */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 max-w-xl mx-auto">
        <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Send Notification to All Users</h2>
        <textarea
          className="w-full p-2 rounded border mb-2"
          rows={3}
          value={notifMsg}
          onChange={e => setNotifMsg(e.target.value)}
          placeholder="Enter notification message"
        />
        <select
          className="mb-2 p-2 rounded border"
          value={notifType}
          onChange={e => setNotifType(e.target.value)}
        >
          <option value="info">Info</option>
          <option value="admin">Admin</option>
          <option value="reminder">Reminder</option>
          <option value="achievement">Achievement</option>
          <option value="progress">Progress</option>
          <option value="system">System</option>
        </select>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
          onClick={sendBroadcast}
          disabled={!notifMsg.trim()}
        >
          Send Notification
        </button>
        {notifStatus && <div className="mt-2 text-green-600">{notifStatus}</div>}
      </div>
      {/* Admin Notification List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 max-w-2xl mx-auto">
        <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">All Notifications</h2>
        {loadingNotifications ? (
          <div>Loading...</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {(Array.isArray(adminNotifications) ? adminNotifications : []).map(n => (
              <li key={n._id} className="py-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-white">{n.message}</span>
                  <span className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-400">Type: {n.type} | Read by: {n.readBy?.length || 0} users</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="max-w-5xl w-full space-y-8 relative mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl px-8 pt-6 pb-8 border border-gray-100 dark:border-gray-700 backdrop-blur-sm backdrop-filter">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-8 border-b-2 border-blue-100 dark:border-blue-900 pb-2 flex items-center gap-3">
            <AcademicCapIcon className="h-8 w-8 text-blue-500" />
            Admin Panel
          </h2>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
            {loadingStats ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 dark:bg-gray-900 rounded-xl animate-pulse" />
              ))
            ) : (
              <>
                <StatCard label="Total Users" value={stats.users} color="from-blue-500 to-blue-700" icon={UserIcon} />
                <StatCard label="Total Courses" value={stats.courses} color="from-green-500 to-green-700" icon={AcademicCapIcon} />
                <StatCard label="Total Topics" value={stats.topics} color="from-purple-500 to-purple-700" icon={ShieldCheckIcon} />
                <StatCard label="Signups (This Week)" value={stats.recentSignups} color="from-yellow-500 to-yellow-700" icon={UserIcon} />
              </>
            )}
          </div>
          {/* Analytics Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white">User Signups Per Week</h3>
              {loadingStats || !signupChart ? <div className="h-48 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" /> : (
                <Bar data={signupChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              )}
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Most Popular Topics</h3>
              {loadingStats || !popularTopics ? <div className="h-48 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" /> : (
                <Bar data={popularTopics} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              )}
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700 md:col-span-2">
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Course Completion Rates</h3>
              {loadingStats || !courseCompletion ? <div className="h-48 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" /> : (
                <Bar data={courseCompletion} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              )}
            </div>
          </div>
          {/* Retention Analytics */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold mb-2 text-gray-900 dark:text-white flex items-center gap-2">User Retention
              <button className="ml-auto text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200" onClick={() => exportCSV([
                { label: '1 Day', value: retention?.day1 },
                { label: '7 Day', value: retention?.day7 },
                { label: '30 Day', value: retention?.day30 }
              ], 'retention.csv')}>Export CSV</button>
            </h3>
            {loadingRetention || !retention ? <div className="h-32 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" /> : (
              <Bar data={{
                labels: ['1 Day', '7 Day', '30 Day'],
                datasets: [{ label: 'Retention (%)', data: [retention.day1, retention.day7, retention.day30], backgroundColor: ['#60a5fa', '#34d399', '#fbbf24'] }]
              }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            )}
            <div className="mt-2 text-xs text-gray-500">% of users who returned after 1, 7, or 30 days</div>
          </div>
          {/* Engagement Analytics */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center mb-2">
              <h3 className="font-bold text-gray-900 dark:text-white flex-1">User Engagement</h3>
              <select className="border p-1 rounded text-xs" value={engagementType} onChange={e => setEngagementType(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <button className="ml-2 text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200" onClick={() => {
                if (!engagement || !engagement[engagementType]) return;
                const type = engagementType;
                const data = (engagement[type] || []).map((v, i) => ({ label: engagement.labels[type][i], value: v }));
                exportCSV(data, `engagement-${type}.csv`);
              }}>Export CSV</button>
            </div>
            {loadingEngagement || !engagement || !engagement[engagementType] || !engagement.labels || !engagement.labels[engagementType] ? (
              <div className="h-32 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
            ) : (
              <Bar data={{
                labels: engagement.labels[engagementType],
                datasets: [{ label: `${engagementType.charAt(0).toUpperCase() + engagementType.slice(1)} Active Users`, data: engagement[engagementType], backgroundColor: '#818cf8' }]
              }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            )}
            <div className="mt-2 text-xs text-gray-500">Active users per {engagementType} (last 8 {engagementType === 'daily' ? 'days' : engagementType === 'weekly' ? 'weeks' : 'months'})</div>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2 text-white">Create Course</h3>
            <input type="text" className="w-full border p-2 rounded mb-2" placeholder="Course Title" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} />
            <textarea className="w-full border p-2 rounded mb-2" placeholder="Course Description" value={courseDesc} onChange={e => setCourseDesc(e.target.value)} />
            <h4 className="font-semibold mb-1 text-white">Topics</h4>
            <ul className="mb-2">
              {topics.map((t, i) => (
                <li key={i} className="mb-1">
                  <span className="text-white font-semibold">{t.title}</span> <span className="text-xs text-gray-400">(.txt)</span>
                  <span className="ml-2 text-xs text-gray-300">Required: </span>
                  <span className="text-white">{t.requiredIds.map(idx => topics[idx]?.title).filter(Boolean).join(', ')}</span>
                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-line">
                    {t.preview}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {topics.map((opt, idx) => idx !== i && (
                      <label key={idx} className="text-xs mr-2">
                        <input
                          type="checkbox"
                          checked={t.requiredIds.includes(idx)}
                          onChange={() => handleRequiredChange(i, idx)}
                        /> {opt.title}
                      </label>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mb-2">
              <input type="text" className="border p-2 rounded flex-1" placeholder="Topic Title" value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} />
              <input type="file" accept=".txt" className="border p-2 rounded" onChange={handleTxtFileChange} ref={fileInputRef} />
              <button className="bg-green-600 text-white px-4 rounded" onClick={handleAddTopic} type="button" disabled={topics.length >= TOPIC_LIMIT} title={topics.length >= TOPIC_LIMIT ? 'Topic limit reached for this course' : ''}>Add</button>
            </div>
            {txtPreview && (
              <div className="text-xs text-gray-600 dark:text-gray-300 mb-2 whitespace-pre-line">
                <strong>Preview:</strong>\n{txtPreview}
              </div>
            )}
            <button className="w-full bg-blue-600 text-white py-2 rounded mt-2" onClick={handleCreateCourse} disabled={creating || courseCount >= COURSE_LIMIT} title={courseCount >= COURSE_LIMIT ? 'Course limit reached' : ''}>{creating ? 'Creating...' : 'Create Course'}</button>
            {successMsg && <div className="text-green-600 mt-2">{successMsg}</div>}
            {errorMsg && <div className="text-red-600 mt-2">{errorMsg}</div>}
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2 text-white">Delete/Edit Courses & Topics</h3>
            {loadingCourses ? <div>Loading courses...</div> : (
              <ul className="space-y-4">
                {courses.map(course => (
                  <li key={course._id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      {editCourseId === course._id ? (
                        <>
                          <input name="title" value={editCourseForm.title} onChange={handleEditCourseChange} className="border p-1 rounded w-40 mr-2" />
                          <input name="description" value={editCourseForm.description} onChange={handleEditCourseChange} className="border p-1 rounded w-64 mr-2" />
                          <select name="level" value={editCourseForm.level} onChange={handleEditCourseChange} className="border p-1 rounded mr-2">
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                          </select>
                          <button className="bg-blue-600 text-white px-2 py-1 rounded mr-1" onClick={() => handleEditCourseSave(course._id)}><PencilIcon className="h-4 w-4 inline" /> Save</button>
                          <button className="bg-gray-300 text-gray-700 px-2 py-1 rounded" onClick={handleEditCourseCancel}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-lg text-gray-900 dark:text-white mr-2">{course.title}</span>
                          <span className="text-gray-700 dark:text-gray-300 mr-2">{course.description}</span>
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 mr-2">{course.level || 'Beginner'}</span>
                          <button className="text-blue-600 hover:underline mr-2" onClick={() => handleEditCourse(course)}><PencilIcon className="h-4 w-4 inline" /> Edit</button>
                          <button className="text-red-600 hover:underline" onClick={() => handleDeleteCourse(course._id)}>Delete Course</button>
                        </>
                      )}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 mb-2">{course.description}</div>
                    <div className="flex flex-wrap gap-2">
                      {course.subjectsData && course.subjectsData.map(topic => (
                        <div key={topic._id} className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                          {editTopicId === topic._id ? (
                            <>
                              <input name="title" value={editTopicForm.title} onChange={handleEditTopicChange} className="border p-1 rounded w-32 mr-2" />
                              <input name="content" value={editTopicForm.content} onChange={handleEditTopicChange} className="border p-1 rounded w-48 mr-2" />
                              <button className="bg-blue-600 text-white px-2 py-1 rounded mr-1" onClick={() => handleEditTopicSave(topic._id, course._id)}><PencilIcon className="h-4 w-4 inline" /> Save</button>
                              <button className="bg-gray-300 text-gray-700 px-2 py-1 rounded" onClick={handleEditTopicCancel}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <span className="font-medium text-gray-900 dark:text-white">{topic.title}</span>
                              <span className="text-xs text-gray-500">({topic._id})</span>
                              <button className="text-blue-600 hover:underline mr-2" onClick={() => handleEditTopic(topic._id, course)}><PencilIcon className="h-4 w-4 inline" /> Edit</button>
                              <button className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs" onClick={() => handleDeleteTopic(course._id, topic._id)}>
                                Delete Topic
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    {courseMsg && editCourseId === course._id && <div className="mt-2 text-green-600">{courseMsg}</div>}
                    {topicMsg && <div className="mt-2 text-green-600">{topicMsg}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* User Management Section */}
          <AdminUserTable
            users={safeUsers}
            editUserId={editUserId}
            editForm={editForm}
            handleEditUser={handleEditUser}
            handleEditChange={handleEditChange}
            handleEditSave={handleEditSave}
            handleEditCancel={handleEditCancel}
            handleChangeRole={handleChangeRole}
            handleDeleteUser={handleDeleteUser}
            roleChanging={roleChanging}
            adminCount={adminCount}
            ADMIN_LIMIT={ADMIN_LIMIT}
            loadingUsers={loadingUsers}
            userMsg={userMsg}
          />

          {/* Learning Path Management Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <AcademicCapIcon className="h-6 w-6" />
              Learning Path Management
            </h3>
            
            {/* Create New Learning Path */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Create New Learning Path</h4>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="border p-2 rounded flex-1"
                  placeholder="Learning Path Title"
                  value={newPathForm.title}
                  onChange={e => setNewPathForm({ ...newPathForm, title: e.target.value })}
                />
                <input
                  type="text"
                  className="border p-2 rounded flex-1"
                  placeholder="Description (optional)"
                  value={newPathForm.description}
                  onChange={e => setNewPathForm({ ...newPathForm, description: e.target.value })}
                />
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                  onClick={handleCreateLearningPath}
                  disabled={creatingPath}
                >
                  {creatingPath ? 'Creating...' : 'Create Path'}
                </button>
              </div>
              {pathMsg && <div className="text-red-600 text-sm">{pathMsg}</div>}
            </div>

            {/* Learning Paths List */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">Manage Learning Paths</h4>
              {loadingLearningPaths ? (
                <div className="text-gray-600 dark:text-gray-300">Loading learning paths...</div>
              ) : (
                learningPaths.map(path => (
                  <div key={path._id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-white">{path.title}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{path.description}</p>
                        <p className="text-xs text-gray-500">Courses: {path.courses?.length || 0}</p>
                      </div>
                      <button
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                        onClick={() => handleDeleteLearningPath(path._id)}
                      >
                        Delete Path
                      </button>
                    </div>
                    
                    {/* Courses in this path */}
                    <div className="mb-3">
                      <h6 className="font-medium text-gray-900 dark:text-white mb-2">Courses in this path:</h6>
                      <div className="space-y-2">
                        {path.courses && path.courses.length > 0 ? (
                          path.courses.map(course => (
                            <div key={course._id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700">
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white">{course.title}</span>
                                <span className="text-xs text-gray-500 ml-2">({course.level || 'Beginner'})</span>
                              </div>
                              <button
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition"
                                onClick={() => handleRemoveCourseFromPath(path._id, course._id)}
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No courses in this path</p>
                        )}
                      </div>
                    </div>

                    {/* Add course to this path */}
                    <div>
                      <h6 className="font-medium text-gray-900 dark:text-white mb-2">Add course to this path:</h6>
                      <div className="flex gap-2">
                        <select
                          className="border p-2 rounded flex-1"
                          onChange={e => {
                            if (e.target.value) {
                              handleAddCourseToPath(path._id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        >
                          <option value="">Select a course...</option>
                          {courses.map(course => (
                            <option key={course._id} value={course._id}>
                              {course.title} ({course.level || 'Beginner'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User Access Management Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <UserIcon className="h-6 w-6" />
              User Access Management
            </h3>
            
            {loadingUsersWithPaths ? (
              <div className="text-gray-600 dark:text-gray-300">Loading users...</div>
            ) : (
              <div className="space-y-4">
                {usersWithPaths.map(user => (
                  <div key={user._id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold">
                        {user.username?.[0]?.toUpperCase() || <UserIcon className="h-5 w-5" />}
                      </span>
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-white">{user.username}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                        <p className="text-xs text-gray-500">Role: {user.role}</p>
                      </div>
                    </div>
                    
                    {/* Current learning paths */}
                    <div className="mb-3">
                      <h6 className="font-medium text-gray-900 dark:text-white mb-2">Current learning paths:</h6>
                      <div className="space-y-2">
                        {user.learningPaths && user.learningPaths.length > 0 ? (
                          user.learningPaths.map(path => (
                            <div key={path._id} className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900 dark:text-white">{path.title}</span>
                                <button
                                  className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition"
                                  onClick={() => handleRemovePathFromUser(user._id, path._id)}
                                >
                                  Remove
                                </button>
                              </div>
                              {path.courses && path.courses.length > 0 && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Courses: {path.courses.map(course => course.title).join(', ')}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No learning paths assigned</p>
                        )}
                      </div>
                    </div>

                    {/* Assign learning path */}
                    <div>
                      <h6 className="font-medium text-gray-900 dark:text-white mb-2">Assign learning path:</h6>
                      <div className="flex gap-2">
                        <select
                          className="border p-2 rounded flex-1"
                          onChange={e => {
                            if (e.target.value) {
                              handleAssignPathToUser(user._id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        >
                          <option value="">Select a learning path...</option>
                          {learningPaths.map(path => (
                            <option key={path._id} value={path._id}>
                              {path.title} ({path.courses?.length || 0} courses)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}

// 1. Polish StatCard: add icon, gradient, hover effect
function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className={`rounded-xl shadow bg-gradient-to-br ${color} text-white p-6 flex flex-col items-center justify-center transition-transform duration-200 hover:scale-105 hover:shadow-2xl`}
      style={{ minHeight: 110 }}>
      {Icon && <Icon className="h-8 w-8 mb-2 opacity-80" />}
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium tracking-wide uppercase opacity-80">{label}</div>
    </div>
  );
} 