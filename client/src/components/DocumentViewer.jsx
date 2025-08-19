import React, { useState } from 'react';
import { FileText, Download, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCorrectFileUrl, downloadFile } from '../utils/fileUtils';

const DocumentViewer = ({ documents, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'fullscreen'

  if (!documents || documents.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Documents</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">No documents available to view.</p>
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentDocument = documents[currentIndex];
  const isImage = currentDocument.type?.startsWith('image/') || 
                  currentDocument.filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = currentDocument.type === 'application/pdf' || 
                currentDocument.filename?.match(/\.pdf$/i);
  const isVideo = currentDocument.type?.startsWith('video/') || 
                  currentDocument.filename?.match(/\.(mp4|avi|mov|wmv)$/i);

  const goToPrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : documents.length - 1);
  };

  const goToNext = () => {
    setCurrentIndex(prev => prev < documents.length - 1 ? prev + 1 : 0);
  };

  const downloadDocument = () => {
    downloadFile({
      url: currentDocument.url,
      cloudinaryUrl: currentDocument.cloudinaryUrl,
      originalName: currentDocument.originalName || currentDocument.filename || 'download'
    });
  };

  const renderDocumentContent = () => {
    if (isImage) {
      return (
        <img
          src={getCorrectFileUrl({ url: currentDocument.url || currentDocument.path, cloudinaryUrl: currentDocument.cloudinaryUrl || undefined })}
          alt={currentDocument.originalName || currentDocument.filename}
          className="max-w-full max-h-full object-contain"
        />
      );
    }

    if (isPDF) {
      return (
        <iframe
          src={`${getCorrectFileUrl({ url: currentDocument.url || currentDocument.path, cloudinaryUrl: currentDocument.cloudinaryUrl || undefined })}#toolbar=1&navpanes=1&scrollbar=1`}
          className="w-full h-full border-0"
          title={currentDocument.originalName || currentDocument.filename}
        />
      );
    }

    if (isVideo) {
      return (
        <video
          controls
          className="max-w-full max-h-full"
          src={getCorrectFileUrl({ url: currentDocument.url || currentDocument.path, cloudinaryUrl: currentDocument.cloudinaryUrl || undefined })}
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    // For other document types, show a preview with download option
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <FileText className="w-24 h-24 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {currentDocument.originalName || currentDocument.filename}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This document type cannot be previewed. Please download to view.
        </p>
        <button
          onClick={downloadDocument}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Document
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl max-h-[90vh] w-full mx-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Document Viewer
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'preview' ? 'fullscreen' : 'preview')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={viewMode === 'preview' ? 'Enter Fullscreen' : 'Exit Fullscreen'}
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={downloadDocument}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Download Document"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Navigation */}
        {documents.length > 1 && (
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <button
              onClick={goToPrevious}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {currentIndex + 1} of {documents.length}: {currentDocument.originalName || currentDocument.filename}
            </div>
            
            <button
              onClick={goToNext}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Document Content */}
        <div className="p-4 h-[calc(90vh-120px)] overflow-auto">
          {renderDocumentContent()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <span>
              Type: {currentDocument.type || 'Unknown'}
            </span>
            <span>
              Size: {(currentDocument.size / 1024 / 1024).toFixed(2)} MB
            </span>
            <span>
              Uploaded: {new Date(currentDocument.uploadedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
