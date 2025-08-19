const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['mcq', 'multiple_choice', 'long_answer', 'numerical', 'assignment'],
    required: true
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: String, // For MCQ/multiple (comma-separated for multiple)
  longAnswerGuidelines: String, // For long answer questions
  // Numerical question support
  numericAnswer: Number,
  numericTolerance: {
    type: Number,
    default: 0
  },
  // Assignment upload indicator
  requiresUpload: {
    type: Boolean,
    default: false
  },
  points: {
    type: Number,
    default: 1
  },
  explanation: String, // Explanation of the correct answer
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  learningPathId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath',
    required: true
  },
  stepId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [questionSchema],
  totalPoints: {
    type: Number,
    default: 0
  },
  timeLimit: {
    type: Number, // in minutes
    default: 30
  },
  passingScore: {
    type: Number, // percentage
    default: 70
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowRetakes: {
    type: Boolean,
    default: true
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to calculate total points
quizSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce((total, question) => total + question.points, 0);
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Quiz', quizSchema);
