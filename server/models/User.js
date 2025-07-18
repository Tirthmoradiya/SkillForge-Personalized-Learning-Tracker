import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    completedTopics: [{
      topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
      completedAt: { type: Date, default: Date.now }
    }],
    recentActivity: {
      type: [{
        topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
        learningPath: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath' },
        lastAccessed: { type: Date, default: Date.now },
        status: { type: String, enum: ['In Progress', 'Completed'], default: 'In Progress' },
      }],
      default: []
    },
    notifications: { type: [mongoose.Schema.Types.ObjectId], ref: 'Notification', default: [] },
    learningPaths: { type: [mongoose.Schema.Types.ObjectId], ref: 'LearningPath', default: [] },
    seenTopics: { type: [mongoose.Schema.Types.ObjectId], ref: 'Topic', default: [] },
    viewedTopics: [{
      topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
      viewedAt: { type: Date, default: Date.now },
      shortDescription: { type: String }
    }],
    about: { type: String, default: '' },
    interests: { type: [String], default: [] },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    deletedAt: { type: Date, default: null },
    quizScores: [{
      course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
      score: { type: Number, required: true }
    }],
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;