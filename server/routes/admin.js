import express from 'express';
import Course from '../models/Course.js';
import Topic from '../models/Topic.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import LearningPath from '../models/LearningPath.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken); // Ensure all admin routes require authentication

// Middleware to check admin
function isAdmin(req, res, next) {
  // Assume req.user is set by auth middleware
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Admins only' });
}

// Create a new course
router.post('/courses', isAdmin, async (req, res) => {
  try {
    // Enforce max 10 courses
    const courseCount = await Course.countDocuments();
    if (courseCount >= 10) {
      return res.status(400).json({ message: 'Course limit reached. No more than 10 courses allowed.' });
    }
    const course = new Course({ ...req.body, creator: req.user._id });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add a subject to a course
router.post('/courses/:courseId/subjects', isAdmin, async (req, res) => {
  try {
    const { subjectId } = req.body;
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (!course.subjects.includes(subjectId)) course.subjects.push(subjectId);
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Set dependencies for a subject in a course
router.post('/courses/:courseId/dependencies', isAdmin, async (req, res) => {
  try {
    const { subject, requiredSubjects } = req.body;
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    // Remove existing dependency for this subject
    course.dependencies = course.dependencies.filter(dep => dep.subject.toString() !== subject);
    course.dependencies.push({ subject, requiredSubjects });
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Notify users about course/subject changes
router.post('/notify', isAdmin, async (req, res) => {
  try {
    const { userIds, message, course, subject } = req.body;
    const notifications = await Promise.all(userIds.map(userId =>
      Notification.create({ user: userId, message, course, subject })
    ));
    res.status(201).json(notifications);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a topic
router.delete('/topics/:topicId', isAdmin, async (req, res) => {
  try {
    await Topic.findByIdAndDelete(req.params.topicId);
    res.json({ message: 'Topic deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a course and its topics/notifications
router.delete('/courses/:courseId', isAdmin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    // Delete all topics in the course
    await Topic.deleteMany({ _id: { $in: course.subjects } });
    // Delete all notifications for this course
    await Notification.deleteMany({ course: course._id });
    await course.deleteOne();
    res.json({ message: 'Course and related topics/notifications deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a course (title, description, level)
router.patch('/courses/:id', isAdmin, async (req, res) => {
  try {
    const { title, description, level } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (title) course.title = title;
    if (description) course.description = description;
    if (level) course.level = level;
    await course.save();
    res.json({ message: 'Course updated', course });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a topic (title, content, dependencies, etc.)
router.patch('/topics/:id', isAdmin, async (req, res) => {
  try {
    const { title, content, description, type, difficulty, estimatedMinutes, dependencies } = req.body;
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    if (title) topic.title = title;
    if (content) topic.content = content;
    if (description) topic.description = description;
    if (type) topic.type = type;
    if (difficulty) topic.difficulty = difficulty;
    if (estimatedMinutes) topic.estimatedMinutes = estimatedMinutes;
    if (dependencies) topic.dependencies = dependencies;
    await topic.save();
    res.json({ message: 'Topic updated', topic });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Analytics: user signups per week
router.get('/analytics/user-signups', isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = new Date(now);
      start.setDate(now.getDate() - (7 * (7 - i)));
      start.setHours(0, 0, 0, 0);
      return start;
    });
    const counts = Array(8).fill(0);
    const users = await User.find({});
    users.forEach(u => {
      const created = new Date(u.createdAt);
      for (let i = 0; i < 8; i++) {
        const weekStart = weeks[i];
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        if (created >= weekStart && created < weekEnd) {
          counts[i]++;
          break;
        }
      }
    });
    res.json({ labels: weeks.map(d => `${d.getMonth() + 1}/${d.getDate()}`), data: counts });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});
// Analytics: most popular topics
router.get('/analytics/popular-topics', isAdmin, async (req, res) => {
  try {
    const users = await User.find({});
    const topicCounts = {};
    users.forEach(u => {
      (u.viewedTopics || []).forEach(vt => {
        const id = vt.topic.toString();
        topicCounts[id] = (topicCounts[id] || 0) + 1;
      });
    });
    const topics = await Topic.find({ _id: { $in: Object.keys(topicCounts) } });
    const result = topics.map(t => ({ id: t._id, title: t.title, count: topicCounts[t._id.toString()] || 0 }));
    result.sort((a, b) => b.count - a.count);
    res.json(result.slice(0, 10));
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});
// Analytics: course completion rates
router.get('/analytics/course-completion', isAdmin, async (req, res) => {
  try {
    const courses = await Course.find({}).populate('topics');
    const users = await User.find({});
    const result = courses.map(course => {
      const totalTopics = course.topics.length;
      let completedUsers = 0;
      users.forEach(u => {
        const viewed = new Set((u.viewedTopics || []).map(vt => vt.topic.toString()));
        if (totalTopics > 0 && course.topics.every(t => viewed.has(t._id.toString()))) {
          completedUsers++;
        }
      });
      return {
        id: course._id,
        title: course.title,
        totalTopics,
        completedUsers
      };
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

// Analytics: user retention (1, 7, 30 day)
router.get('/analytics/retention', isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const users = await User.find({});
    let day1 = 0, day7 = 0, day30 = 0;
    users.forEach(u => {
      const created = new Date(u.createdAt);
      const last = new Date(u.updatedAt || u.lastLogin || u.createdAt);
      const diff = (last - created) / (1000 * 60 * 60 * 24);
      if (diff >= 1) day1++;
      if (diff >= 7) day7++;
      if (diff >= 30) day30++;
    });
    const total = users.length || 1;
    res.json({
      day1: Math.round((day1 / total) * 100),
      day7: Math.round((day7 / total) * 100),
      day30: Math.round((day30 / total) * 100),
      total
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

// Analytics: engagement (active users per day/week/month)
router.get('/analytics/engagement', isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const users = await User.find({});
    // Daily active users (last 8 days)
    const daily = Array(8).fill(0);
    // Weekly active users (last 8 weeks)
    const weekly = Array(8).fill(0);
    // Monthly active users (last 8 months)
    const monthly = Array(8).fill(0);
    users.forEach(u => {
      (u.viewedTopics || []).forEach(vt => {
        const viewedAt = new Date(vt.viewedAt);
        // Daily
        for (let i = 0; i < 8; i++) {
          const day = new Date(now);
          day.setDate(now.getDate() - (7 - i));
          day.setHours(0, 0, 0, 0);
          const nextDay = new Date(day);
          nextDay.setDate(day.getDate() + 1);
          if (viewedAt >= day && viewedAt < nextDay) {
            daily[i]++;
            break;
          }
        }
        // Weekly
        for (let i = 0; i < 8; i++) {
          const week = new Date(now);
          week.setDate(now.getDate() - (7 * (7 - i)));
          week.setHours(0, 0, 0, 0);
          const nextWeek = new Date(week);
          nextWeek.setDate(week.getDate() + 7);
          if (viewedAt >= week && viewedAt < nextWeek) {
            weekly[i]++;
            break;
          }
        }
        // Monthly
        for (let i = 0; i < 8; i++) {
          const month = new Date(now);
          month.setMonth(now.getMonth() - (7 - i));
          month.setDate(1);
          month.setHours(0, 0, 0, 0);
          const nextMonth = new Date(month);
          nextMonth.setMonth(month.getMonth() + 1);
          if (viewedAt >= month && viewedAt < nextMonth) {
            monthly[i]++;
            break;
          }
        }
      });
    });
    res.json({
      daily,
      weekly,
      monthly,
      labels: {
        daily: Array(8).fill(0).map((_, i) => {
          const d = new Date(now);
          d.setDate(now.getDate() - (7 - i));
          return `${d.getMonth() + 1}/${d.getDate()}`;
        }),
        weekly: Array(8).fill(0).map((_, i) => {
          const d = new Date(now);
          d.setDate(now.getDate() - (7 * (7 - i)));
          return `${d.getMonth() + 1}/${d.getDate()}`;
        }),
        monthly: Array(8).fill(0).map((_, i) => {
          const d = new Date(now);
          d.setMonth(now.getMonth() - (7 - i));
          return `${d.getMonth() + 1}/${d.getFullYear()}`;
        })
      }
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

// User Management Endpoints
// List all users
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'username email role about interests createdAt');
    res.json(users);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Edit user info
router.patch('/users/:id', isAdmin, async (req, res) => {
  try {
    const { username, email, about, interests } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (username) user.username = username;
    if (email) user.email = email;
    if (about !== undefined) user.about = about;
    if (interests !== undefined) user.interests = interests;
    await user.save();
    res.json({ message: 'User updated', user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete user
router.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Change user role
router.post('/users/:id/role', isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // If changing to admin, enforce max 2 admins
    if (role === 'admin' && user.role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount >= 2) {
        return res.status(400).json({ message: 'Admin limit reached. No more than 2 admins allowed.' });
      }
    }
    user.role = role;
    await user.save();
    res.json({ message: 'User role updated', user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Broadcast notification to all users
router.post('/notifications/broadcast', isAdmin, async (req, res) => {
  const { message, type } = req.body;
  if (!message) return res.status(400).json({ message: 'Message required' });
  // recipients: [] means broadcast to all
  const notification = await Notification.create({
    message,
    type: type || 'info',
    recipients: [],
    readBy: []
  });
  res.json({ message: 'Notification sent', notification });
});

// List all notifications (admin only)
router.get('/notifications', isAdmin, async (req, res) => {
  const notifications = await Notification.find({}).sort({ createdAt: -1 });
  res.json(notifications);
});

// List all courses (for admin panel)
router.get('/courses', isAdmin, async (req, res) => {
  try {
    const courses = await Course.find({});
    res.json(courses);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Learning Path Management Endpoints

// Get all learning paths with their courses
router.get('/learning-paths', isAdmin, async (req, res) => {
  try {
    const paths = await LearningPath.find().populate({
      path: 'courses',
      select: 'title description level'
    }).lean();
    res.json(paths);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add a course to a learning path
router.post('/learning-paths/:pathId/add-course', isAdmin, async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ message: 'courseId is required' });
    
    const path = await LearningPath.findById(req.params.pathId);
    if (!path) return res.status(404).json({ message: 'Learning path not found' });
    
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    if (!path.courses.map(id => id.toString()).includes(courseId)) {
      path.courses.push(courseId);
      await path.save();
      res.json({ message: 'Course added to learning path', path });
    } else {
      res.json({ message: 'Course already in learning path', path });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Remove a course from a learning path
router.post('/learning-paths/:pathId/remove-course', isAdmin, async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ message: 'courseId is required' });
    
    const path = await LearningPath.findById(req.params.pathId);
    if (!path) return res.status(404).json({ message: 'Learning path not found' });
    
    const courseIndex = path.courses.findIndex(id => id.toString() === courseId);
    if (courseIndex !== -1) {
      path.courses.splice(courseIndex, 1);
      await path.save();
      res.json({ message: 'Course removed from learning path', path });
    } else {
      res.json({ message: 'Course not found in learning path', path });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all users with their assigned learning paths
router.get('/users/learning-paths', isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('username email role learningPaths').populate({
      path: 'learningPaths',
      select: 'title description',
      populate: {
        path: 'courses',
        select: 'title level'
      }
    }).lean();
    res.json(users);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Assign a learning path to a user
router.post('/users/:userId/add-path', isAdmin, async (req, res) => {
  try {
    const { pathId } = req.body;
    if (!pathId) return res.status(400).json({ message: 'pathId is required' });
    
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const path = await LearningPath.findById(pathId);
    if (!path) return res.status(404).json({ message: 'Learning path not found' });
    
    if (!user.learningPaths.map(id => id.toString()).includes(pathId)) {
      user.learningPaths.push(pathId);
      await user.save();
      res.json({ message: 'Learning path assigned to user', user });
    } else {
      res.json({ message: 'User already has this learning path', user });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Remove a learning path from a user
router.post('/users/:userId/remove-path', isAdmin, async (req, res) => {
  try {
    const { pathId } = req.body;
    if (!pathId) return res.status(400).json({ message: 'pathId is required' });
    
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const pathIndex = user.learningPaths.findIndex(id => id.toString() === pathId);
    if (pathIndex !== -1) {
      user.learningPaths.splice(pathIndex, 1);
      await user.save();
      res.json({ message: 'Learning path removed from user', user });
    } else {
      res.json({ message: 'User does not have this learning path', user });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Create a new learning path
router.post('/learning-paths', isAdmin, async (req, res) => {
  try {
    const { title, description, courses = [] } = req.body;
    if (!title) return res.status(400).json({ message: 'title is required' });
    
    const path = new LearningPath({
      title,
      description: description || '',
      courses,
      topics: [],
      status: 'published'
    });
    await path.save();
    res.status(201).json(path);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a learning path
router.delete('/learning-paths/:pathId', isAdmin, async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.pathId);
    if (!path) return res.status(404).json({ message: 'Learning path not found' });
    
    // Remove this path from all users
    await User.updateMany(
      { learningPaths: req.params.pathId },
      { $pull: { learningPaths: req.params.pathId } }
    );
    
    await path.deleteOne();
    res.json({ message: 'Learning path deleted and removed from all users' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router; 