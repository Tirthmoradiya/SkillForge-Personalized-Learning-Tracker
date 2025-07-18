import { UserIcon, TrashIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

export default function AdminUserLearningPaths({
  usersWithPaths,
  learningPaths,
  handleAssignPathToUser,
  handleRemovePathFromUser,
  loadingUsersWithPaths
}) {
  const [confirmRemove, setConfirmRemove] = useState({ userId: null, pathId: null });

  const getInitials = (username) =>
    username
      ? username
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : null;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
        <AcademicCapIcon className="h-6 w-6" />
        User Access Management
      </h3>
      {loadingUsersWithPaths ? (
        <div className="text-gray-600 dark:text-gray-300">Loading users...</div>
      ) : (
        <div className="space-y-4">
          {usersWithPaths.map(user => (
            <div key={user._id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3 mb-3 md:mb-0">
                <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-lg">
                  {getInitials(user.username) || <UserIcon className="h-6 w-6" />}
                </span>
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white">{user.username}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-1 ${user.role === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>{user.role}</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-2">
                  <h6 className="font-medium text-gray-900 dark:text-white mb-1">Current learning paths:</h6>
                  <div className="flex flex-wrap gap-2">
                    {user.learningPaths && user.learningPaths.length > 0 ? (
                      user.learningPaths.map(path => (
                        <span key={path._id} className="inline-flex items-center bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-bold">
                          {path.title}
                          <button
                            className="ml-2 text-red-500 hover:text-red-700 focus:outline-none"
                            onClick={() => setConfirmRemove({ userId: user._id, pathId: path._id })}
                            title="Remove"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No learning paths assigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <h6 className="font-medium text-gray-900 dark:text-white mb-1">Assign learning path:</h6>
                  <div className="flex gap-2 flex-wrap">
                    <select
                      className="border p-2 rounded flex-1 min-w-[180px]"
                      onChange={e => {
                        if (e.target.value) {
                          handleAssignPathToUser(user._id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">Select a learning path...</option>
                      {learningPaths.filter(path => !user.learningPaths.some(lp => lp._id === path._id)).map(path => (
                        <option key={path._id} value={path._id}>
                          {path.title} ({path.courses?.length || 0} courses)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              {/* Confirmation Modal for Remove Path */}
              {confirmRemove.userId === user._id && confirmRemove.pathId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 max-w-xs w-full">
                    <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Remove Learning Path?</h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to remove this learning path from <b>{user.username}</b>?</p>
                    <div className="flex gap-2 justify-end">
                      <button className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 transition" onClick={() => setConfirmRemove({ userId: null, pathId: null })}>Cancel</button>
                      <button className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition" onClick={() => { handleRemovePathFromUser(user._id, confirmRemove.pathId); setConfirmRemove({ userId: null, pathId: null }); }}>Remove</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 