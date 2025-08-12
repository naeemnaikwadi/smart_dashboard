const mongoose = require('mongoose');

const readingSessionSchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // in minutes
  topic: { type: String, required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
  pagesRead: { type: Number, default: 0 },
  completionPercentage: { type: Number, default: 0 }
});

const progressSchema = new mongoose.Schema({
  learnerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  learningPathId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LearningPath', 
    required: true 
  },
  topicId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Topic' 
  },
  overallProgress: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100 
  },
  timeSpent: { 
    type: Number, 
    default: 0 // total time spent in minutes
  },
  readingSessions: [readingSessionSchema],
  lastAccessed: { 
    type: Date, 
    default: Date.now 
  },
  completedTopics: [{
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    completedAt: { type: Date, default: Date.now },
    timeSpent: { type: Number, default: 0 },
    score: { type: Number, default: 0 }
  }],
  currentTopic: {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    progress: { type: Number, default: 0 },
    startTime: { type: Date }
  },
  readingStatistics: {
    totalReadingTime: { type: Number, default: 0 },
    averageSessionTime: { type: Number, default: 0 },
    longestSession: { type: Number, default: 0 },
    sessionsCount: { type: Number, default: 0 },
    lastSessionDate: { type: Date }
  },
  goals: {
    dailyReadingGoal: { type: Number, default: 60 }, // minutes
    weeklyReadingGoal: { type: Number, default: 300 }, // minutes
    monthlyReadingGoal: { type: Number, default: 1200 } // minutes
  },
  achievements: [{
    type: { type: String, enum: ['first_session', 'daily_streak', 'weekly_goal', 'monthly_goal', 'topic_completion'] },
    achievedAt: { type: Date, default: Date.now },
    description: String
  }]
}, {
  timestamps: true
});

// Index for efficient queries
progressSchema.index({ learnerId: 1, learningPathId: 1 });
progressSchema.index({ learnerId: 1, lastAccessed: -1 });

// Virtual for calculating average session time
progressSchema.virtual('averageSessionTime').get(function() {
  if (this.readingSessions.length === 0) return 0;
  const totalTime = this.readingSessions.reduce((sum, session) => sum + session.duration, 0);
  return Math.round(totalTime / this.readingSessions.length);
});

// Method to start a reading session
progressSchema.methods.startReadingSession = function(topic, resourceId) {
  const session = {
    startTime: new Date(),
    topic,
    resourceId
  };
  
  this.readingSessions.push(session);
  this.currentTopic = {
    topicId: resourceId,
    progress: 0,
    startTime: new Date()
  };
  this.lastAccessed = new Date();
  
  return session;
};

// Method to end a reading session
progressSchema.methods.endReadingSession = function(sessionId, duration, pagesRead, completionPercentage) {
  const session = this.readingSessions.id(sessionId);
  if (session) {
    session.endTime = new Date();
    session.duration = duration;
    session.pagesRead = pagesRead;
    session.completionPercentage = completionPercentage;
    
    // Update statistics
    this.timeSpent += duration;
    this.readingStatistics.totalReadingTime += duration;
    this.readingStatistics.sessionsCount += 1;
    this.readingStatistics.lastSessionDate = new Date();
    
    // Update average session time
    this.readingStatistics.averageSessionTime = this.averageSessionTime;
    
    // Update longest session if applicable
    if (duration > this.readingStatistics.longestSession) {
      this.readingStatistics.longestSession = duration;
    }
  }
};

// Method to update progress
progressSchema.methods.updateProgress = function(progressPercentage) {
  this.overallProgress = Math.min(100, Math.max(0, progressPercentage));
  this.lastAccessed = new Date();
};

// Static method to get learner statistics
progressSchema.statics.getLearnerStats = async function(learnerId) {
  const stats = await this.aggregate([
    { $match: { learnerId: new mongoose.Types.ObjectId(learnerId) } },
    {
      $group: {
        _id: null,
        totalTimeSpent: { $sum: '$timeSpent' },
        averageProgress: { $avg: '$overallProgress' },
        totalSessions: { $sum: '$readingStatistics.sessionsCount' },
        completedTopics: { $sum: { $size: '$completedTopics' } }
      }
    }
  ]);
  
  return stats[0] || {
    totalTimeSpent: 0,
    averageProgress: 0,
    totalSessions: 0,
    completedTopics: 0
  };
};

module.exports = mongoose.model('Progress', progressSchema);
