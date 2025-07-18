import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    content: { type: String, required: true },
    resources: [{
      title: { type: String, required: true },
      url: { type: String, required: true },
      type: { type: String, enum: ['article', 'video', 'documentation', 'tutorial', 'exercise'], required: true },
      difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    }],
    estimatedMinutes: { type: Number },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
    tags: [{ type: String, trim: true }],
    type: { type: String, enum: ['core', 'advanced', 'optional'], default: 'core', required: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
    learningPath: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath' },
    order: { type: Number },
  },
  { timestamps: true }
);

const Topic = mongoose.model('Topic', topicSchema);

export default Topic;