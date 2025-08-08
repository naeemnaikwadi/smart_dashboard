// backend/models/LiveSession.js
const mongoose = require('mongoose');

const LiveSessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  instructor: { type: String, required: true }, // instructor name or id
  link: { type: String, required: true }, // video meet link
}, { timestamps: true });

module.exports = mongoose.model('LiveSession', LiveSessionSchema);
