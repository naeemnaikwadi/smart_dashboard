// server/routes/users.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const CloudinaryService = require('../services/cloudinaryService');

// Configure multer for memory storage (to get file buffer for Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Test route
router.get('/', (req, res) => {
  res.json({ message: '✅ Users route is active' });
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic info
    if (name) user.name = name;
    if (email) user.email = email;

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    // Return updated user info (without password)
    const updatedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl
    };

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Upload profile photo
router.post('/profile-photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old profile photo if it exists (only if it's a local file)
    if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/') && user.avatarUrl !== '/uploads/default-avatar.png') {
      const oldPhotoPath = path.join(__dirname, '..', user.avatarUrl);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Upload new profile photo to Cloudinary
    const cloudinaryResult = await CloudinaryService.uploadFile(req.file.buffer, req.file, 'smart-learning/profiles');
    user.avatarUrl = cloudinaryResult.cloudinaryUrl;
    await user.save();

    res.json({
      message: 'Profile photo uploaded successfully',
      avatarUrl: user.avatarUrl
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ message: 'Failed to upload profile photo' });
  }
});

// @route   PUT api/users/profile/photo
// @desc    Update profile photo
// @access  Private
router.put('/profile/photo', auth, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await CloudinaryService.uploadFile(
      req.file.buffer,
      req.file,
      'smart-learning/profiles'
    );

    // Update user profile
    const user = await User.findById(req.user.id);
    user.avatarUrl = result.cloudinaryUrl;
    await user.save();

    res.json({
      message: 'Profile photo updated successfully',
      avatarUrl: result.cloudinaryUrl
    });
  } catch (error) {
    console.error('Error updating profile photo:', error);
    res.status(500).json({ error: 'Failed to update profile photo' });
  }
});

// Alternative route for direct Cloudinary uploads (no file processing needed)
router.put('/profile/photo/direct', auth, async (req, res) => {
  try {
    const { cloudinaryUrl } = req.body;
    
    if (!cloudinaryUrl) {
      return res.status(400).json({ error: 'No Cloudinary URL provided' });
    }

    // Update user profile
    const user = await User.findById(req.user.id);
    user.avatarUrl = cloudinaryUrl;
    await user.save();

    res.json({
      message: 'Profile photo updated successfully',
      avatarUrl: cloudinaryUrl
    });
  } catch (error) {
    console.error('Error updating profile photo:', error);
    res.status(500).json({ error: 'Failed to update profile photo' });
  }
});

module.exports = router;
