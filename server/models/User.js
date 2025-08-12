const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'instructor'],
    required: true
  },
  avatarUrl: {
    type: String,
    default: '/uploads/default-avatar.png'
  }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
