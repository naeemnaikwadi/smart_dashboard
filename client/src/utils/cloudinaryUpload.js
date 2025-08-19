/**
 * Client-side Cloudinary upload utilities with server-side fallback
 * This allows direct uploads to Cloudinary, falling back to server upload if needed
 */

const CLOUDINARY_CLOUD_NAME = 'doglr9qsr';

/**
 * Upload a single file directly to Cloudinary with server fallback
 * @param {File} file - The file to upload
 * @param {string} folder - The folder path in Cloudinary (optional)
 * @param {string} resourceType - The resource type (image, video, raw) (optional)
 * @returns {Promise<Object>} - Upload result with Cloudinary data
 */
export const uploadToCloudinary = async (file, folder = 'smart-learning', resourceType = 'auto') => {
  try {
    console.log('🚀 Starting Cloudinary upload for:', file.name, 'Type:', file.type);
    
    // Try client-side upload first
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');
      
      if (folder) {
        formData.append('folder', folder);
      }

      // Determine resource type based on file type
      let detectedResourceType = resourceType;
      if (resourceType === 'auto') {
        if (file.type.startsWith('image/')) {
          detectedResourceType = 'image';
        } else if (file.type.startsWith('video/')) {
          detectedResourceType = 'video';
        } else {
          detectedResourceType = 'raw';
        }
      }

      console.log('📁 Resource type:', detectedResourceType, 'Upload preset: ml_default');

      // Use appropriate upload endpoint based on resource type
      let uploadUrl;
      if (detectedResourceType === 'image') {
        uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
      } else if (detectedResourceType === 'video') {
        uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;
      } else {
        uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`;
      }

      console.log('🌐 Upload URL:', uploadUrl);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Client-side upload successful:', data);
        
        // Return standardized result
        return {
          success: true,
          cloudinaryId: data.public_id,
          cloudinaryUrl: data.secure_url,
          cloudinaryVersion: data.version,
          originalName: file.name,
          name: file.name,
          size: file.size,
          mimetype: file.type,
          uploadedAt: new Date(),
          isCloudinary: true
        };
      } else {
        const errorText = await response.text();
        console.log('⚠️ Client-side upload failed, trying server-side:', errorText);
        throw new Error('Client upload failed');
      }

    } catch (clientError) {
      console.log('🔄 Falling back to server-side upload...');
      
      // Fallback to server-side upload
      const serverFormData = new FormData();
      serverFormData.append('file', file);
      serverFormData.append('folder', folder);
      serverFormData.append('resourceType', resourceType);

      const serverResponse = await fetch('http://localhost:4000/api/upload/single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: serverFormData
      });

      if (!serverResponse.ok) {
        const errorText = await serverResponse.text();
        throw new Error(`Server upload failed: ${serverResponse.status} ${serverResponse.statusText} - ${errorText}`);
      }

      const serverData = await serverResponse.json();
      console.log('✅ Server-side upload successful:', serverData);
      
      return {
        success: true,
        cloudinaryId: serverData.cloudinaryId,
        cloudinaryUrl: serverData.cloudinaryUrl,
        cloudinaryVersion: serverData.cloudinaryVersion,
        originalName: file.name,
        name: file.name,
        size: file.size,
        mimetype: file.type,
        uploadedAt: new Date(),
        isCloudinary: true
      };
    }

  } catch (error) {
    console.error('❌ All upload methods failed:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {File[]} files - Array of files to upload
 * @param {string} folder - The folder path in Cloudinary (optional)
 * @returns {Promise<Array>} - Array of upload results
 */
export const uploadMultipleToCloudinary = async (files, folder = 'smart-learning') => {
  try {
    const uploadPromises = files.map(file => uploadToCloudinary(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple files upload error:', error);
    throw new Error('Failed to upload multiple files to Cloudinary');
  }
};

/**
 * Upload course material to Cloudinary
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} - Upload result
 */
export const uploadCourseMaterial = async (file) => {
  return uploadToCloudinary(file, 'smart-learning/courses');
};

/**
 * Upload doubt attachment to Cloudinary
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} - Upload result
 */
export const uploadDoubtAttachment = async (file) => {
  return uploadToCloudinary(file, 'smart-learning/doubts');
};

/**
 * Upload profile photo to Cloudinary
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} - Upload result
 */
export const uploadProfilePhoto = async (file) => {
  return uploadToCloudinary(file, 'smart-learning/profiles', 'image');
};

/**
 * Upload learning path resource to Cloudinary
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} - Upload result
 */
export const uploadLearningPathResource = async (file) => {
  return uploadToCloudinary(file, 'smart-learning/learning-paths');
};

/**
 * Upload quiz file to Cloudinary
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} - Upload result
 */
export const uploadQuizFile = async (file) => {
  return uploadToCloudinary(file, 'smart-learning/quizzes');
};

/**
 * Get Cloudinary transformation URL
 * @param {string} cloudinaryUrl - The original Cloudinary URL
 * @param {Object} transformations - Transformation options
 * @returns {string} - Transformed URL
 */
export const getTransformedUrl = (cloudinaryUrl, transformations = {}) => {
  if (!cloudinaryUrl || !cloudinaryUrl.includes('res.cloudinary.com')) {
    return cloudinaryUrl;
  }

  // Parse the URL to extract components
  const urlParts = cloudinaryUrl.split('/');
  const uploadIndex = urlParts.findIndex(part => part === 'upload');
  
  if (uploadIndex === -1) {
    return cloudinaryUrl;
  }

  // Build transformation string
  const transformParts = [];
  if (transformations.width) transformParts.push(`w_${transformations.width}`);
  if (transformations.height) transformParts.push(`h_${transformations.height}`);
  if (transformations.crop) transformParts.push(`c_${transformations.crop}`);
  if (transformations.quality) transformParts.push(`q_${transformations.quality}`);
  if (transformations.format) transformParts.push(`f_${transformations.format}`);
  if (transformations.flags) transformParts.push(`fl_${transformations.flags}`);

  const transformString = transformParts.length > 0 ? transformParts.join(',') + '/' : '';

  // Insert transformations after 'upload'
  urlParts.splice(uploadIndex + 1, 0, transformString);

  return urlParts.join('/');
};

/**
 * Check if a URL is a Cloudinary URL
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's a Cloudinary URL
 */
export const isCloudinaryUrl = (url) => {
  return url && url.includes('res.cloudinary.com');
};

/**
 * Extract Cloudinary public ID from URL
 * @param {string} cloudinaryUrl - The Cloudinary URL
 * @returns {string} - The public ID
 */
export const getCloudinaryPublicId = (cloudinaryUrl) => {
  if (!isCloudinaryUrl(cloudinaryUrl)) {
    return null;
  }

  const urlParts = cloudinaryUrl.split('/');
  const uploadIndex = urlParts.findIndex(part => part === 'upload');
  
  if (uploadIndex === -1 || uploadIndex + 2 >= urlParts.length) {
    return null;
  }

  // Skip version number and get the public ID
  return urlParts[uploadIndex + 2];
};
