import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => { onClose && onClose(); }, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div
      className={`fixed top-6 right-6 z-50 px-4 py-3 rounded shadow-lg flex items-center gap-2 transition-all animate-fade-in-up max-w-xs w-full sm:max-w-sm md:max-w-md ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
      role="alert"
      aria-live="assertive"
    >
      {type === 'success' ? (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      )}
      <span>{message}</span>
      <button className="ml-2 text-white/80 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-white" onClick={onClose} aria-label="Dismiss">&times;</button>
    </div>
  );
} 