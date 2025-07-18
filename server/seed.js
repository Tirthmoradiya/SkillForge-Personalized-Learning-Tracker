import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from './models/Course.js';
import LearningPath from './models/LearningPath.js';
import Topic from './models/Topic.js';
import User from './models/User.js';
import Notification from './models/Notification.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

function randomDateWithinLastNWeeks(weeksAgo) {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * (weeksAgo * 7));
  const d = new Date(now);
  d.setDate(now.getDate() - daysAgo);
  d.setHours(10, 0, 0, 0);
  return d;
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);

    // Clear existing data
    await Notification.deleteMany({});
    await Topic.deleteMany({});
    await Course.deleteMany({});
    await LearningPath.deleteMany({});
    await User.deleteMany({});

    // Create users (1 admin, 4 regular)
    const usersData = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'adminpass',
        role: 'admin',
        about: 'I am the admin.',
        interests: ['analytics', 'education'],
        createdAt: randomDateWithinLastNWeeks(8),
      },
      {
        username: 'alice',
        email: 'alice@example.com',
        password: 'alicepass',
        about: 'Frontend enthusiast.',
        interests: ['frontend', 'css', 'design'],
        createdAt: randomDateWithinLastNWeeks(8),
      },
      {
        username: 'bob',
        email: 'bob@example.com',
        password: 'bobpass',
        about: 'Backend lover.',
        interests: ['node', 'api', 'databases'],
        createdAt: randomDateWithinLastNWeeks(8),
      },
      {
        username: 'carol',
        email: 'carol@example.com',
        password: 'carolpass',
        about: 'React developer.',
        interests: ['react', 'hooks', 'spa'],
        createdAt: randomDateWithinLastNWeeks(8),
      },
      {
        username: 'dave',
        email: 'dave@example.com',
        password: 'davepass',
        about: 'ML explorer.',
        interests: ['python', 'ml', 'data'],
        createdAt: randomDateWithinLastNWeeks(8),
      },
    ];
    // Insert users with password hashing (use User.create to trigger pre-save hook)
    const createdUsers = [];
    for (const user of usersData) {
      createdUsers.push(await User.create(user));
    }
    const [adminUser, alice, bob, carol, dave] = createdUsers;

    // Define topics for each course
    const courseTopics = [
      {
        courseTitle: 'Frontend Web Development',
        topics: [
          { title: 'HTML Basics', description: 'Learn HTML structure.', content: 'HTML content', difficulty: 'beginner', type: 'core' },
          { title: 'CSS Fundamentals', description: 'Learn CSS styling.', content: 'CSS content', difficulty: 'beginner', type: 'core' },
          { title: 'Responsive Design', description: 'Make sites responsive.', content: 'Responsive content', difficulty: 'beginner', type: 'core' },
        ]
      },
      {
        courseTitle: 'React Developer',
        topics: [
          { title: 'React Components', description: 'Learn about components.', content: 'Components content', difficulty: 'beginner', type: 'core' },
          { title: 'State & Props', description: 'Understand state and props.', content: 'State/Props content', difficulty: 'beginner', type: 'core' },
          { title: 'React Hooks', description: 'Use React hooks.', content: 'Hooks content', difficulty: 'beginner', type: 'core' },
        ]
      },
      {
        courseTitle: 'Backend with Node.js',
        topics: [
          { title: 'Node.js Basics', description: 'Intro to Node.js.', content: 'Node.js content', difficulty: 'beginner', type: 'core' },
          { title: 'Express Routing', description: 'Learn Express routes.', content: 'Express content', difficulty: 'beginner', type: 'core' },
          { title: 'REST APIs', description: 'Build REST APIs.', content: 'REST API content', difficulty: 'beginner', type: 'core' },
        ]
      },
      {
        courseTitle: 'Machine Learning with Python',
        topics: [
          { title: 'Python for ML', description: 'Python essentials.', content: 'Python ML content', difficulty: 'beginner', type: 'core' },
          { title: 'Data Preprocessing', description: 'Clean and prep data.', content: 'Preprocessing content', difficulty: 'beginner', type: 'core' },
          { title: 'Supervised Learning', description: 'Intro to supervised ML.', content: 'Supervised content', difficulty: 'beginner', type: 'core' },
        ]
      },
    ];

    // Insert topics and build topic chains with prerequisites
    let allCreatedTopics = [];
    let createdCourses = [];
    for (const course of courseTopics) {
      let prevTopicId = null;
      let topicIds = [];
      let created = [];
      for (let i = 0; i < course.topics.length; i++) {
        const topicData = {
          ...course.topics[i],
          creator: adminUser._id,
          prerequisites: prevTopicId ? [prevTopicId] : [],
        };
        const topic = await Topic.create(topicData);
        prevTopicId = topic._id;
        topicIds.push(topic._id);
        created.push(topic);
      }
      allCreatedTopics.push(...created);
      // Create course with these topics
      const newCourse = await Course.create({
        title: course.courseTitle,
        description: `Course for ${course.courseTitle}`,
        level: 'Beginner',
        topics: topicIds,
      });
      createdCourses.push(newCourse);
    }

    // Create learning paths (1:1 with courses)
    const sampleLearningPaths = createdCourses.map((course, idx) => ({
      title: `${course.title} Path`,
      description: `Path for ${course.title}`,
      courses: [course._id],
      topics: course.topics,
      status: 'published',
    }));
    const createdLearningPaths = await LearningPath.insertMany(sampleLearningPaths);

    // Note: Users start with no learning paths assigned by default
    // Admins must explicitly assign learning paths to users through the admin panel
    console.log('Learning paths created but not assigned to users by default');
    console.log('Admin can assign learning paths to users through the admin panel');

    // All users start with no topics viewed or completed
    await User.updateMany({}, { $set: { viewedTopics: [], completedTopics: [], recentActivity: [] } });
    // Set lastLogin to now for all users
    await User.updateMany({}, { $set: { lastLogin: new Date() } });

    // Notifications: info, progress, admin, system, reminder, achievement
    const notifications = [
      // Info
      { user: alice._id, message: 'Welcome to the platform!', type: 'info' },
      // Admin
      { user: carol._id, message: 'Admin updated course content.', type: 'admin' },
      // System
      { user: dave._id, message: 'System maintenance scheduled.', type: 'system' },
      // Reminder (for Dave, who has no progress)
      { user: dave._id, message: 'It’s been a while since you viewed a topic. Continue your learning journey!', type: 'reminder' },
    ];
    await Notification.insertMany(notifications);

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed(); 