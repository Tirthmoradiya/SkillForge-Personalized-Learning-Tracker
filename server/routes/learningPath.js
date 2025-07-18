import express from 'express';
import LearningPath from '../models/LearningPath.js';
import Topic from '../models/Topic.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get all learning paths
router.get('/', async (req, res) => {
  try {
    const paths = await LearningPath.find({ status: 'published' })
      .select('title description courses topics status')
      .lean();
    res.json(paths);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching learning paths' });
  }
});

// Get a specific learning path
router.get('/:id', async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.id)
      .populate({
        path: 'topics',
        select: 'title description content prerequisites type difficulty',
      });

    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    res.json(path);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching learning path' });
  }
});

// Create a new learning path
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, category, difficulty, topics, estimatedHours, tags } = req.body;

    const path = new LearningPath({
      title,
      description,
      category,
      difficulty,
      topics: topics.map((topic, index) => ({
        topic: topic.id,
        order: index + 1,
        prerequisites: topic.prerequisites,
      })),
      estimatedHours,
      creator: req.user.id,
      tags,
    });

    await path.save();
    res.status(201).json(path);
  } catch (error) {
    res.status(500).json({ message: 'Error creating learning path' });
  }
});

// Update a learning path
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.id);

    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    if (path.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedPath = await LearningPath.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedPath);
  } catch (error) {
    res.status(500).json({ message: 'Error updating learning path' });
  }
});

// Delete a learning path
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.id);

    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    if (path.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await path.remove();
    res.json({ message: 'Learning path deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting learning path' });
  }
});

// Rate a learning path
router.post('/:id/rate', verifyToken, async (req, res) => {
  try {
    const { score, review } = req.body;
    const path = await LearningPath.findById(req.params.id);

    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    // Check if user has already rated
    const existingRating = path.ratings.find(
      (r) => r.user.toString() === req.user.id
    );

    if (existingRating) {
      existingRating.score = score;
      existingRating.review = review;
    } else {
      path.ratings.push({
        user: req.user.id,
        score,
        review,
      });
    }

    await path.save();
    res.json(path);
  } catch (error) {
    res.status(500).json({ message: 'Error rating learning path' });
  }
});

// Get user progress for a learning path
router.get('/:id/progress', verifyToken, async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.id).populate('topics.topic');
    
    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    const topicIds = path.topics.map(t => t.topic._id);
    const completedTopics = await Topic.find({
      _id: { $in: topicIds },
      'completions.user': req.user.id
    });

    const progress = {
      totalTopics: path.topics.length,
      completedTopics: completedTopics.length,
      percentage: (completedTopics.length / path.topics.length) * 100,
      topicStatus: path.topics.map(topic => ({
        topicId: topic.topic._id,
        completed: completedTopics.some(ct => ct._id.equals(topic.topic._id))
      }))
    };

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress' });
  }
});

export default router;