import React, { useState } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  FileText, 
  Image, 
  Video, 
  Music,
  File
} from 'lucide-react';
import { 
  isImage, 
  isPdf, 
  isVideo, 
  isAudio, 
  isDocument,
  getFileIcon,
  formatFileSize,
  getCorrectFileUrl,
  downloadFile
} from '../utils/fileUtils';

const FileViewer = ({ file, isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);

  if (!file) return null;

  const handleDownload = () => {
    downloadFile(file);
  };

  const handleOpenInNewTab = () => {
    const url = getCorrectFileUrl(file);
    window.open(url, '_blank');
  };

  const renderFileContent = () => {
    const fileUrl = getCorrectFileUrl(file);
    const fileType = file.mimetype || file.fileType;

    if (isImage(fileType)) {
      return (
        <div className="flex justify-center">
          <img
            src={fileUrl}
            alt={file.filename || file.originalName}
            className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load image');
            }}
          />
        </div>
      );
    }

    if (isPdf(fileType)) {
      const tryLoadBlob = async () => {
        try {
          const variants = [fileUrl];
          if (fileUrl.includes('/raw/upload/')) {
            variants.push(fileUrl.replace('/raw/upload/', '/image/upload/'));
          } else if (fileUrl.includes('/image/upload/')) {
            variants.push(fileUrl.replace('/image/upload/', '/raw/upload/'));
          }
          for (const variant of variants) {
            try {
              const resp = await fetch(variant, { method: 'GET' });
              if (resp.ok) {
                const b = await resp.blob();
                const u = window.URL.createObjectURL(b);
                setBlobUrl(u);
                setIsLoading(false);
                setError(null);
                return;
              }
            } catch (e) {
              // try next
            }
          }
        } catch (e) {
          // ignore
        }
      };
      return (
        <div className="w-full h-96">
          {fileUrl.includes('res.cloudinary.com') ? (
            <div className="w-full h-full">
              <iframe
                src={`${(blobUrl || fileUrl)}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full border-0 rounded-lg"
                title={file.filename || file.originalName}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  // Try blob fallback before showing error
                  tryLoadBlob();
                }}
              />
              <div className="mt-2 text-center">
                <p className="text-sm text-gray-600 mb-2">If PDF doesn't load, try opening in new tab:</p>
                <button
                  onClick={handleOpenInNewTab}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Open PDF in New Tab
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <FileText className="w-16 h-16 text-gray-400" />
              <p className="text-gray-600">PDF preview not available</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          )}
        </div>
      );
    }

    if (isVideo(fileType)) {
      return (
        <div className="flex justify-center">
          <video
            controls
            className="max-w-full max-h-96 rounded-lg shadow-lg"
            onLoadStart={() => setIsLoading(true)}
            onLoadedData={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load video');
            }}
          >
            <source src={fileUrl} type={fileType} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (isAudio(fileType)) {
      return (
        <div className="flex justify-center">
          <audio
            controls
            className="w-full max-w-md"
            onLoadStart={() => setIsLoading(true)}
            onLoadedData={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load audio');
            }}
          >
            <source src={fileUrl} type={fileType} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    if (isDocument(fileType)) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <File className="w-16 h-16 text-gray-400" />
          <p className="text-gray-600">Document preview not available</p>
          <div className="flex space-x-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={handleOpenInNewTab}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open</span>
            </button>
          </div>
        </div>
      );
    }

    // Default fallback
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <File className="w-16 h-16 text-gray-400" />
        <p className="text-gray-600">File preview not available</p>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Download File</span>
        </button>
      </div>
    );
  };

  const renderFileInfo = () => {
    const fileUrl = file.url || file.path || file.cloudinaryUrl;
    const fileName = file.filename || file.originalName;
    const fileSize = file.size || file.fileSize;
    const fileType = file.mimetype || file.fileType;

    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <span className="text-2xl">{getFileIcon(fileType)}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{fileName}</h3>
            <p className="text-sm text-gray-500">{fileType}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Size:</span>
            <span className="ml-2 text-gray-900">{formatFileSize(fileSize)}</span>
          </div>
          <div>
            <span className="text-gray-500">Type:</span>
            <span className="ml-2 text-gray-900">{fileType}</span>
          </div>
        </div>

        {fileUrl && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">File URL:</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={fileUrl}
                readOnly
                className="flex-1 text-xs p-2 bg-white border border-gray-300 rounded"
              />
              <button
                onClick={() => navigator.clipboard.writeText(fileUrl)}
                className="px-2 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                title="Copy URL"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            File Preview: {file.filename || file.originalName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {renderFileInfo()}
          
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Download Instead
              </button>
            </div>
          )}

          {!isLoading && !error && renderFileContent()}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            
            {file.url && (
              <button
                onClick={handleOpenInNewTab}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in New Tab</span>
              </button>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
