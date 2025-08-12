const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: String,
  type: String,         // e.g., "pdf", "link", "video"
  link: String,
  uploadedFile: String,
  description: String
});

const learningPathSchema = new mongoose.Schema({
  title: String,
  description: String,
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true }, // For reference
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }, // Course-specific
  resources: [resourceSchema],
  estimatedTime: String,
  learners: [{
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    progress: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    lastAccessed: { type: Date, default: Date.now }
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LearningPath', learningPathSchema);
