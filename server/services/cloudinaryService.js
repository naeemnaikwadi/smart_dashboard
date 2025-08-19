const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

class CloudinaryService {
  /**
   * Upload a single file to Cloudinary
   * @param {Buffer} fileBuffer - File buffer
   * @param {Object} fileInfo - File information
   * @param {string} folder - Custom folder path (optional)
   * @returns {Promise<Object>} Upload result
   */
  static async uploadFile(fileBuffer, fileInfo, folder = 'smart-learning') {
    try {
      console.log('☁️ Starting Cloudinary upload...');
      console.log('File info:', {
        name: fileInfo.originalname,
        size: fileInfo.size,
        mimetype: fileInfo.mimetype,
        folder: folder
      });

      // Determine resource type based on MIME type
      // Per requirements: use 'raw' for all non-image uploads
      let resourceType = fileInfo.mimetype && fileInfo.mimetype.startsWith('image/')
        ? 'image'
        : 'raw';

      console.log('Resource type:', resourceType);

      // Derive file extension and base name
      const originalName = fileInfo.originalname || 'file';
      const lastDotIndex = originalName.lastIndexOf('.');
      const fileExtension = lastDotIndex !== -1 ? originalName.substring(lastDotIndex + 1).toLowerCase() : '';
      const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
      // Sanitize base name: no spaces, remove unsafe characters
      const sanitizedBaseName = baseName
        .replace(/\s+/g, '_')
        .replace(/[^A-Za-z0-9._-]/g, '_')
        .replace(/^_+|_+$/g, '') || 'file';

      // Create upload options
      const uploadOptions = {
        resource_type: resourceType,
        folder: folder,
        type: 'upload',
        // Use a sanitized public_id based on original filename
        public_id: `${sanitizedBaseName}-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
        overwrite: false,
        access_mode: 'public'
      };

      // Ensure PDFs uploaded as raw are delivered with proper .pdf extension
      if (resourceType === 'raw' && fileExtension === 'pdf') {
        uploadOptions.format = 'pdf';
      }

      console.log('Upload options:', uploadOptions);

      // Convert buffer to stream for Cloudinary
      const stream = Readable.from(fileBuffer);
      
      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        
        stream.pipe(uploadStream);
      });

      console.log('✅ Cloudinary upload successful:', result.public_id);

      // Return in the same format as local upload for compatibility
      const uploadResult = {
        originalName: fileInfo.originalname,
        filename: fileInfo.originalname,
        path: result.secure_url,
        size: fileInfo.size,
        mimetype: fileInfo.mimetype,
        cloudinaryId: result.public_id,
        cloudinaryUrl: result.secure_url,
        cloudinaryVersion: result.version,
        isCloudinary: true,
        uploadedAt: new Date()
      };

      console.log('✅ Upload result prepared');
      return uploadResult;

    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
    }
  }

  /**
   * Upload multiple files to Cloudinary
   * @param {Array} files - Array of file objects
   * @param {string} folder - Custom folder path (optional)
   * @returns {Promise<Array>} Array of upload results
   */
  static async uploadMultipleFiles(files, folder = 'smart-learning') {
    try {
      const uploadPromises = files.map(file => 
        this.uploadFile(file.buffer, file, folder)
      );
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Multiple files upload error:', error);
      throw new Error('Failed to upload multiple files to Cloudinary');
    }
  }

  /**
   * Delete a file from Cloudinary
   * @param {string} cloudinaryId - Cloudinary public ID
   * @param {string} resourceType - Resource type (image, video, raw)
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteFile(cloudinaryId, resourceType = 'auto') {
    try {
      const result = await cloudinary.uploader.destroy(cloudinaryId, {
        resource_type: resourceType
      });
      return result;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error('Failed to delete file from Cloudinary');
    }
  }

  /**
   * Get file URL with transformations
   * @param {string} cloudinaryId - Cloudinary public ID
   * @param {Object} options - Transformation options
   * @returns {string} Transformed URL
   */
  static getFileUrl(cloudinaryId, options = {}) {
    return cloudinary.url(cloudinaryId, options);
  }

  /**
   * Generate signed URLs for a Cloudinary asset (useful when delivery requires authentication)
   * @param {string} publicId
   * @param {object} opts
   * @returns {{uploadUrl?: string, authenticatedUrl?: string}}
   */
  static getSignedUrls(publicId, opts = {}) {
    const resourceType = opts.resource_type || 'raw';
    const format = opts.format || undefined;
    const common = { resource_type: resourceType, sign_url: true, secure: true };

    const uploadUrl = cloudinary.url(publicId, { ...common, type: 'upload', format });
    const authenticatedUrl = cloudinary.url(publicId, { ...common, type: 'authenticated', format });
    return { uploadUrl, authenticatedUrl };
  }

  /**
   * Test Cloudinary connection
   * @returns {Promise<boolean>} Connection status
   */
  static async testConnection() {
    try {
      // Test with a simple API call
      const result = await cloudinary.api.ping();
      console.log('✅ Cloudinary connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Cloudinary connection test failed:', error);
      return false;
    }
  }
}

module.exports = CloudinaryService;
