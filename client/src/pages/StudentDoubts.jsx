import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  FileText
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

export default function StudentDoubts() {
  const navigate = useNavigate();
  const location = useLocation();
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({
    courseId: '',
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
    courseId: '',
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

  // Check if we have course context from navigation
  const courseContext = location.state;

  useEffect(() => {
    fetchCourses();
    fetchDoubts();
    
    // Pre-select course if coming from a specific course
    if (courseContext?.courseId) {
      setNewDoubt(prev => ({ ...prev, courseId: courseContext.courseId }));
      // Also set the filter to show only doubts for this course
      setFilters(prev => ({ ...prev, courseId: courseContext.courseId }));
    }
  }, [courseContext]);

  // Refetch doubts when filters change
  useEffect(() => {
    fetchDoubts();
  }, [filters, pagination.currentPage]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/courses/enrolled', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data || []);
      } else {
        console.error('Failed to fetch courses:', response.status);
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10,
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
    
    // Ensure courseId is set when coming from course context
    const doubtData = {
      ...newDoubt,
      courseId: courseContext?.courseId || newDoubt.courseId
    };

    console.log('Submitting doubt with data:', doubtData);
    console.log('Course context:', courseContext);

    if (!doubtData.courseId || !doubtData.title || !doubtData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('courseId', doubtData.courseId);
      formData.append('title', doubtData.title);
      formData.append('description', doubtData.description);
      formData.append('priority', doubtData.priority);
      formData.append('tags', doubtData.tags);
      formData.append('isUrgent', doubtData.isUrgent);

      // Add images
      selectedImages.forEach((image, index) => {
        formData.append('images', image);
      });

      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);

      const response = await fetch('http://localhost:4000/api/doubts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Doubt submitted successfully:', result);
        setSuccess('Doubt submitted successfully!');
        setNewDoubt({
          courseId: courseContext?.courseId || '',
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
        console.error('Doubt submission failed:', errorData);
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
      const response = await fetch(`/api/doubts/${doubtId}`, {
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Doubts
            </h1>
            {courseContext?.courseName && (
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Showing doubts for: <span className="font-semibold">{courseContext.courseName}</span>
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, courseId: '' }));
                    setNewDoubt(prev => ({ ...prev, courseId: '' }));
                  }}
                  className="ml-3 text-blue-600 hover:text-blue-700 text-sm underline"
                >
                  (Clear filter)
                </button>
              </p>
            )}
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
        {!courseContext?.courseId && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Course Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course
                </label>
                <select
                  value={filters.courseId}
                  onChange={(e) => handleFilterChange('courseId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {typeof course.name === 'string' ? course.name : 'Unknown Course'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="answered">Answered</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search doubts..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Doubts List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading doubts...</p>
            </div>
          ) : doubts.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No doubts found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {Object.values(filters).some(f => f) 
                  ? 'Try adjusting your filters' 
                  : 'You haven\'t submitted any doubts yet. Click "New Doubt" to get started!'}
              </p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Doubts ({pagination.totalDoubts})
                  </h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {doubts.map((doubt) => (
                  <div key={doubt._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(doubt.status)}
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            {doubt.title}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(doubt.priority)}`}>
                            {doubt.priority}
                          </span>
                          {doubt.isUrgent && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              Urgent
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {doubt.description}
                        </p>

                        <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {typeof doubt.course === 'object' ? doubt.course.name : doubt.course}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {typeof doubt.classroom === 'object' ? doubt.classroom.name : doubt.classroom}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(doubt.createdAt)}
                          </div>
                        </div>

                        {doubt.tags && doubt.tags.length > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            <Tag className="w-4 h-4 text-gray-400" />
                            {doubt.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {doubt.images && doubt.images.length > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Attachments:</span>
                            <div className="flex gap-2">
                              {doubt.images.map((image, index) => (
                                <img
                                  key={index}
                                  src={`http://localhost:4000${image.url}`}
                                  alt={image.fileName}
                                  className="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-600"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {doubt.answer && (
                          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                Instructor's Answer
                              </span>
                            </div>
                            <p className="text-green-800 dark:text-green-200 mb-3">{doubt.answer.text}</p>
                            
                            {/* Answer Attachments */}
                            {doubt.answer.attachments && doubt.answer.attachments.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Attachments:</p>
                                <div className="flex flex-wrap gap-2">
                                  {doubt.answer.attachments.map((attachment, index) => (
                                    <a
                                      key={index}
                                      href={`http://localhost:4000${attachment.url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-green-200 dark:border-green-600 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
                                    >
                                      {attachment.fileType?.startsWith('image/') ? (
                                        <ImageIcon className="w-4 h-4 text-blue-500" />
                                      ) : (
                                        <FileText className="w-4 h-4 text-red-500" />
                                      )}
                                      <span className="text-sm text-green-700 dark:text-green-300">{attachment.fileName}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Answer Links */}
                            {doubt.answer.links && doubt.answer.links.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Reference Links:</p>
                                <div className="space-y-2">
                                  {doubt.answer.links.map((link, index) => (
                                    <a
                                      key={index}
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                      <Link className="w-4 h-4" />
                                      {link.title || link.url}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            <p className="text-xs text-green-600 dark:text-green-300 mt-2">
                              Answered by {typeof doubt.answer.instructor === 'object' ? doubt.answer.instructor.name : doubt.answer.instructor} on {formatDate(doubt.answer.answeredAt)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {doubt.status === 'pending' && (
                          <button
                            onClick={() => deleteDoubt(doubt._id)}
                            className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                          >
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
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                      disabled={!pagination.hasPrev}
                      className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
                    >
                      Previous
                    </button>
                    
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                      disabled={!pagination.hasNext}
                      className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
                    >
                      Next
                    </button>
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
              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course *
                </label>
                {courseContext?.courseId ? (
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md border border-gray-300 dark:border-gray-600">
                    {courseContext.courseName}
                  </div>
                ) : (
                  <select
                    required
                    value={newDoubt.courseId}
                    onChange={(e) => setNewDoubt(prev => ({ ...prev, courseId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course._id} value={course._id}>
                        {typeof course.name === 'string' ? course.name : 'Unknown Course'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newDoubt.title}
                  onChange={(e) => setNewDoubt(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief title for your doubt"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
                  placeholder="Detailed description of your doubt..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Priority and Urgent */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={newDoubt.priority}
                    onChange={(e) => setNewDoubt(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isUrgent"
                    checked={newDoubt.isUrgent}
                    onChange={(e) => setNewDoubt(prev => ({ ...prev, isUrgent: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isUrgent" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Mark as Urgent
                  </label>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newDoubt.tags}
                  onChange={(e) => setNewDoubt(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., math, algebra, homework"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Attach Images (Max 5)
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
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload images or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      PNG, JPG, GIF up to 5MB each
                    </p>
                  </label>
                </div>

                {/* Image Previews */}
                {imagePreview.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selected Images:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {imagePreview.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-20 h-20 object-cover rounded border border-gray-200 dark:border-gray-600"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
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
                disabled={!newDoubt.courseId || !newDoubt.title || !newDoubt.description || submitting}
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
