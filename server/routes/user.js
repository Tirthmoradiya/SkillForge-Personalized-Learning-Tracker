import express from 'express';
import Course from '../models/Course.js';
import Topic from '../models/Topic.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Mark a subject as completed
router.post('/subjects/:subjectId/complete', async (req, res) => {
  try {
    const userId = req.user._id;
    const topic = await Topic.findById(req.params.subjectId);
    if (!topic) return res.status(404).json({ message: 'Subject not found' });
    if (!topic.completions.some(c => c.user.toString() === userId.toString())) {
      topic.completions.push({ user: userId, quizScore: req.body.quizScore || 100 });
      await topic.save();
    }
    res.json({ message: 'Subject marked as completed' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Mark a txt file (topic) as opened
router.post('/topics/:txtKey/open', async (req, res) => {
  try {
    const user = req.user;
    const { txtKey } = req.params;
    if (!user.openedTopics.includes(txtKey)) {
      user.openedTopics.push(txtKey);
      await user.save();
    }
    res.json({ message: 'Topic marked as opened' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get user progress for a course (by openedTopics)
router.get('/courses/:courseId/progress', async (req, res) => {
  try {
    const user = req.user;
    const course = await Course.findById(req.params.courseId).populate('subjects');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const progress = {};
    for (const subject of course.subjects) {
      // Use txt file key as id for progress
      progress[subject._id] = user.openedTopics.includes(subject.content) || user.completedTopics.includes(subject._id);
    }
    res.json(progress);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get notifications for user (broadcast or direct)
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await mongoose.model('User').findById(userId);
    const lastLogin = user.lastLogin || new Date(0);
    const notifications = await Notification.find({
      $or: [
        { recipients: userId },
        { recipients: { $size: 0 } } // broadcast
      ],
      readBy: { $ne: userId },
      createdAt: { $gt: lastLogin }
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Mark notification as read (per user)
router.post('/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    if (!notification.readBy.includes(userId)) {
      notification.readBy.push(userId);
      await notification.save();
    }
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Create reminder notification if user hasn't viewed a topic in 2 days
router.post('/notifications/reminder', verifyToken, async (req, res) => {
  try {
    const user = await mongoose.model('User').findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const lastViewed = user.viewedTopics?.length ? user.viewedTopics[user.viewedTopics.length - 1].viewedAt : null;
    const now = new Date();
    if (!lastViewed || (now - new Date(lastViewed)) > 2 * 24 * 60 * 60 * 1000) {
      await Notification.create({
        user: user._id,
        message: 'It’s been a while since you viewed a topic. Continue your learning journey!',
        type: 'reminder',
      });
      return res.json({ message: 'Reminder notification created' });
    }
    res.json({ message: 'No reminder needed' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Create achievement notification when user completes 5 topics
router.post('/notifications/achievement', verifyToken, async (req, res) => {
  try {
    const user = await mongoose.model('User').findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const completedCount = user.viewedTopics?.length || 0;
    if (completedCount > 0 && completedCount % 5 === 0) {
      await Notification.create({
        user: user._id,
        message: `Congratulations! You have viewed ${completedCount} topics!`,
        type: 'achievement',
      });
      return res.json({ message: 'Achievement notification created' });
    }
    res.json({ message: 'No achievement needed' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await mongoose.model('User').findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update user profile (username, email, about, interests)
router.put('/profile', async (req, res) => {
  try {
    const { username, email, about, interests } = req.body;
    const user = await mongoose.model('User').findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (username) user.username = username;
    if (email) user.email = email;
    if (about !== undefined) user.about = about;
    if (interests !== undefined) user.interests = interests;
    await user.save();
    res.json({ message: 'Profile updated', user: { username: user.username, email: user.email, about: user.about, interests: user.interests } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Change user password
router.put('/profile/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both current and new password are required' });
    const user = await mongoose.model('User').findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Helper to get the ObjectID of HTML & CSS Basics
let htmlCssObjectId = null;
Topic.findOne({ title: /html.*css.*basics/i }).then(topic => {
  if (topic) htmlCssObjectId = topic._id.toString();
});

// Check if a subject is unlocked for the user (HTML & CSS Basics always unlocked)
router.get('/courses/:courseId/subjects/:subjectId/unlocked', async (req, res) => {
  try {
    const userId = req.user._id;
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    // Always unlock the first topic
    if (course.firstTopic && course.firstTopic.toString() === req.params.subjectId) {
      return res.json({ unlocked: true });
    }
    // Always unlock HTML & CSS Basics (web path) by ObjectID
    if (htmlCssObjectId && req.params.subjectId === htmlCssObjectId) {
      return res.json({ unlocked: true });
    }
    const dep = course.dependencies.find(d => d.subject.toString() === req.params.subjectId);
    if (!dep || !dep.requiredSubjects.length) return res.json({ unlocked: true });
    // Check if all required subjects are completed
    const requiredCompleted = await Promise.all(dep.requiredSubjects.map(async (subjId) => {
      const topic = await Topic.findById(subjId);
      return topic && topic.completions.some(c => c.user.toString() === userId.toString());
    }));
    res.json({ unlocked: requiredCompleted.every(Boolean) });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Check if a topic is unlocked for the user (first topic always unlocked)
router.get('/learning-paths/:pathId/topics/:topicId/unlocked', async (req, res) => {
  try {
    const userId = req.user._id;
    const path = await mongoose.model('LearningPath').findById(req.params.pathId);
    if (!path) return res.status(404).json({ message: 'Learning path not found' });
    // Always unlock the first topic in the path's topics array
    if (Array.isArray(path.topics) && path.topics.length > 0 && path.topics[0].toString() === req.params.topicId) {
      return res.json({ unlocked: true });
    }
    // Otherwise, check if prerequisites are completed (if any)
    const topic = await mongoose.model('Topic').findById(req.params.topicId);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    if (!topic.prerequisites || topic.prerequisites.length === 0) return res.json({ unlocked: true });
    // Check if all prerequisites are completed
    const user = await mongoose.model('User').findById(userId);
    const completed = topic.prerequisites.every(prereqId => user.completedTopics.includes(prereqId));
    res.json({ unlocked: completed });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get completed topics with titles and IDs
router.get('/progress/completed-topics', async (req, res) => {
  try {
    const user = await mongoose.model('User').findById(req.user._id).populate('completedTopics');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const topics = user.completedTopics.map(t => ({ id: t._id, title: t.title }));
    res.json(topics);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// Get opened topics with titles and IDs
router.get('/progress/opened-topics', async (req, res) => {
  try {
    const user = await mongoose.model('User').findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const Topic = mongoose.model('Topic');
    const topics = await Topic.find({ content: { $in: user.openedTopics } });
    const result = topics.map(t => ({ id: t._id, title: t.title }));
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// Get all learning paths for user with progress
router.get('/progress/learning-paths', async (req, res) => {
  try {
    const user = await mongoose.model('User').findById(req.user._id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // If user has no learning paths, return empty array
    if (!user.learningPaths || user.learningPaths.length === 0) {
      return res.json([]);
    }
    
    const LearningPath = mongoose.model('LearningPath');
    const paths = await LearningPath.find({ _id: { $in: user.learningPaths } }).select('title topics').lean();
    const userCompleted = (user.completedTopics || []).map(ct => {
      if (!ct || !ct.topic) return null;
      return ct.topic?.toString?.() || (ct.topic + '');
    }).filter(Boolean);
    
    const progress = paths.map(lp => {
      if (!lp || !lp._id) return null; // Skip if learning path is null/undefined
      
      // Filter out any topic that is not a string or an object with _id
      const topicsArr = Array.isArray(lp.topics) ? lp.topics.filter(t => {
        if (!t) return false;
        if (typeof t === 'string' && t) return true;
        if (typeof t === 'object' && (t._id || t.topic)) return true;
        // Log bad topic for debugging
        console.warn('Bad topic reference in learning path', lp.title, t);
        return false;
      }) : [];
      
      const total = topicsArr.length;
      const completed = topicsArr.filter(tid => {
        if (!tid) return false;
        let topicId = tid;
        if (typeof tid === 'object') {
          topicId = tid._id || tid.topic || tid;
        }
        return topicId && userCompleted.includes(topicId.toString());
      }).length;
      
      return {
        id: lp._id,
        title: lp.title,
        totalTopics: total,
        completedTopics: completed,
        percentage: total ? Math.round((completed / total) * 100) : 0
      };
    }).filter(Boolean); // Remove null entries
    
    res.json(progress);
  } catch (err) {
    console.error('Error in /progress/learning-paths:', err);
    res.status(500).json({ message: 'Failed to calculate progress', error: err.message });
  }
});
// Get recent activity
router.get('/recent-activity', async (req, res) => {
  try {
    const user = await mongoose.model('User').findById(req.user._id)
      .populate({ path: 'recentActivity.topic recentActivity.learningPath', select: 'title' })
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const recent = (user.recentActivity || []).map(a => ({
      id: a.topic?._id,
      name: a.topic?.title,
      path: a.learningPath?.title,
      lastAccessed: a.lastAccessed,
      status: a.status,
    })).sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));
    res.json(recent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// Update recent activity when a topic is opened
router.post('/topics/:topicId/open', async (req, res) => {
  try {
    const user = await mongoose.model('User').findById(req.user._id);
    const topic = await mongoose.model('Topic').findById(req.params.topicId);
    if (!user || !topic) return res.status(404).json({ message: 'User or topic not found' });
    // Mark as seen
    if (!user.seenTopics.includes(topic._id)) user.seenTopics.push(topic._id);
    // Mark as completed (for progress)
    if (!user.completedTopics.some(ct => ct.topic.toString() === topic._id.toString())) {
      user.completedTopics.push({ topic: topic._id, completedAt: new Date() });
    }
    // Find learning path for this topic (for recent activity tracking only)
    const lp = await mongoose.model('LearningPath').findOne({ topics: topic._id });
    // Update or add recent activity
    const idx = user.recentActivity.findIndex(a => a.topic.toString() === topic._id.toString());
    if (idx >= 0) {
      user.recentActivity[idx].lastAccessed = new Date();
      user.recentActivity[idx].status = 'In Progress';
      user.recentActivity[idx].learningPath = lp?._id;
    } else {
      user.recentActivity.unshift({ topic: topic._id, learningPath: lp?._id, lastAccessed: new Date(), status: 'In Progress' });
      if (user.recentActivity.length > 10) user.recentActivity.pop();
    }
    await user.save();
    res.json({ message: 'Recent activity and progress updated' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get seen status for a topic for the current user
router.get('/topics/:topicId/seen', async (req, res) => {
  try {
    const user = await mongoose.model('User').findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const seen = user.seenTopics.includes(req.params.topicId);
    res.json({ seen });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// Update recent activity and progress when a topic is completed
router.post('/subjects/:topicId/complete', async (req, res) => {
  try {
    const user = await mongoose.model('User').findById(req.user._id);
    const topic = await mongoose.model('Topic').findById(req.params.topicId);
    if (!user || !topic) return res.status(404).json({ message: 'User or topic not found' });
    // Mark as completed
    if (!user.completedTopics.some(ct => ct.topic.toString() === topic._id.toString())) {
      user.completedTopics.push({ topic: topic._id, completedAt: new Date() });
    }
    // Find learning path for this topic
    const lp = await mongoose.model('LearningPath').findOne({ topics: topic._id });
    // Update or add recent activity
    const idx = user.recentActivity.findIndex(a => a.topic.toString() === topic._id.toString());
    if (idx >= 0) {
      user.recentActivity[idx].lastAccessed = new Date();
      user.recentActivity[idx].status = 'Completed';
      user.recentActivity[idx].learningPath = lp?._id;
    } else {
      user.recentActivity.unshift({ topic: topic._id, learningPath: lp?._id, lastAccessed: new Date(), status: 'Completed' });
      if (user.recentActivity.length > 10) user.recentActivity.pop();
    }
    await user.save();
    res.json({ message: 'Topic marked as completed and recent activity updated' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// Account deletion
router.delete('/account', async (req, res) => {
  try {
    await mongoose.model('User').findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// Data export
router.get('/account/export', async (req, res) => {
  try {
    const user = await mongoose.model('User').findById(req.user._id).populate('completedTopics learningPaths');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Join a learning path (add to user's learningPaths array)
router.post('/learning-paths/:id/join', async (req, res) => {
  try {
    const user = await mongoose.model('User').findById(req.user._id);
    const pathId = req.params.id;
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.learningPaths.map(id => id.toString()).includes(pathId)) {
      user.learningPaths.push(pathId);
      await user.save();
    }
    res.json({ message: 'Joined learning path', learningPaths: user.learningPaths });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/topics/:topicId/viewed', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const { topicId } = req.params;
    // Check if already viewed
    if (!user.viewedTopics.some(vt => vt.topic.toString() === topicId)) {
      user.viewedTopics.push({ topic: topicId });
      await user.save();
    }
    res.json({ message: 'Topic marked as viewed' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/topics/recent-viewed', verifyToken, async (req, res) => {
  try {
    const user = await mongoose.model('User').findById(req.user._id).populate('viewedTopics.topic');
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Find course for each topic
    const Course = mongoose.model('Course');
    const recent = (user.viewedTopics || [])
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
      .slice(0, 5)
      .map(vt => ({
        id: vt.topic?._id,
        title: vt.topic?.title,
        viewedAt: vt.viewedAt
      }));
    res.json(recent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/progress/courses', verifyToken, async (req, res) => {
  try {
    const courses = await mongoose.model('Course').find().populate('topics');
    const user = await mongoose.model('User').findById(req.user._id);
    const viewedTopicIds = new Set((user.viewedTopics || []).map(vt => vt.topic.toString()));
    const result = courses.map(course => {
      const totalTopics = course.topics.length;
      const viewedCount = course.topics.filter(t => viewedTopicIds.has(t._id.toString())).length;
      return {
        id: course._id,
        title: course.title,
        description: course.description,
        totalTopics,
        viewedTopics: viewedCount,
        percentage: totalTopics ? Math.round((viewedCount / totalTopics) * 100) : 0
      };
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/courses-with-topics', verifyToken, async (req, res) => {
  try {
    const courses = await mongoose.model('Course').find().populate({
      path: 'topics',
      select: 'title description _id'
    });
    res.json(courses);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Save or update quiz score for a course
router.post('/quiz-score', verifyToken, async (req, res) => {
  try {
    const { courseId, score } = req.body;
    if (!courseId || typeof score !== 'number') return res.status(400).json({ message: 'courseId and score are required' });
    const user = await mongoose.model('User').findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const existing = user.quizScores.find(q => q.course.toString() === courseId);
    if (existing) {
      if (score > existing.score) {
        existing.score = score;
        await user.save();
        return res.json({ message: 'Quiz score updated (new high score)', score: existing.score });
      } else {
        return res.json({ message: 'Quiz score not updated (lower than previous)', score: existing.score });
      }
    } else {
      user.quizScores.push({ course: courseId, score });
      await user.save();
      return res.json({ message: 'Quiz score saved', score });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get user's assigned learning paths with populated courses
router.get('/learning-paths', verifyToken, async (req, res) => {
  try {
    const user = await mongoose.model('User').findById(req.user._id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const LearningPath = mongoose.model('LearningPath');
    const paths = await LearningPath.find({ 
      _id: { $in: user.learningPaths },
      status: 'published'
    })
    .populate({
      path: 'courses',
      select: 'title description level topics',
      populate: {
        path: 'topics',
        select: 'title description content'
      }
    })
    .lean();
    
    res.json(paths);
  } catch (err) {
    console.error('Error fetching user learning paths:', err);
    res.status(500).json({ message: 'Failed to fetch learning paths', error: err.message });
  }
});

export default router; 