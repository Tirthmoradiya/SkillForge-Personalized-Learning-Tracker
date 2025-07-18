import { AcademicCapIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

export default function AdminCourseTable({
  courses,
  editCourseId,
  editCourseForm,
  handleEditCourse,
  handleEditCourseChange,
  handleEditCourseSave,
  handleEditCourseCancel,
  handleDeleteCourse,
  editTopicId,
  editTopicForm,
  handleEditTopic,
  handleEditTopicChange,
  handleEditTopicSave,
  handleEditTopicCancel,
  handleDeleteTopic,
  courseMsg,
  topicMsg,
  loadingCourses,
  TOPIC_LIMIT
}) {
  const [confirmDeleteCourseId, setConfirmDeleteCourseId] = useState(null);
  const [confirmDeleteTopic, setConfirmDeleteTopic] = useState({ courseId: null, topicId: null });

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Delete/Edit Courses & Topics</h3>
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
                    <button className="bg-blue-600 text-white px-2 py-1 rounded mr-1 flex items-center gap-1 hover:bg-blue-700 transition" onClick={() => handleEditCourseSave(course._id)}><PencilIcon className="h-4 w-4 inline" /> Save</button>
                    <button className="bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400 transition" onClick={handleEditCourseCancel}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-lg text-gray-900 dark:text-white mr-2">{course.title}</span>
                    <span className="text-gray-700 dark:text-gray-300 mr-2">{course.description}</span>
                    <span className={`text-xs px-2 py-1 rounded font-semibold mr-2 ${course.level === 'Beginner' ? 'bg-green-100 text-green-700' : course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'}`}>{course.level || 'Beginner'}</span>
                    <span className="inline-block bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs font-bold mr-2">{course.subjectsData?.length || 0} / {TOPIC_LIMIT} topics</span>
                    <button className="text-blue-600 hover:underline mr-2 flex items-center gap-1" onClick={() => handleEditCourse(course)} title="Edit"><PencilIcon className="h-4 w-4 inline" /> Edit</button>
                    <button className="text-red-600 hover:underline flex items-center gap-1" onClick={() => setConfirmDeleteCourseId(course._id)} title="Delete"><TrashIcon className="h-4 w-4 inline" /> Delete Course</button>
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
                        <button className="bg-blue-600 text-white px-2 py-1 rounded mr-1 flex items-center gap-1 hover:bg-blue-700 transition" onClick={() => handleEditTopicSave(topic._id, course._id)}><PencilIcon className="h-4 w-4 inline" /> Save</button>
                        <button className="bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400 transition" onClick={handleEditTopicCancel}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-gray-900 dark:text-white" title={topic.title}>{topic.title}</span>
                        <span className="text-xs text-gray-500">({topic._id})</span>
                        <button className="text-blue-600 hover:underline mr-2 flex items-center gap-1" onClick={() => handleEditTopic(topic._id, course)} title="Edit"><PencilIcon className="h-4 w-4 inline" /> Edit</button>
                        <button className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-red-200 transition" onClick={() => setConfirmDeleteTopic({ courseId: course._id, topicId: topic._id })} title="Delete Topic"><TrashIcon className="h-4 w-4 inline" /> Delete Topic</button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {courseMsg && editCourseId === course._id && <div className="mt-2 text-green-600">{courseMsg}</div>}
              {topicMsg && <div className="mt-2 text-green-600">{topicMsg}</div>}
              {/* Confirmation Modal for Course Deletion */}
              {confirmDeleteCourseId === course._id && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 max-w-xs w-full">
                    <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Delete Course?</h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to delete <b>{course.title}</b>?</p>
                    <div className="flex gap-2 justify-end">
                      <button className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 transition" onClick={() => setConfirmDeleteCourseId(null)}>Cancel</button>
                      <button className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition" onClick={() => { handleDeleteCourse(course._id); setConfirmDeleteCourseId(null); }}>Delete</button>
                    </div>
                  </div>
                </div>
              )}
              {/* Confirmation Modal for Topic Deletion */}
              {confirmDeleteTopic.courseId === course._id && confirmDeleteTopic.topicId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 max-w-xs w-full">
                    <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Delete Topic?</h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to delete this topic?</p>
                    <div className="flex gap-2 justify-end">
                      <button className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 transition" onClick={() => setConfirmDeleteTopic({ courseId: null, topicId: null })}>Cancel</button>
                      <button className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition" onClick={() => { handleDeleteTopic(course._id, confirmDeleteTopic.topicId); setConfirmDeleteTopic({ courseId: null, topicId: null }); }}>Delete</button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 