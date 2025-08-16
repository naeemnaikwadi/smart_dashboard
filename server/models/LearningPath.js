const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: String,
  type: String,         // e.g., "pdf", "link", "video", "image"
  link: String,
  uploadedFile: String,
  description: String,
  fileSize: Number,
  uploadedAt: { type: Date, default: Date.now }
});

const stepSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    required: true
  },
  resources: [resourceSchema],
  estimatedTime: {
    type: Number, // in minutes
    default: 30
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  hasQuiz: {
    type: Boolean,
    default: false
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },
  quizRequired: {
    type: Boolean,
    default: false
  },
  quizPassingScore: {
    type: Number,
    default: 70
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const learningPathSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  instructorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  classroomId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Classroom', 
    required: true 
  },
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  steps: [stepSchema],
  totalSteps: {
    type: Number,
    default: 0
  },
  estimatedTotalTime: {
    type: Number, // in minutes
    default: 0
  },
  learners: [{
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    progress: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    lastAccessed: { type: Date, default: Date.now },
    completedSteps: [{ type: Number }], // array of completed step orders
    quizResults: [{
      stepId: { type: mongoose.Schema.Types.ObjectId },
      quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
      bestScore: { type: Number, default: 0 },
      attempts: { type: Number, default: 0 },
      passed: { type: Boolean, default: false },
      lastAttemptDate: Date
    }]
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to update totalSteps and estimatedTotalTime
learningPathSchema.pre('save', function(next) {
  this.totalSteps = this.steps.length;
  this.estimatedTotalTime = this.steps.reduce((total, step) => total + (step.estimatedTime || 0), 0);
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('LearningPath', learningPathSchema);
