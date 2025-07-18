import mongoose from 'mongoose';

const learningPathSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  topics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
}, { timestamps: true });

const LearningPath = mongoose.model('LearningPath', learningPathSchema);
export default LearningPath;