const mongoose = require('mongoose');

const DoubtSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
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
  images: [{
    url: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'answered', 'resolved'],
    default: 'pending'
  },
  answer: {
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      trim: true
    },
    attachments: [{
      url: {
        type: String,
        required: true
      },
      fileName: {
        type: String,
        required: true
      },
      fileType: {
        type: String,
        required: true
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    links: [{
      url: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    answeredAt: {
      type: Date
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isUrgent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient querying
DoubtSchema.index({ course: 1, status: 1 });
DoubtSchema.index({ classroom: 1, status: 1 });
DoubtSchema.index({ student: 1, createdAt: -1 });
DoubtSchema.index({ 'answer.instructor': 1 });

module.exports = mongoose.model('Doubt', DoubtSchema);
