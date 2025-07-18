import React, { useEffect, useState, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth ? useAuth() : { user: null };
  const bellRef = useRef();
  const menuRef = useRef();

  useEffect(() => {
    const fetchNotifications = () => {
      setLoading(true);
      fetch('/api/user/notifications', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setNotifications(data);
          } else if (data && Array.isArray(data.notifications)) {
            setNotifications(data.notifications);
          } else {
            setNotifications([]);
          }
        })
        .finally(() => setLoading(false));
    };
    fetchNotifications();
    window.addEventListener('notifications-updated', fetchNotifications);
    return () => window.removeEventListener('notifications-updated', fetchNotifications);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (
        bellRef.current && !bellRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const userId = user?._id || JSON.parse(localStorage.getItem('user') || '{}')._id;
  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !(n.readBy || []).includes(userId)).length : 0;

  // Add mark as read handler
  const markAsRead = async (notificationId) => {
    await fetch(`/api/user/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    setNotifications(notifications => notifications.map(n =>
      n._id === notificationId ? { ...n, readBy: [...(n.readBy || []), userId] } : n
    ));
    // Optionally, dispatch a global event to update other components
    window.dispatchEvent(new Event('notifications-updated'));
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="rounded-full bg-blue-700 p-3 text-blue-100 hover:text-white hover:bg-blue-600 transition-colors duration-200 relative focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setOpen(o => !o)}
        ref={bellRef}
        aria-label="Open notifications"
        tabIndex={0}
      >
        <BellIcon className="h-7 w-7" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-full max-w-xs sm:w-80 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-50 p-4 border border-gray-200 dark:border-gray-700"
          ref={menuRef}
          tabIndex={0}
          aria-label="Notifications dropdown"
        >
          <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Notifications</h4>
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : !Array.isArray(notifications) || notifications.length === 0 ? (
            <div className="text-gray-500">No notifications</div>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.map((n, i) => {
                const isUnread = !(n.readBy || []).includes(userId);
                return (
                  <li
                    key={i}
                    className={`p-3 rounded cursor-pointer flex items-center gap-2 ${isUnread ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-50 dark:bg-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    onClick={() => isUnread && markAsRead(n._id)}
                    tabIndex={0}
                    aria-label={n.message}
                  >
                    {isUnread && <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>}
                    <div className="flex-1">
                      <div className="text-sm text-gray-800 dark:text-gray-200">{n.message}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
} 