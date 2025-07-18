import { UserIcon, PencilIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

export default function AdminUserTable({
  users,
  editUserId,
  editForm,
  handleEditUser,
  handleEditChange,
  handleEditSave,
  handleEditCancel,
  handleChangeRole,
  handleDeleteUser,
  roleChanging,
  adminCount,
  ADMIN_LIMIT,
  loadingUsers,
  userMsg,
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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
    <div className="overflow-x-auto rounded-xl shadow bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">About</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Interests</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {users.length > 0 ? (
            users.map((user, idx) => (
              <tr
                key={user._id}
                className={`hover:bg-blue-50 dark:hover:bg-blue-900/30 transition ${idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : ''}`}
              >
                <td className="px-4 py-2 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold">
                    {getInitials(user.username) || <UserIcon className="h-5 w-5" />}
                  </span>
                  {editUserId === user._id ? (
                    <input
                      name="username"
                      value={editForm.username}
                      onChange={handleEditChange}
                      className="border p-1 rounded w-28"
                    />
                  ) : (
                    <span className="font-medium text-gray-900 dark:text-white" title={user.username}>
                      {user.username}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2" title={user.email}>
                  {editUserId === user._id ? (
                    <input
                      name="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      className="border p-1 rounded w-36"
                    />
                  ) : (
                    <span className="text-gray-700 dark:text-gray-200">{user.email}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {editUserId === user._id ? (
                    <textarea
                      name="about"
                      value={editForm.about}
                      onChange={handleEditChange}
                      className="border p-1 rounded w-36"
                    />
                  ) : (
                    <span className="text-gray-700 dark:text-gray-200 whitespace-pre-line">{user.about}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {editUserId === user._id ? (
                    <input
                      name="interests"
                      value={editForm.interests}
                      onChange={handleEditChange}
                      className="border p-1 rounded w-32"
                      placeholder="Comma separated"
                    />
                  ) : (
                    <span className="text-gray-700 dark:text-gray-200">{(user.interests || []).join(', ')}</span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  {editUserId === user._id ? (
                    <span className="inline-block px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200">
                      {user.role}
                    </span>
                  ) : (
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {editUserId === user._id ? (
                    <div className="flex gap-2">
                      <button
                        className="bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-700 transition"
                        onClick={() => handleEditSave(user._id)}
                        title="Save"
                      >
                        <PencilIcon className="h-4 w-4" /> Save
                      </button>
                      <button
                        className="bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400 transition"
                        onClick={handleEditCancel}
                        title="Cancel"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        className="text-blue-600 hover:underline flex items-center gap-1"
                        onClick={() => handleEditUser(user)}
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" /> Edit
                      </button>
                      <button
                        className="text-red-600 hover:underline flex items-center gap-1"
                        onClick={() => setConfirmDeleteId(user._id)}
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" /> Delete
                      </button>
                      <button
                        className={`ml-1 text-xs px-2 py-1 rounded ${
                          user.role === 'admin'
                            ? 'bg-gray-400 text-white'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        } disabled:opacity-50`}
                        disabled={roleChanging === user._id + (user.role === 'admin' ? 'user' : 'admin') || (user.role !== 'admin' && adminCount >= ADMIN_LIMIT)}
                        onClick={() => handleChangeRole(user._id, user.role === 'admin' ? 'user' : 'admin')}
                        title={adminCount >= ADMIN_LIMIT && user.role !== 'admin' ? 'Admin limit reached' : ''}
                      >
                        {user.role === 'admin' ? (
                          <>
                            <ShieldCheckIcon className="h-4 w-4 inline" /> Revoke Admin
                          </>
                        ) : (
                          <>
                            <ShieldCheckIcon className="h-4 w-4 inline" /> Make Admin
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  {/* Confirmation Modal */}
                  {confirmDeleteId === user._id && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 max-w-xs w-full">
                        <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Delete User?</h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to delete <b>{user.username}</b>?</p>
                        <div className="flex gap-2 justify-end">
                          <button
                            className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 transition"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                            onClick={() => {
                              handleDeleteUser(user._id);
                              setConfirmDeleteId(null);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="text-center text-gray-500 py-4">
                {loadingUsers ? 'Loading users...' : 'No users found.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {userMsg && <div className="mt-2 text-green-600">{userMsg}</div>}
    </div>
  );
} 