import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  Search,
  Image as ImageIcon,
  Tag,
  User,
  BookOpen,
  Calendar,
  X,
  Upload,
  Trash2,
  Link,
  FileText,
  ArrowLeft
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

export default function CourseDoubts() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDoubts: 0
  });
  const [showNewDoubtModal, setShowNewDoubtModal] = useState(false);
  const [newDoubt, setNewDoubt] = useState({
    title: '',
    description: '',
    priority: 'medium',
    tags: '',
    isUrgent: false
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCourse();
    fetchDoubts();
  }, [courseId]);

  // Refetch doubts when filters change
  useEffect(() => {
    fetchDoubts();
  }, [filters, pagination.currentPage]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      } else {
        setError('Failed to fetch course details');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to fetch course details');
    }
  };

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10,
        courseId: courseId,
        ...filters
      });

      const response = await fetch(`http://localhost:4000/api/doubts/student?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDoubts(data.doubts);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching doubts:', error);
      setError('Failed to fetch doubts');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    const newImages = [...selectedImages, ...files];
    setSelectedImages(newImages);

    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreview(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreview(newPreviews);
  };

  const handleSubmitDoubt = async (e) => {
    e.preventDefault();
    
    if (!newDoubt.title || !newDoubt.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('courseId', courseId);
      formData.append('title', newDoubt.title);
      formData.append('description', newDoubt.description);
      formData.append('priority', newDoubt.priority);
      formData.append('tags', newDoubt.tags);
      formData.append('isUrgent', newDoubt.isUrgent);

      // Add images
      selectedImages.forEach((image, index) => {
        formData.append('images', image);
      });

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/doubts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess('Doubt submitted successfully!');
        setNewDoubt({
          title: '',
          description: '',
          priority: 'medium',
          tags: '',
          isUrgent: false
        });
        setSelectedImages([]);
        setImagePreview([]);
        setShowNewDoubtModal(false);
        
        // Refresh doubts list
        fetchDoubts();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit doubt');
      }
    } catch (error) {
      console.error('Error submitting doubt:', error);
      setError('Failed to submit doubt. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteDoubt = async (doubtId) => {
    if (!window.confirm('Are you sure you want to delete this doubt?')) return;

    try {
      const response = await fetch(`http://localhost:4000/api/doubts/${doubtId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchDoubts();
      }
    } catch (error) {
      console.error('Error deleting doubt:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'answered':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'answered':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !course) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Course Doubts
              </h1>
              {course && (
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {course.name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowNewDoubtModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={18} />
            Ask New Doubt
          </button>
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

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search doubts..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="min-w-48">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="answered">Answered</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Doubts List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Loading doubts...</p>
            </div>
          ) : doubts.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No doubts found
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {filters.search || filters.status ? 'Try adjusting your filters' : 'Be the first to ask a question!'}
              </p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Doubts ({pagination.totalDoubts})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {doubts.map(doubt => (
                  <div key={doubt._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {doubt.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doubt.status)}`}>
                            {doubt.status.charAt(0).toUpperCase() + doubt.status.slice(1)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(doubt.priority)}`}>
                            {doubt.priority.charAt(0).toUpperCase() + doubt.priority.slice(1)}
                          </span>
                          {doubt.isUrgent && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                          {doubt.description}
                        </p>
                        
                        {/* Tags */}
                        {doubt.tags && doubt.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {doubt.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Images */}
                        {doubt.images && doubt.images.length > 0 && (
                          <div className="flex gap-2 mb-3">
                            {doubt.images.map((image, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={image.url}
                                  alt={`Doubt image ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Answer */}
                        {doubt.answer && doubt.answer.text && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Instructor Answer
                              </span>
                            </div>
                            <p className="text-blue-800 dark:text-blue-200">
                              {doubt.answer.text}
                            </p>
                            {doubt.answer.attachments && doubt.answer.attachments.length > 0 && (
                              <div className="mt-3">
                                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                  Attachments:
                                </h4>
                                <div className="flex gap-2">
                                  {doubt.answer.attachments.map((attachment, index) => (
                                    <a
                                      key={index}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                      <FileText className="w-4 h-4" />
                                      {attachment.fileName}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            {doubt.answer.links && doubt.answer.links.length > 0 && (
                              <div className="mt-3">
                                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                  Helpful Links:
                                </h4>
                                <div className="flex flex-col gap-1">
                                  {doubt.answer.links.map((link, index) => (
                                    <a
                                      key={index}
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2"
                                    >
                                      <Link className="w-4 h-4" />
                                      {link.title}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(doubt.createdAt)}
                          </span>
                          {doubt.answer && doubt.answer.answeredAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Answered: {formatDate(doubt.answer.answeredAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {doubt.status === 'pending' && (
                          <button
                            onClick={() => deleteDoubt(doubt._id)}
                            className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                        disabled={pagination.currentPage === 1}
                        className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* New Doubt Modal */}
      {showNewDoubtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Submit New Doubt
              </h3>
              <button
                onClick={() => setShowNewDoubtModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitDoubt} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newDoubt.title}
                  onChange={(e) => setNewDoubt(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Brief description of your doubt"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={newDoubt.description}
                  onChange={(e) => setNewDoubt(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Detailed explanation of your doubt"
                  required
                />
              </div>

              {/* Priority and Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={newDoubt.priority}
                    onChange={(e) => setNewDoubt(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={newDoubt.tags}
                    onChange={(e) => setNewDoubt(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., homework, concept, exam"
                  />
                </div>
              </div>

              {/* Urgent Flag */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isUrgent"
                  checked={newDoubt.isUrgent}
                  onChange={(e) => setNewDoubt(prev => ({ ...prev, isUrgent: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="isUrgent" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mark as urgent
                </label>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Images (Optional, max 5)
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload images or drag and drop
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      PNG, JPG, GIF up to 5MB each
                    </span>
                  </label>
                </div>

                {/* Image Previews */}
                {imagePreview.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selected Images:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {imagePreview.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </form>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewDoubtModal(false)}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDoubt}
                disabled={!newDoubt.title || !newDoubt.description || submitting}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Doubt'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
