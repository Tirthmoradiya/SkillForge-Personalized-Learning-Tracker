import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'progress', 'admin', 'system', 'reminder', 'achievement'], default: 'info' },
  recipients: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] }, // empty = broadcast
  readBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification; 