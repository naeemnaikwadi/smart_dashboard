const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: String,
  type: String,         // e.g., "pdf", "link", "video"
  link: String,
  uploadedFile: String,
});

const learningPathSchema = new mongoose.Schema({
  title: String,
  description: String,
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resources: [resourceSchema],
  estimatedTime: String,
  learners: [{
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    progress: Number,
    timeSpent: Number
  }]
});

module.exports = mongoose.model('LearningPath', learningPathSchema);
