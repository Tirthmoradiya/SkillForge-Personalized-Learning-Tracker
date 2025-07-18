import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [highContrast, setHighContrast] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');

  // Change Password state and logic (copied from Profile)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    setDeleting(true);
    const res = await fetch('/api/user/account', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) {
      setMessage('Account deleted. Logging out...');
      setTimeout(() => { window.location.href = '/login'; }, 2000);
    } else {
      setMessage('Error deleting account');
    }
    setDeleting(false);
  };
  const handleExport = async () => {
    setExporting(true);
    const res = await fetch('/api/user/account/export', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) {
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my_data.json';
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Data exported!');
    } else {
      setMessage('Error exporting data');
    }
    setExporting(false);
  };
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden${highContrast ? ' contrast-200' : ''}`}>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,_#f3f4f6_25%,_transparent_25%,_transparent_75%,_#f3f4f6_75%,_#f3f4f6),linear-gradient(45deg,_#f3f4f6_25%,_transparent_25%,_transparent_75%,_#f3f4f6_75%,_#f3f4f6)] dark:bg-[linear-gradient(45deg,_#1f2937_25%,_transparent_25%,_transparent_75%,_#1f2937_75%,_#1f2937),linear-gradient(45deg,_#1f2937_25%,_transparent_25%,_transparent_75%,_#1f2937_75%,_#1f2937)] bg-[length:32px_32px] [background-position:0_0,_16px_16px] opacity-[0.1] pointer-events-none select-none"></div>
      <div className="max-w-xl w-full relative mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Settings</h1>

      {/* Change Password Card */}
      <div className="mb-8">
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

      <div className="mb-6">
        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Theme & Accessibility</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="px-3 py-2 rounded-lg border border-blue-400 bg-white/80 dark:bg-gray-900/80 text-blue-700 dark:text-blue-300 font-semibold text-xs shadow hover:bg-blue-50 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            className="px-3 py-2 rounded-lg border border-yellow-400 bg-white/80 dark:bg-gray-900/80 text-yellow-700 dark:text-yellow-300 font-semibold text-xs shadow hover:bg-yellow-50 dark:hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            onClick={() => setHighContrast(h => !h)}
            aria-label="Toggle high contrast mode"
          >
            {highContrast ? 'Normal Contrast' : 'High Contrast'}
          </button>
        </div>
      </div>
      <div className="mb-6">
        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Account</label>
        <button className="bg-red-600 text-white px-4 py-2 rounded mr-2" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete Account'}
        </button>
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting...' : 'Export My Data'}
        </button>
      </div>
      {message && <div className="text-green-600 mt-2">{message}</div>}
        </div>
      </div>
    </div>
  );
} 