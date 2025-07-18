import React, { useEffect, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

export default function TopicGraph() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    setCoursesLoading(true);
    fetch('/api/user/learning-paths', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
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
        } else {
          setCourses([]);
        }
      })
      .catch(() => setCourses([]))
      .finally(() => setCoursesLoading(false));
  }, []);

  const fetchGraphForCourse = (course) => {
    setSelectedCourse(course);
    setLoading(true);
    setError('');
    // Assume course.topics is an array of topic objects with _id, title, prerequisites
    const topics = course.topics || [];
    // Create nodes
    const nodes = topics.map((topic, idx) => ({
      id: topic._id,
      data: { label: topic.title },
      position: { x: 100 * idx, y: 100 * idx },
      style: {
        background: (topic.prerequisites && topic.prerequisites.length === 0) ? '#e0f7fa' : '#f3f4f6',
        border: '2px solid #60a5fa',
        borderRadius: 12,
        padding: 16,
        minWidth: 140,
        textAlign: 'center',
        fontWeight: 600,
        fontSize: 16,
        boxShadow: '0 2px 8px 0 rgba(59,130,246,0.07)',
        transition: 'box-shadow 0.2s',
        cursor: 'pointer',
      },
      className: 'topic-node',
    }));
    // Create edges for prerequisites
    const edges = [];
    topics.forEach(topic => {
      (topic.prerequisites || []).forEach(prereqId => {
        edges.push({
          id: `${prereqId}->${topic._id}`,
          source: prereqId,
          target: topic._id,
          animated: true,
          style: { stroke: '#38bdf8', strokeWidth: 2 },
        });
      });
    });
    setNodes(nodes);
    setEdges(edges);
    setLoading(false);
  };

  return (
    <div style={{ width: '100%', minHeight: '80vh' }} className="p-4">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Topic Dependency Graph</h1>
      <div className="mb-8">
        {coursesLoading ? (
          <div>Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="bg-blue-50 dark:bg-blue-100/40 border border-blue-200 rounded-2xl p-8 text-center shadow-md">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              No Courses Available
            </h2>
            <p className="text-blue-700 mb-4">
              You don't have any courses assigned yet. Please contact your administrator to get access to learning materials.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {courses.map(course => (
              <button
                key={course._id}
                className={`px-6 py-3 rounded-xl font-semibold border-2 shadow-sm transition-all duration-200 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${selectedCourse && selectedCourse._id === course._id ? 'bg-blue-600 text-white border-blue-700 shadow-lg scale-105' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-100 hover:shadow-md'}`}
                onClick={() => fetchGraphForCourse(course)}
              >
                {course.title}
              </button>
            ))}
          </div>
        )}
      </div>
      {loading && <div className="p-8 text-center">Loading graph...</div>}
      {!loading && selectedCourse && nodes.length > 0 ? (
        <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl border border-blue-100 relative overflow-hidden" style={{ height: '60vh' }}>
          <div className="px-2 pt-2 md:px-8 md:pt-8">
            <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4 text-blue-800">{selectedCourse.title} - Topic Graph</h2>
          </div>
          <div className="absolute inset-x-0 bottom-0 top-14 md:top-24 overflow-x-auto">
            <div className="min-w-0 w-full h-full">
              <ReactFlow nodes={nodes} edges={edges} fitView className="rounded-xl w-full h-full min-w-0" style={{ background: '#f3f4f6', borderRadius: 16, width: '100%', height: '100%' }}>
                <MiniMap nodeColor={() => '#60a5fa'} maskColor="#e0e7ef" nodeStrokeWidth={3} style={{ borderRadius: 8 }} />
                <Controls style={{ background: '#f3f4f6', borderRadius: 8 }} />
                <Background gap={18} color="#d1d5db" />
              </ReactFlow>
            </div>
          </div>
        </div>
      ) : !loading && selectedCourse && nodes.length === 0 ? (
        <div className="text-gray-500 text-center">No topics found for this course.</div>
      ) : !loading && !selectedCourse ? (
        <div className="text-gray-400 text-center">Select a course to view its topic dependency graph.</div>
      ) : null}
      {error && <div className="p-8 text-center text-red-500">{error}</div>}
      <style>{`
        .topic-node:hover {
          box-shadow: 0 4px 16px 0 rgba(59,130,246,0.18);
          border-color: #2563eb;
          background: #e0f2fe;
        }
      `}</style>
    </div>
  );
} 