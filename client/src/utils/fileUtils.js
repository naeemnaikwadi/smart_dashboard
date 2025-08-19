/**
 * File utility functions for handling Cloudinary URLs and file types
 */

/**
 * Get the correct file URL for display/download
 * @param {string} url - The file URL
 * @param {string} type - The file type
 * @returns {string} - The processed URL
 */
export const getCorrectFileUrl = (file) => {
  if (!file) return '';
  return file.cloudinaryUrl || file.url || '';
};

/**
 * Get Cloudinary download URL with proper transformations
 * @param {string} url - The Cloudinary URL
 * @param {string} type - The file type
 * @returns {string} - The download URL
 */
export const getCloudinaryDownloadUrl = (url, type) => {
  // No rewriting; return the exact URL we stored
  return url;
};

/**
 * Check if a file is stored in Cloudinary
 * @param {string} url - The file URL
 * @returns {boolean} - True if it's a Cloudinary file
 */
export const isCloudinaryFile = (url) => {
  return url && url.includes('res.cloudinary.com');
};

/**
 * Get file type from MIME type or filename
 * @param {string} mimetype - The MIME type or filename
 * @returns {string} - The file type category
 */
export const getFileType = (mimetype) => {
  if (!mimetype) return 'unknown';
  
  // Handle both MIME types and filenames
  const type = mimetype.toLowerCase();
  
  if (type.startsWith('image/') || type.includes('.jpg') || type.includes('.jpeg') || type.includes('.png') || type.includes('.gif') || type.includes('.webp')) {
    return 'image';
  }
  if (type === 'application/pdf' || type.includes('.pdf')) {
    return 'pdf';
  }
  if (type.includes('word') || type.includes('document') || type.includes('.doc') || type.includes('.docx')) {
    return 'document';
  }
  if (type.includes('excel') || type.includes('spreadsheet') || type.includes('.xls') || type.includes('.xlsx')) {
    return 'spreadsheet';
  }
  if (type.includes('powerpoint') || type.includes('presentation') || type.includes('.ppt') || type.includes('.pptx')) {
    return 'presentation';
  }
  if (type.startsWith('video/') || type.includes('.mp4') || type.includes('.avi') || type.includes('.mov')) {
    return 'video';
  }
  if (type.startsWith('audio/') || type.includes('.mp3') || type.includes('.wav')) {
    return 'audio';
  }
  if (type.includes('text/') || type.includes('.txt')) {
    return 'text';
  }
  
  return 'other';
};

/**
 * Get file extension from filename
 * @param {string} filename - The filename
 * @returns {string} - The file extension
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
};

/**
 * Check if file is an image
 * @param {string} mimetype - The MIME type or filename
 * @returns {boolean} - True if it's an image
 */
export const isImage = (mimetype) => {
  if (!mimetype) return false;
  const type = mimetype.toLowerCase();
  return type.startsWith('image/') || type.includes('.jpg') || type.includes('.jpeg') || type.includes('.png') || type.includes('.gif') || type.includes('.webp');
};

/**
 * Check if file is a PDF
 * @param {string} mimetype - The MIME type or filename
 * @returns {boolean} - True if it's a PDF
 */
export const isPdf = (mimetype) => {
  if (!mimetype) return false;
  const type = mimetype.toLowerCase();
  return type === 'application/pdf' || type.includes('.pdf');
};

/**
 * Check if file is a document (Word, Excel, etc.)
 * @param {string} mimetype - The MIME type or filename
 * @returns {boolean} - True if it's a document
 */
export const isDocument = (mimetype) => {
  if (!mimetype) return false;
  const type = mimetype.toLowerCase();
  return type.includes('word') || 
         type.includes('document') || 
         type.includes('excel') || 
         type.includes('spreadsheet') ||
         type.includes('powerpoint') ||
         type.includes('presentation') ||
         type.includes('.doc') ||
         type.includes('.docx') ||
         type.includes('.xls') ||
         type.includes('.xlsx') ||
         type.includes('.ppt') ||
         type.includes('.pptx');
};

/**
 * Check if file is a video
 * @param {string} mimetype - The MIME type or filename
 * @returns {boolean} - True if it's a video
 */
export const isVideo = (mimetype) => {
  if (!mimetype) return false;
  const type = mimetype.toLowerCase();
  return type.startsWith('video/') || type.includes('.mp4') || type.includes('.avi') || type.includes('.mov');
};

/**
 * Check if file is an audio file
 * @param {string} mimetype - The MIME type or filename
 * @returns {boolean} - True if it's an audio file
 */
export const isAudio = (mimetype) => {
  if (!mimetype) return false;
  const type = mimetype.toLowerCase();
  return type.startsWith('audio/') || type.includes('.mp3') || type.includes('.wav');
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get appropriate icon for file type
 * @param {string} mimetype - The MIME type or filename
 * @returns {string} - Icon name or class
 */
export const getFileIcon = (mimetype) => {
  if (isImage(mimetype)) return '🖼️';
  if (isPdf(mimetype)) return '📄';
  if (isDocument(mimetype)) return '📝';
  if (isVideo(mimetype)) return '🎥';
  if (isAudio(mimetype)) return '🎵';
  if (mimetype && (mimetype.includes('text/') || mimetype.includes('.txt'))) return '📄';
  
  return '📎';
};

/**
 * Check if file can be previewed in browser
 * @param {string} mimetype - The MIME type or filename
 * @returns {boolean} - True if file can be previewed
 */
export const canPreviewInBrowser = (mimetype) => {
  return isImage(mimetype) || isPdf(mimetype) || isVideo(mimetype) || isAudio(mimetype);
};

/**
 * Get Cloudinary transformation options for different file types
 * @param {string} mimetype - The MIME type
 * @param {Object} options - Additional options
 * @returns {Object} - Transformation options
 */
export const getCloudinaryTransformOptions = (mimetype, options = {}) => {
  const baseOptions = {
    fetch_format: 'auto',
    quality: 'auto'
  };

  if (isImage(mimetype)) {
    return {
      ...baseOptions,
      ...options,
      crop: 'scale',
      width: options.width || 'auto',
      height: options.height || 'auto'
    };
  }

  if (isPdf(mimetype)) {
    return {
      ...baseOptions,
      ...options,
      flags: 'attachment'
    };
  }

  return baseOptions;
};

/**
 * Download a file handling API URLs that require Authorization
 * - For Cloudinary and public URLs: open in new tab
 * - For backend API URLs: fetch with auth and trigger blob download
 * @param {string} url
 * @param {string} filename
 */
/**
 * Download a file handling API URLs that require Authorization
 * - For Cloudinary and public URLs: open in new tab
 * - For backend API URLs: fetch with auth and trigger blob download
 * @param {Object} file - File object containing url, cloudinaryId, filename
 */
export const downloadFile = async (file) => {
  try {
    const url = getCorrectFileUrl(file);
    if (!url) {
      console.error('No file URL found for download', file);
      return;
    }

    let response = await fetch(url);
    if (!response.ok) {
      // Attempt Cloudinary proxy or private download if cloudinaryId exists
      if (file?.cloudinaryId) {
        const token = localStorage.getItem('token');
        const urlObj = new URL(url);
        const path = urlObj.pathname || '';
        const extMatch = path.match(/\.([a-z0-9]+)(?:$|[?#])/i);
        const format = extMatch ? extMatch[1] : undefined;

        // Proxy download attempt
        const proxyUrl = `http://localhost:4000/api/upload/proxy?publicId=${encodeURIComponent(file.cloudinaryId)}&resourceType=raw${format ? `&format=${encodeURIComponent(format)}` : ''}`;
        let proxyResp = await fetch(proxyUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });

        if (proxyResp.ok) {
          response = proxyResp;
        } else {
          // Private download fallback
          const dlUrl = `http://localhost:4000/api/upload/private-download?publicId=${encodeURIComponent(file.cloudinaryId)}&resourceType=raw${format ? `&format=${encodeURIComponent(format)}` : ''}`;
          const dlResp = await fetch(dlUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
          if (dlResp.ok) {
            const { url: signedUrl } = await dlResp.json();
            response = await fetch(signedUrl);
          } else {
            throw new Error('Unable to fetch file from server');
          }
        }
      } else {
        throw new Error('File not accessible at URL: ' + url);
      }
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = file.filename || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.error('Error downloading file:', err);
  }
};
