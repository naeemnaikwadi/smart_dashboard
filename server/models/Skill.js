const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  title: String,
  description: String,
  resources: [{
    type: { type: String, enum: ['pdf', 'video', 'link'] },
    url: String,
    title: String
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Skill', SkillSchema);