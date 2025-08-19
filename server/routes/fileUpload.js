const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const CloudinaryService = require('../services/cloudinaryService');

const router = express.Router();
const cloudinary = require('../config/cloudinary');
const https = require('https');
const http = require('http');

// Configure multer for memory storage (for Cloudinary uploads)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types
    cb(null, true);
  }
});

// @route   POST api/upload/single
// @desc    Upload a single file to Cloudinary
// @access  Private
router.post('/single', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📁 File upload request:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Get folder and resource type from request body
    const folder = req.body.folder || 'smart-learning/courses';
    const resourceType = req.body.resourceType || 'auto';
    
    console.log('📁 Upload parameters:', { folder, resourceType });

    // Upload to Cloudinary
    const result = await CloudinaryService.uploadFile(
      req.file.buffer,
      req.file,
      folder
    );

    console.log('✅ File uploaded to Cloudinary:', result);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      cloudinaryId: result.cloudinaryId,
      cloudinaryUrl: result.cloudinaryUrl,
      cloudinaryVersion: result.cloudinaryVersion,
      originalName: result.originalName,
      filename: result.filename,
      size: result.size,
      mimetype: result.mimetype,
      isCloudinary: true
    });

  } catch (error) {
    console.error('❌ Error uploading file:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      details: error.message 
    });
  }
});

// @route   POST api/upload/multiple
// @desc    Upload multiple files to Cloudinary
// @access  Private
router.post('/multiple', auth, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log(`📁 Multiple files upload request: ${req.files.length} files`);

    // Upload to Cloudinary
    const results = await CloudinaryService.uploadMultipleFiles(
      req.files,
      'smart-learning/courses'
    );

    console.log('✅ Files uploaded to Cloudinary:', results.length);

    res.json({
      success: true,
      message: `${results.length} files uploaded successfully`,
      files: results
    });

  } catch (error) {
    console.error('❌ Error uploading multiple files:', error);
    res.status(500).json({ 
      error: 'Failed to upload files',
      details: error.message 
    });
  }
});

// @route   POST api/upload/doubt
// @desc    Upload doubt image/attachment to Cloudinary
// @access  Private
router.post('/doubt', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await CloudinaryService.uploadFile(
      req.file.buffer,
      req.file,
      'smart-learning/doubts'
    );

    res.json({
      success: true,
      message: 'Doubt file uploaded successfully',
      file: result
    });

  } catch (error) {
    console.error('❌ Error uploading doubt file:', error);
    res.status(500).json({ 
      error: 'Failed to upload doubt file',
      details: error.message 
    });
  }
});

// @route   POST api/upload/profile
// @desc    Upload profile image to Cloudinary
// @access  Private
router.post('/profile', auth, upload.single('file'), async (req, res) => {
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

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      file: result
    });

  } catch (error) {
    console.error('❌ Error uploading profile image:', error);
    res.status(500).json({ 
      error: 'Failed to upload profile image',
      details: error.message 
    });
  }
});

// @route   POST api/upload/materials
// @desc    Upload course materials to Cloudinary
// @access  Private
router.post('/materials', auth, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log(`📁 Course materials upload request: ${req.files.length} files`);

    // Upload to Cloudinary
    const results = await CloudinaryService.uploadMultipleFiles(
      req.files,
      'smart-learning/materials'
    );

    console.log('✅ Course materials uploaded to Cloudinary:', results.length);

    res.json({
      success: true,
      message: `${results.length} course materials uploaded successfully`,
      files: results
    });

  } catch (error) {
    console.error('❌ Error uploading course materials:', error);
    res.status(500).json({ 
      error: 'Failed to upload course materials',
      details: error.message 
    });
  }
});

// @route   DELETE api/upload/:cloudinaryId
// @desc    Delete a file from Cloudinary
// @access  Private
router.delete('/:cloudinaryId', auth, async (req, res) => {
  try {
    const { cloudinaryId } = req.params;
    const { resourceType = 'auto' } = req.query;

    const result = await CloudinaryService.deleteFile(cloudinaryId, resourceType);

    res.json({
      success: true,
      message: 'File deleted successfully',
      result
    });

  } catch (error) {
    console.error('❌ Error deleting file:', error);
    res.status(500).json({ 
      error: 'Failed to delete file',
      details: error.message 
    });
  }
});

// @route   GET api/upload/test
// @desc    Test Cloudinary connection
// @access  Private
router.get('/test', auth, async (req, res) => {
  try {
    const isConnected = await CloudinaryService.testConnection();
    
    if (isConnected) {
      res.json({
        success: true,
        message: 'Cloudinary connection successful'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Cloudinary connection failed'
      });
    }

  } catch (error) {
    console.error('❌ Error testing Cloudinary connection:', error);
    res.status(500).json({ 
      error: 'Failed to test Cloudinary connection',
      details: error.message 
    });
  }
});

// @route   POST api/upload/sign
// @desc    Generate signed Cloudinary URLs for a given public_id
// @access  Private
router.post('/sign', auth, async (req, res) => {
  try {
    const { cloudinaryId, resourceType = 'raw', format } = req.body;
    if (!cloudinaryId) {
      return res.status(400).json({ error: 'cloudinaryId is required' });
    }

    // Generate both upload and authenticated signed URLs
    const { uploadUrl, authenticatedUrl } = require('../services/cloudinaryService').getSignedUrls(cloudinaryId, {
      resource_type: resourceType,
      format
    });

    res.json({ success: true, uploadUrl, authenticatedUrl });
  } catch (error) {
    console.error('❌ Error generating signed URL:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

// @route   GET api/upload/private-download
// @desc    Get a short-lived signed URL to privately download an asset
// @access  Private
router.get('/private-download', auth, async (req, res) => {
  try {
    const { publicId, resourceType = 'raw', format } = req.query;
    if (!publicId) {
      return res.status(400).json({ error: 'publicId is required' });
    }

    let decodedPublicId = publicId;
    try { decodedPublicId = decodeURIComponent(decodedPublicId); } catch {}
    try { decodedPublicId = decodeURIComponent(decodedPublicId); } catch {}

    const signedUrl = cloudinary.utils.private_download_url(decodedPublicId, format, {
      resource_type: resourceType,
      type: 'authenticated',
      expires_at: Math.floor(Date.now() / 1000) + 300
    });

    return res.json({ url: signedUrl });
  } catch (error) {
    console.error('❌ Error generating private download URL:', error);
    res.status(500).json({ error: 'Failed to generate private download URL' });
  }
});

// @route   GET api/upload/proxy
// @desc    Stream a Cloudinary asset via server using a signed URL (handles 401/404 client issues)
// @access  Private
router.get('/proxy', auth, async (req, res) => {
  try {
    const { publicId, resourceType = 'raw', format } = req.query;
    if (!publicId) {
      return res.status(400).json({ error: 'publicId is required' });
    }

    let decodedPublicId = publicId;
    try { decodedPublicId = decodeURIComponent(decodedPublicId); } catch {}
    try { decodedPublicId = decodeURIComponent(decodedPublicId); } catch {}
    const signedUrl = cloudinary.utils.private_download_url(decodedPublicId, format, {
      resource_type: resourceType,
      type: 'authenticated',
      expires_at: Math.floor(Date.now() / 1000) + 300
    });

    const client = signedUrl.startsWith('https') ? https : http;
    client.get(signedUrl, (proxyRes) => {
      if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
        res.status(proxyRes.statusCode).end();
        return;
      }
      // Forward content type and length if present
      if (proxyRes.headers['content-type']) {
        res.setHeader('Content-Type', proxyRes.headers['content-type']);
      } else if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
      }
      if (proxyRes.headers['content-length']) {
        res.setHeader('Content-Length', proxyRes.headers['content-length']);
      }
      proxyRes.pipe(res);
    }).on('error', (err) => {
      console.error('Proxy fetch error:', err);
      res.status(502).json({ error: 'Failed to fetch from Cloudinary' });
    });
  } catch (error) {
    console.error('❌ Error in proxy endpoint:', error);
    res.status(500).json({ error: 'Proxy error' });
  }
});

module.exports = router;
