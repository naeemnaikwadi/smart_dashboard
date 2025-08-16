import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Filter,
  Search,
  Eye,
  MessageSquare,
  Tag,
  User,
  BookOpen,
  Users,
  Calendar,
  Upload,
  X,
  Link,
  Plus,
  FileText,
  Image
} from 'lucide-react';

export default function InstructorDoubts() {
  const navigate = useNavigate();
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [filters, setFilters] = useState({
    courseId: '',
    classroomId: '',
    status: '',
    priority: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDoubts: 0
  });
  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState({ url: '', title: '' });
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchClassrooms();
    fetchDoubts();
  }, [filters, pagination.currentPage]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/instructor/courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const response = await fetch('/api/instructor/classrooms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setClassrooms(data.classrooms || []);
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
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

      const response = await fetch(`/api/doubts/instructor?${queryParams}`, {
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
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      alert('Maximum 5 files allowed');
      return;
    }
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addLink = () => {
    if (newLink.url.trim()) {
      setLinks(prev => [...prev, { ...newLink, id: Date.now() }]);
      setNewLink({ url: '', title: '' });
    }
  };

  const removeLink = (id) => {
    setLinks(prev => prev.filter(link => link.id !== id));
  };

  const handleAnswerDoubt = async () => {
    if (!answerText.trim()) return;

    setSubmittingAnswer(true);
    try {
      const formData = new FormData();
      formData.append('answer', answerText);
      
      // Add files
      selectedFiles.forEach(file => {
        formData.append('attachments', file);
      });

      // Add links
      if (links.length > 0) {
        formData.append('links', JSON.stringify(links.map(({ id, ...link }) => link)));
      }

      const response = await fetch(`http://localhost:4000/api/doubts/${selectedDoubt._id}/answer`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        setShowAnswerModal(false);
        setAnswerText('');
        setSelectedFiles([]);
        setLinks([]);
        setSelectedDoubt(null);
        fetchDoubts();
      }
    } catch (error) {
      console.error('Error answering doubt:', error);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const updateDoubtStatus = async (doubtId, status) => {
    try {
      const response = await fetch(`/api/doubts/${doubtId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchDoubts();
      }
    } catch (error) {
      console.error('Error updating doubt status:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'answered':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-blue-600" />
            Student Doubts
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and respond to student doubts from your courses
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Classroom Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Classroom
              </label>
              <select
                value={filters.classroomId}
                onChange={(e) => handleFilterChange('classroomId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Classrooms</option>
                {classrooms.map(classroom => (
                  <option key={classroom._id} value={classroom._id}>
                    {classroom.name}
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

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search doubts..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

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
                  : 'Students haven\'t submitted any doubts yet'}
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
                            <User className="w-4 h-4" />
                            {doubt.student?.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {doubt.course?.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {doubt.classroom?.name}
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
                          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Your Answer
                              </span>
                            </div>
                            <p className="text-blue-800 dark:text-blue-200">{doubt.answer.text}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                              Answered on {formatDate(doubt.answer.answeredAt)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedDoubt(doubt);
                            setShowAnswerModal(true);
                          }}
                          disabled={doubt.status === 'resolved'}
                          className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {doubt.status === 'answered' ? 'Edit Answer' : 'Answer'}
                        </button>

                        {doubt.status === 'answered' && (
                          <button
                            onClick={() => updateDoubtStatus(doubt._id, 'resolved')}
                            className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Resolved
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

      {/* Enhanced Answer Modal */}
      {showAnswerModal && selectedDoubt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Answer Doubt: {selectedDoubt.title}
              </h3>
              <button
                onClick={() => {
                  setShowAnswerModal(false);
                  setAnswerText('');
                  setSelectedFiles([]);
                  setLinks([]);
                  setSelectedDoubt(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Answer Text */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Answer *
              </label>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Provide a detailed answer to the student's doubt..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* File Attachments */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Attach Files (Images/PDFs)
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click to upload files or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Images and PDFs up to 10MB each (Max 5 files)
                  </p>
                </label>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Selected Files:
                  </p>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="flex items-center gap-2">
                          {file.type.startsWith('image/') ? (
                            <Image className="w-4 h-4 text-blue-500" />
                          ) : (
                            <FileText className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Links */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add Reference Links
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="Enter URL"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="text"
                  value={newLink.title}
                  onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Link title (optional)"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={addLink}
                  disabled={!newLink.url.trim()}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Added Links */}
              {links.length > 0 && (
                <div className="space-y-2">
                  {links.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="flex items-center gap-2">
                        <Link className="w-4 h-4 text-blue-500" />
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {link.title || link.url}
                        </a>
                      </div>
                      <button
                        onClick={() => removeLink(link.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAnswerModal(false);
                  setAnswerText('');
                  setSelectedFiles([]);
                  setLinks([]);
                  setSelectedDoubt(null);
                }}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAnswerDoubt}
                disabled={!answerText.trim() || submittingAnswer}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors flex items-center gap-2"
              >
                {submittingAnswer ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Submit Answer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
