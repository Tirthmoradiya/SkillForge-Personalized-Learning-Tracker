import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  topics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);
export default Course; 