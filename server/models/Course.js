const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['pdf', 'word', 'excel', 'video', 'audio', 'link', 'image', 'document', 'spreadsheet', 'presentation', 'text', 'other'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  // Cloudinary metadata for cloud storage
  cloudinaryId: {
    type: String
  },
  cloudinaryUrl: {
    type: String
  },
  cloudinaryVersion: {
    type: String
  },
  // Legacy support for local files
  isCloudinary: {
    type: Boolean,
    default: false
  }
});

const LiveSessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  roomName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const RatingSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const CourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  materials: [MaterialSchema],
  liveSessions: [LiveSessionSchema],
  ratings: [RatingSchema],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  studentsEnrolled: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Virtual for calculating average rating
CourseSchema.virtual('calculatedAverageRating').get(function() {
  if (this.ratings.length === 0) return 0;
  const totalRating = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
  return Math.round((totalRating / this.ratings.length) * 10) / 10;
});

// Pre-save middleware to update average rating
CourseSchema.pre('save', function(next) {
  if (this.ratings.length > 0) {
    this.averageRating = this.calculatedAverageRating;
    this.totalRatings = this.ratings.length;
  }
  next();
});

module.exports = mongoose.model('Course', CourseSchema);
