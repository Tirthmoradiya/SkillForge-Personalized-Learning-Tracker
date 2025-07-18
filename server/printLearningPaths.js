import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LearningPath from './models/LearningPath.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function printLearningPaths() {
  await mongoose.connect(MONGODB_URI);
  const paths = await LearningPath.find({});
  console.log('Learning Paths:');
  paths.forEach(lp => {
    console.log({
      _id: lp._id,
      title: lp.title,
      status: lp.status,
      courses: lp.courses,
      topics: lp.topics,
    });
  });
  process.exit(0);
}

printLearningPaths(); 