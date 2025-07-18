import express from 'express';
import Topic from '../models/Topic.js';
import { verifyToken } from '../middleware/auth.js';
import Course from '../models/Course.js';

const router = express.Router();

// Get all topics
router.get('/', async (req, res) => {
  try {
    const topics = await Topic.find({ status: 'published' })
      .populate('creator', 'username')
      .select('-quiz.correctAnswer');
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching topics' });
  }
});

// Get a specific topic
router.get('/:id', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate('creator', 'username')
      .populate('prerequisites', 'title');

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching topic' });
  }
});

// Create a new topic
router.post('/', verifyToken, async (req, res) => {
  try {
    // If a course is specified, enforce max 5 topics per course
    const { courseId } = req.body;
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      if (course.topics && course.topics.length >= 5) {
        return res.status(400).json({ message: 'Topic limit reached for this course. No more than 5 topics allowed per course.' });
      }
    }
    const topic = new Topic({
      ...req.body,
      creator: req.user.id,
    });
    await topic.save();
    // If a course is specified, add topic to course
    if (courseId) {
      const course = await Course.findById(courseId);
      course.topics.push(topic._id);
      await course.save();
    }
    res.status(201).json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating topic' });
  }
});

// Update a topic
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    if (topic.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedTopic = await Topic.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedTopic);
  } catch (error) {
    res.status(500).json({ message: 'Error updating topic' });
  }
});

// Delete a topic
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    if (topic.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await topic.remove();
    res.json({ message: 'Topic deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting topic' });
  }
});

// Submit quiz answers
router.post('/:id/submit-quiz', verifyToken, async (req, res) => {
  try {
    const { answers } = req.body;
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Calculate score
    let correctAnswers = 0;
    answers.forEach((answer, index) => {
      if (topic.quiz[index] && answer === topic.quiz[index].correctAnswer) {
        correctAnswers++;
      }
    });

    const score = (correctAnswers / topic.quiz.length) * 100;

    // Update user completion
    const existingCompletion = topic.completions.find(
      (c) => c.user.toString() === req.user.id
    );

    if (existingCompletion) {
      existingCompletion.quizScore = Math.max(existingCompletion.quizScore, score);
      existingCompletion.completedAt = new Date();
    } else {
      topic.completions.push({
        user: req.user.id,
        quizScore: score,
      });
    }

    await topic.save();

    res.json({
      score,
      totalQuestions: topic.quiz.length,
      correctAnswers,
      feedback: topic.quiz.map((q, i) => ({
        correct: answers[i] === q.correctAnswer,
        explanation: q.explanation,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting quiz' });
  }
});

// Get topic resources
router.get('/:id/resources', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id).select('resources');

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json(topic.resources);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resources' });
  }
});

// Add resource to topic
router.post('/:id/resources', verifyToken, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    if (topic.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    topic.resources.push(req.body);
    await topic.save();

    res.status(201).json(topic.resources);
  } catch (error) {
    res.status(500).json({ message: 'Error adding resource' });
  }
});

export default router;