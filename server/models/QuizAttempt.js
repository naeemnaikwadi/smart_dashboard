const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  answer: mongoose.Schema.Types.Mixed, // Can be string, array, or object depending on question type
  isCorrect: Boolean,
  pointsEarned: {
    type: Number,
    default: 0
  },
  feedback: String,
  timeSpent: Number // in seconds
});

const quizAttemptSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  learningPathId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath',
    required: true
  },
  stepId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  answers: [answerSchema],
  totalScore: {
    type: Number,
    default: 0
  },
  maxScore: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  feedback: String, // Overall feedback for the attempt
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to calculate scores and percentage
quizAttemptSchema.pre('save', function(next) {
  if (this.answers.length > 0) {
    this.totalScore = this.answers.reduce((total, answer) => total + answer.pointsEarned, 0);
    this.percentage = Math.round((this.totalScore / this.maxScore) * 100);
    this.passed = this.percentage >= 70; // Default passing score
  }
  next();
});

// Method to calculate time spent
quizAttemptSchema.methods.calculateTimeSpent = function() {
  if (this.completedAt && this.startedAt) {
    this.timeSpent = Math.round((this.completedAt - this.startedAt) / 1000);
  }
  return this.timeSpent;
};

// Method to complete the attempt
quizAttemptSchema.methods.completeAttempt = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  this.calculateTimeSpent();
  return this;
};

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
