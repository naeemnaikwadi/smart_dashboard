/**
 * File utility functions for handling both local and Cloudinary files
 * This ensures backward compatibility during migration
 */

/**
 * Get the appropriate URL for a file (Cloudinary or local)
 * @param {Object} material - Material object from database
 * @returns {string} File URL
 */
function getFileUrl(material) {
  // If it's a Cloudinary file, use cloudinaryUrl
  if (material.isCloudinary && material.cloudinaryUrl) {
    return material.cloudinaryUrl;
  }
  
  // If it's a link type, use the url directly
  if (material.type === 'link') {
    return material.url;
  }
  
  // Fallback to local URL or original URL
  return material.url || '';
}

/**
 * Check if a file is stored in Cloudinary
 * @param {Object} material - Material object from database
 * @returns {boolean} True if file is in Cloudinary
 */
function isCloudinaryFile(material) {
  return material.isCloudinary === true && material.cloudinaryId;
}

/**
 * Check if a file is stored locally
 * @param {Object} material - Material object from database
 * @param {string} baseUrl - Base URL for local files (e.g., http://localhost:4000)
 * @returns {boolean} True if file is local
 */
function isLocalFile(material, baseUrl = 'http://localhost:4000') {
  return !isCloudinaryFile(material) && 
         material.url && 
         material.url.startsWith(baseUrl);
}

/**
 * Get file type category
 * @param {string} fileName - File name
 * @returns {string} File type category
 */
function getFileTypeCategory(fileName) {
  const ext = fileName.toLowerCase().split('.').pop();
  
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
  const spreadsheetTypes = ['xls', 'xlsx', 'csv'];
  const presentationTypes = ['ppt', 'pptx'];
  const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
  const audioTypes = ['mp3', 'wav', 'ogg', 'aac'];
  
  if (imageTypes.includes(ext)) return 'image';
  if (documentTypes.includes(ext)) return 'document';
  if (spreadsheetTypes.includes(ext)) return 'spreadsheet';
  if (presentationTypes.includes(ext)) return 'presentation';
  if (videoTypes.includes(ext)) return 'video';
  if (audioTypes.includes(ext)) return 'audio';
  
  return 'other';
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file icon based on type
 * @param {string} fileName - File name
 * @returns {string} Icon class or emoji
 */
function getFileIcon(fileName) {
  const category = getFileTypeCategory(fileName);
  
  const icons = {
    image: '🖼️',
    document: '📄',
    spreadsheet: '📊',
    presentation: '📽️',
    video: '🎥',
    audio: '🎵',
    other: '📁'
  };
  
  return icons[category] || icons.other;
}

/**
 * Validate if a URL is accessible
 * @param {string} url - URL to validate
 * @returns {Promise<boolean>} True if URL is accessible
 */
async function validateFileUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error validating file URL:', error);
    return false;
  }
}

/**
 * Get file metadata for display
 * @param {Object} material - Material object from database
 * @returns {Object} Formatted file metadata
 */
function getFileMetadata(material) {
  return {
    title: material.title,
    type: material.type,
    fileName: material.fileName,
    fileSize: material.fileSize,
    formattedSize: formatFileSize(material.fileSize || 0),
    icon: getFileIcon(material.fileName || ''),
    category: getFileTypeCategory(material.fileName || ''),
    url: getFileUrl(material),
    isCloudinary: isCloudinaryFile(material),
    uploadedAt: material.uploadedAt,
    cloudinaryId: material.cloudinaryId
  };
}

module.exports = {
  getFileUrl,
  isCloudinaryFile,
  isLocalFile,
  getFileTypeCategory,
  formatFileSize,
  getFileIcon,
  validateFileUrl,
  getFileMetadata
};
