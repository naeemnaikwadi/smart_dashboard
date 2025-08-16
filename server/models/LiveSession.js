// backend/models/LiveSession.js
const mongoose = require('mongoose');

const LiveSessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 }, // in minutes
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  roomName: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['scheduled', 'live', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    leftAt: Date
  }],
  recordingUrl: String,
  notes: String
}, { timestamps: true });

// Index for efficient querying
LiveSessionSchema.index({ instructor: 1, scheduledAt: 1 });
LiveSessionSchema.index({ classroom: 1, scheduledAt: 1 });
LiveSessionSchema.index({ courseId: 1, scheduledAt: 1 });
LiveSessionSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('LiveSession', LiveSessionSchema);
