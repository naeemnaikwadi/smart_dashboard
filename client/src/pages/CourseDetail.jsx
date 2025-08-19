import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentUser, getAuthHeaders, getFileUploadHeaders } from '../utils/auth';
import { getCorrectFileUrl, formatFileSize, getFileIcon, downloadFile } from '../utils/fileUtils';
import { uploadCourseMaterial } from '../utils/cloudinaryUpload';
import DashboardLayout from '../components/DashboardLayout';
import CourseRating from '../components/CourseRating';
import FileViewer from '../components/FileViewer';
import Toast from '../components/Toast';
import { MessageCircle, Plus } from 'lucide-react';

const CourseDetail = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('materials');
  
  // Material upload states
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState('pdf');
  const [materialFile, setMaterialFile] = useState(null);
  const [materialUrl, setMaterialUrl] = useState('');
  
  // Live session states
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [sessionDuration, setSessionDuration] = useState(60);

  // File viewer state
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFileViewer, setShowFileViewer] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const currentUser = getCurrentUser();
  const isInstructor = currentUser?.role === 'instructor';

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/courses/${courseId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      } else {
        throw new Error('Failed to fetch course');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      let url = materialUrl;
      let fileName = '';
      let fileSize = 0;
      let cloudinaryId = '';
      let cloudinaryUrl = '';
      let detectedType = materialType;

      // Handle file upload for non-link materials
      if (materialType !== 'link' && materialFile) {
        // Auto-detect file type using filename and MIME type
        const fileExtension = materialFile.name.toLowerCase();
        if (materialFile.type.startsWith('image/') || fileExtension.includes('.jpg') || fileExtension.includes('.jpeg') || fileExtension.includes('.png') || fileExtension.includes('.gif')) {
          detectedType = 'image';
        } else if (materialFile.type === 'application/pdf' || fileExtension.includes('.pdf')) {
          detectedType = 'pdf';
        } else if (materialFile.type.includes('word') || materialFile.type.includes('document') || fileExtension.includes('.doc') || fileExtension.includes('.docx')) {
          detectedType = 'document';
        } else if (materialFile.type.includes('excel') || materialFile.type.includes('spreadsheet') || fileExtension.includes('.xls') || fileExtension.includes('.xlsx')) {
          detectedType = 'spreadsheet';
        } else if (materialFile.type.includes('powerpoint') || materialFile.type.includes('presentation') || fileExtension.includes('.ppt') || fileExtension.includes('.pptx')) {
          detectedType = 'presentation';
        } else if (materialFile.type.startsWith('video/') || fileExtension.includes('.mp4') || fileExtension.includes('.avi') || fileExtension.includes('.mov')) {
          detectedType = 'video';
        } else if (materialFile.type.startsWith('audio/') || fileExtension.includes('.mp3') || fileExtension.includes('.wav')) {
          detectedType = 'audio';
        } else if (fileExtension.includes('.txt')) {
          detectedType = 'text';
        } else {
          detectedType = 'other';
        }

        // Upload directly to Cloudinary using the utility (with server fallback)
        const uploadResult = await uploadCourseMaterial(materialFile);
        cloudinaryUrl = uploadResult.cloudinaryUrl;
        url = cloudinaryUrl;
        fileName = uploadResult.originalName || materialFile.name;
        fileSize = uploadResult.size || materialFile.size;
        cloudinaryId = uploadResult.cloudinaryId;
      }

      // Add material to course
      const response = await fetch(`http://localhost:4000/api/courses/${courseId}/materials`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: materialTitle,
          type: detectedType,
          url,
          fileName,
          fileSize,
          cloudinaryId,
          cloudinaryUrl,
          isCloudinary: true
        })
      });

      if (response.ok) {
        setSuccess('Material uploaded successfully to Cloudinary!');
        setMaterialTitle('');
        setMaterialFile(null);
        setMaterialUrl('');
        setShowMaterialForm(false);
        fetchCourse(); // Refresh course data
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to upload material');
      }
    } catch (error) {
      console.error('Error uploading material:', error);
      setError(error.message || 'Failed to upload material');
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        const response = await fetch(`http://localhost:4000/api/courses/${courseId}/materials/${materialId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (response.ok) {
          setSuccess('Material deleted successfully!');
          fetchCourse();
        } else {
          throw new Error('Failed to delete material');
        }
      } catch (error) {
        console.error('Error deleting material:', error);
        setError('Failed to delete material');
      }
    }
  };

  const handleCreateLiveSession = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const scheduledAt = new Date(`${sessionDate}T${sessionTime}`);
      
      const response = await fetch(`http://localhost:4000/api/courses/${courseId}/live-sessions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: sessionTitle,
          description: sessionDescription,
          scheduledAt: scheduledAt.toISOString(),
          duration: sessionDuration
        })
      });

      if (response.ok) {
        setSuccess('Live session created successfully!');
        setSessionTitle('');
        setSessionDescription('');
        setSessionDate('');
        setSessionTime('');
        setSessionDuration(60);
        setShowSessionForm(false);
        fetchCourse();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create live session');
      }
    } catch (error) {
      console.error('Error creating live session:', error);
      setError('Failed to create live session');
    }
  };

  const handleDeleteLiveSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this live session?')) {
      try {
        const response = await fetch(`http://localhost:4000/api/courses/${courseId}/live-sessions/${sessionId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (response.ok) {
          setSuccess('Live session deleted successfully!');
          fetchCourse();
        } else {
          throw new Error('Failed to delete live session');
        }
      } catch (error) {
        console.error('Error deleting live session:', error);
        setError('Failed to delete live session');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileType = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(extension)) return 'word';
    if (['xls', 'xlsx'].includes(extension)) return 'excel';
    if (['ppt', 'pptx'].includes(extension)) return 'powerpoint';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(extension)) return 'audio';
    return 'document';
  };

  if (loading) {
    return (
      <DashboardLayout role={currentUser?.role}>
        <div className="p-6 max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading course details...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={currentUser?.role}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-indigo-900 dark:text-white">
              {course?.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {course?.description}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Classroom: {course?.classroom?.name} | Instructor: {course?.instructor?.name}
            </p>
          </div>
          <div className="flex gap-3">
            {!isInstructor && (
              <button
                onClick={() => navigate(`/course/${courseId}/doubts`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <MessageCircle size={18} />
                Ask Doubt
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Back
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('materials')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'materials'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Materials
            </button>
            <button
              onClick={() => setActiveTab('live-sessions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'live-sessions'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Live Sessions
            </button>
            <button
              onClick={() => setActiveTab('learning-paths')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'learning-paths'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Learning Paths
            </button>
            {/* Ratings tab remains accessible from course page only; removed from layout */}
            <button
              onClick={() => setActiveTab('ratings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ratings'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Ratings & Reviews
            </button>
          </nav>
        </div>

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div>
            {isInstructor && (
              <div className="mb-6">
                <button
                  onClick={() => setShowMaterialForm(!showMaterialForm)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  {showMaterialForm ? 'Cancel' : 'Add Material'}
                </button>
              </div>
            )}

            {/* Material Upload Form */}
            {showMaterialForm && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow mb-6">
                <h3 className="text-xl font-bold mb-4">Add Course Material</h3>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Material Title *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter material title"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={materialTitle}
                      onChange={(e) => setMaterialTitle(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Material Type *
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={materialType}
                      onChange={(e) => setMaterialType(e.target.value)}
                    >
                      <option value="pdf">PDF Document</option>
                      <option value="word">Word Document</option>
                      <option value="excel">Excel Spreadsheet</option>
                      <option value="video">Video File</option>
                      <option value="audio">Audio File</option>
                      <option value="link">External Link/Video URL</option>
                    </select>
                  </div>

                  {materialType === 'link' ? (
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                        URL *
                      </label>
                      <input
                        type="url"
                        placeholder="Enter video/resource URL"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={materialUrl}
                        onChange={(e) => setMaterialUrl(e.target.value)}
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Upload File *
                      </label>
                      <input
                        type="file"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file && file.size > 10 * 1024 * 1024) {
                            alert('File size must be under 10MB for Cloudinary upload. Please choose a smaller file.');
                            e.target.value = '';
                            setMaterialFile(null);
                          } else {
                            setMaterialFile(file);
                          }
                        }}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.mp3,.wav,.txt,.zip,.rar"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum file size: 10MB (Cloudinary free tier limit)
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                    >
                      Upload Material
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMaterialForm(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Materials List */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {course?.materials?.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No materials uploaded yet.</p>
                </div>
              ) : (
                course?.materials?.map((material) => (
                  <div key={material._id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getFileIcon(material.type)}</span>
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-white">
                            {material.title}
                          </h4>
                          <p className="text-sm text-gray-500 capitalize">
                            {material.type} {material.fileSize && `• ${formatFileSize(material.fileSize)}`}
                          </p>
                        </div>
                      </div>
                      {isInstructor && (
                        <button
                          onClick={() => handleDeleteMaterial(material._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {/* Show image preview if it's an image */}
                      {material.type === 'image' ? (
                        <img 
                          src={getCorrectFileUrl({ url: material.url, cloudinaryUrl: material.cloudinaryUrl })} 
                          alt={material.title}
                          className="w-full h-24 sm:h-32 object-cover rounded-lg border"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-24 sm:h-32 bg-gray-100 dark:bg-gray-700 rounded-lg border flex items-center justify-center">
                          <span className="text-2xl sm:text-4xl">
                            {getFileIcon(getFileType(material.fileName || material.title))}
                          </span>
                        </div>
                      )}
                      
                      {/* File type indicator */}
                      <div className="text-xs text-gray-500 mb-2">
                        {material.type === 'link' ? '🔗 External Link' : 
                         material.type === 'pdf' ? '📄 PDF Document' :
                         material.type === 'document' ? '📝 Document' :
                         material.type === 'spreadsheet' ? '📊 Spreadsheet' :
                         material.type === 'presentation' ? '📊 Presentation' :
                         material.type === 'video' ? '🎥 Video File' :
                         material.type === 'audio' ? '🎵 Audio File' :
                         material.type === 'image' ? '🖼️ Image File' :
                         material.type === 'text' ? '📄 Text File' : '📎 File'}
                        {material.fileSize && ` • ${formatFileSize(material.fileSize)}`}
                        
                        {/* Show Cloudinary status */}
                        {material.isCloudinary && (
                          <span className="text-green-600 ml-2">☁️ Cloudinary</span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        {material.type === 'link' ? (
                          <a
                            href={getCorrectFileUrl({ url: material.url, cloudinaryUrl: material.cloudinaryUrl })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center px-4 py-2 rounded-lg"
                          >
                            Open Link
                          </a>
                        ) : material.type === 'image' ? (
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => {
                                setSelectedFile(material);
                                setShowFileViewer(true);
                              }}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center px-4 py-2 rounded-lg"
                            >
                              Preview
                            </button>
                            <a
                              href={getCorrectFileUrl({ url: material.url, cloudinaryUrl: material.cloudinaryUrl })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center px-4 py-2 rounded-lg"
                            >
                              View Full Size
                            </a>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2 w-full">
                                                            <button
                                  onClick={() => {
                                    // Prepare file object with all necessary properties for FileViewer
                                    const fileForViewer = {
                                      ...material,
                                      url: material.cloudinaryUrl || material.url,
                                      path: material.cloudinaryUrl || material.url,
                                      cloudinaryUrl: material.cloudinaryUrl || material.url,
                                      mimetype: material.type === 'pdf' ? 'application/pdf' : 
                                               material.type === 'image' ? 'image/jpeg' :
                                               material.type === 'document' ? 'application/msword' :
                                               material.type === 'spreadsheet' ? 'application/vnd.ms-excel' :
                                               material.type === 'presentation' ? 'application/vnd.ms-powerpoint' :
                                               material.type === 'video' ? 'video/mp4' :
                                               material.type === 'audio' ? 'audio/mpeg' :
                                               'application/octet-stream',
                                      fileType: material.type === 'pdf' ? 'application/pdf' : 
                                               material.type === 'image' ? 'image/jpeg' :
                                               material.type === 'document' ? 'application/msword' :
                                               material.type === 'spreadsheet' ? 'application/vnd.ms-excel' :
                                               material.type === 'presentation' ? 'application/vnd.ms-powerpoint' :
                                               material.type === 'video' ? 'video/mp4' :
                                               material.type === 'audio' ? 'audio/mpeg' :
                                               'application/octet-stream'
                                    };
                                    setSelectedFile(fileForViewer);
                                    setShowFileViewer(true);
                                  }}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center px-3 sm:px-4 py-2 rounded-lg text-sm"
                                >
                                  <span className="hidden sm:inline">Preview</span>
                                  <span className="sm:hidden">👁️</span>
                                </button>
                            <button
                              onClick={() => downloadFile({
                                url: material.url,
                                cloudinaryUrl: material.cloudinaryUrl,
                                originalName: material.title || material.fileName || 'download'
                              })}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center px-3 sm:px-4 py-2 rounded-lg text-sm"
                            >
                              <span className="hidden sm:inline">Download</span>
                              <span className="sm:hidden">📥</span>
                            </button>
                          </div>
                        )}
                        
                        {/* Copy URL button */}
                        <button
                          onClick={async () => {
                            try {
                              const correctedUrl = getCorrectFileUrl({ url: material.url, cloudinaryUrl: material.cloudinaryUrl });
                              await navigator.clipboard.writeText(correctedUrl);
                              setToast({ show: true, message: 'URL copied to clipboard!', type: 'success' });
                            } catch (err) {
                              setToast({ show: true, message: 'Failed to copy URL', type: 'error' });
                            }
                          }}
                          className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                          title="Copy URL"
                        >
                          📋
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-400">
                        Uploaded: {formatDate(material.uploadedAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Live Sessions Tab */}
        {activeTab === 'live-sessions' && (
          <div>
            {isInstructor && (
              <div className="mb-6">
                <button
                  onClick={() => setShowSessionForm(!showSessionForm)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  {showSessionForm ? 'Cancel' : 'Create Live Session'}
                </button>
              </div>
            )}

            {/* Live Session Form */}
            {showSessionForm && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow mb-6">
                <h3 className="text-xl font-bold mb-4">Create Live Session</h3>
                <form onSubmit={handleCreateLiveSession} className="space-y-4">
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Session Title *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter session title"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={sessionTitle}
                      onChange={(e) => setSessionTitle(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      placeholder="Enter session description"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={sessionDescription}
                      onChange={(e) => setSessionDescription(e.target.value)}
                      rows="3"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Time *
                      </label>
                      <input
                        type="time"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={sessionTime}
                        onChange={(e) => setSessionTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="480"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={sessionDuration}
                      onChange={(e) => setSessionDuration(parseInt(e.target.value))}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                    >
                      Create Session
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSessionForm(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Live Sessions List */}
            <div className="space-y-4">
              {course?.liveSessions?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No live sessions scheduled yet.</p>
                </div>
              ) : (
                course?.liveSessions?.map((session) => (
                  <div key={session._id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-3">🎥</span>
                          <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
                            {session.title}
                          </h4>
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                            session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            session.status === 'live' ? 'bg-green-100 text-green-800' :
                            session.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                        
                        {session.description && (
                          <p className="text-gray-600 dark:text-gray-300 mb-3">
                            {session.description}
                          </p>
                        )}
                        
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>📅 {formatDate(session.scheduledAt)}</p>
                          <p>⏱️ Duration: {session.duration} minutes</p>
                          <p>🏠 Room: {session.roomName}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        {session.status === 'scheduled' && (
                          <button
                            onClick={() => navigate(`/live-session/${session.roomName}`)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                          >
                            Join Session
                          </button>
                        )}
                        {isInstructor && (
                          <button
                            onClick={() => handleDeleteLiveSession(session._id)}
                            className="text-red-600 hover:text-red-800 p-2"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Learning Paths Tab */}
        {activeTab === 'learning-paths' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                Learning Paths
              </h3>
              {isInstructor && (
                <button
                  onClick={() => navigate('/create-learning-path', { state: { selectedCourse: courseId } })}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Plus size={18} />
                  Create Learning Path
                </button>
              )}
            </div>
            
            {/* Learning Paths List */}
            <div className="space-y-4">
              {course?.learningPaths?.length > 0 ? (
                course.learningPaths.map((path) => (
                  <div key={path._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                          {path.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                          {path.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>📚 {path.totalSteps || 0} steps</span>
                          <span>⏱️ {path.estimatedTotalTime || 0} min</span>
                          <span>👥 {path.learners?.length || 0} learners</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!isInstructor && (
                          <button
                            onClick={() => navigate(`/learning-session/${path._id}`)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                          >
                            Start Learning
                          </button>
                        )}
                        {isInstructor && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/learning-session/${path._id}`)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
                            >
                              Manage Quizzes
                            </button>
                            <button
                              onClick={() => navigate(`/edit-learning-path/${path._id}`)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No learning paths created yet for this course.</p>
                  {isInstructor && (
                    <p className="mt-2">Click "Create Learning Path" to build a step-by-step learning journey for your students.</p>
                  )}
                  {!isInstructor && (
                    <p className="mt-2">Your instructor will create learning paths for this course soon.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ratings Tab */}
        {activeTab === 'ratings' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
              Course Ratings & Reviews
            </h3>
            <CourseRating 
              courseId={courseId} 
              onRatingChange={(newRating) => {
                // Optionally update course data when rating changes
                console.log('Rating updated:', newRating);
              }}
            />
          </div>
        )}
      </div>

      {/* File Viewer Modal */}
      {showFileViewer && selectedFile && (
        <FileViewer
          file={selectedFile}
          onClose={() => setShowFileViewer(false)}
        />
      )}

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </DashboardLayout>
  );
};

export default CourseDetail;

