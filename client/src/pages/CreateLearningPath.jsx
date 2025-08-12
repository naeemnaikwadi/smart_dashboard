import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Upload, Link, FileText, Video, X, Save, BookOpen, Target } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { createLearningPath } from '../services/learningPathService';

const CreateLearningPath = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userRole === 'instructor') {
      fetchInstructorClassrooms();
      
      // Check if course is pre-selected from navigation state
      if (location.state?.selectedCourse) {
        setSelectedCourse(location.state.selectedCourse);
        // Find the classroom for this course
        findClassroomForCourse(location.state.selectedCourse);
      }
    }
  }, [location.state, userRole]);

  useEffect(() => {
    if (selectedClassroom) {
      fetchCoursesForClassroom(selectedClassroom);
    } else {
      setCourses([]);
      if (!location.state?.selectedCourse) {
        setSelectedCourse('');
      }
    }
  }, [selectedClassroom]);

  const loadUserData = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const role = userData.role || localStorage.getItem('userRole');
      setUserRole(role);
      
      if (role !== 'instructor') {
        setError('Only instructors can create learning paths');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
    }
  };

  const findClassroomForCourse = async (courseId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const courseData = await response.json();
        if (courseData.classroom) {
          setSelectedClassroom(courseData.classroom);
        }
      }
    } catch (err) {
      console.error('Error finding classroom for course:', err);
    }
  };

  const fetchInstructorClassrooms = async () => {
    try {
      setError(''); // Clear previous errors
      
      // Get instructor ID from localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const instructorId = userData._id || userData.id || localStorage.getItem('userId');
      
      if (!instructorId) {
        setError('Unable to identify instructor');
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }
      
      console.log('Fetching classrooms for instructor ID:', instructorId);
      
      // Get instructor's own classrooms
      const response = await fetch(`http://localhost:4000/api/classrooms/instructor/${instructorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Instructor classrooms response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        setClassrooms(data);
        console.log('Instructor classrooms loaded:', data);
      } else {
        const errorText = await response.text();
        console.error('Failed to load instructor classrooms:', response.status, errorText);
        
        // Fallback: try to get all classrooms
        console.log('Trying fallback to get all classrooms...');
        const fallbackResponse = await fetch('http://localhost:4000/api/classrooms', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setClassrooms(fallbackData);
          console.log('Fallback classrooms loaded:', fallbackData);
        } else {
          const fallbackErrorText = await fallbackResponse.text();
          console.error('Failed to load fallback classrooms:', fallbackResponse.status, fallbackErrorText);
          setError(`Failed to load classrooms: ${fallbackResponse.status} - ${fallbackErrorText}`);
        }
      }
    } catch (err) {
      console.error('Error fetching classrooms:', err);
      setError(`Failed to load classrooms: ${err.message}`);
    }
  };

  const fetchCoursesForClassroom = async (classroomId) => {
    try {
      setError(''); // Clear previous errors
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }
      
      console.log('Fetching courses for classroom ID:', classroomId);
      
      const response = await fetch(`http://localhost:4000/api/courses/classroom/${classroomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Courses for classroom response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
        console.log('Courses for classroom loaded:', data);
      } else {
        const errorText = await response.text();
        console.error('Failed to load courses for classroom:', response.status, errorText);
        setError(`Failed to load courses: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(`Failed to load courses: ${err.message}`);
    }
  };

  const addResource = () => {
    setResources([...resources, { 
      title: '', 
      type: 'link', 
      link: '', 
      uploadedFile: '',
      description: ''
    }]);
  };

  const removeResource = (index) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const updateResource = (index, field, value) => {
    const updatedResources = [...resources];
    updatedResources[index][field] = value;
    setResources(updatedResources);
  };

  const handleFileUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:4000/api/upload/single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        updateResource(index, 'uploadedFile', result.filename);
        updateResource(index, 'type', getFileType(file.name));
        updateResource(index, 'title', file.name);
      } else {
        setError('Failed to upload file');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file');
    }
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return 'video';
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return 'pdf';
    return 'link';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !description || !selectedCourse) {
      setError('Please fill in all required fields including course selection');
      return;
    }

    if (resources.length === 0) {
      setError('Please add at least one learning resource');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const learningPathData = {
        title,
        description,
        estimatedTime: parseInt(estimatedTime) || 0,
        resources: resources.filter(r => r.title && (r.link || r.uploadedFile)),
        courseId: selectedCourse
      };

      const response = await createLearningPath(learningPathData);
      
      if (response.success) {
        setSuccess('Learning path created successfully!');
        setTimeout(() => {
          navigate('/learning-paths');
        }, 2000);
      } else {
        setError(response.message || 'Failed to create learning path');
      }
    } catch (err) {
      console.error('Error creating learning path:', err);
      setError('Failed to create learning path');
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== 'instructor') {
    return (
      <DashboardLayout role={userRole}>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Only instructors can create learning paths.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="instructor">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Learning Path
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Design a structured learning journey with educational resources
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Debug Info:</h3>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>User Role: {userRole}</div>
              <div>Total Classrooms: {classrooms.length}</div>
              <div>Total Courses: {courses.length}</div>
              <div>Selected Classroom: {selectedClassroom}</div>
              <div>Selected Course: {selectedCourse}</div>
              <div>Classrooms: {classrooms.map(c => c.name).join(', ')}</div>
              <div>Courses: {courses.map(c => c.name).join(', ')}</div>
            </div>
            <div className="mt-3 space-x-2">
              <button
                onClick={fetchInstructorClassrooms}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Reload Classrooms
              </button>
              <button
                onClick={() => selectedClassroom && fetchCoursesForClassroom(selectedClassroom)}
                className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                disabled={!selectedClassroom}
              >
                Reload Courses
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Selection */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Course Selection
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Classroom Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Classroom *
                </label>
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Choose a classroom</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom._id} value={classroom._id}>
                      {classroom.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Course *
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  disabled={!selectedClassroom}
                >
                  <option value="">Choose a course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name}
                    </option>
                  ))}
                </select>
                {!selectedClassroom && (
                  <p className="text-sm text-gray-500 mt-1">
                    Please select a classroom first
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Learning Path Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter learning path title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Describe the learning path objectives and content"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Estimated completion time in minutes"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Learning Resources */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Link className="w-5 h-5 text-blue-600" />
                Learning Resources *
              </h2>
              <button
                type="button"
                onClick={addResource}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Resource
              </button>
            </div>

            {resources.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Link className="w-12 h-12 mx-auto mb-2" />
                <p>No resources added yet. Click "Add Resource" to get started.</p>
              </div>
            )}

            <div className="space-y-4">
              {resources.map((resource, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Resource {index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeResource(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={resource.title}
                        onChange={(e) => updateResource(index, 'title', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Resource title"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Type
                      </label>
                      <select
                        value={resource.type}
                        onChange={(e) => updateResource(index, 'type', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="link">Link</option>
                        <option value="pdf">PDF</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={resource.description}
                      onChange={(e) => updateResource(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Brief description of this resource"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {resource.type === 'link' ? 'URL' : 'File Upload'}
                    </label>
                    {resource.type === 'link' ? (
                      <input
                        type="url"
                        value={resource.link}
                        onChange={(e) => updateResource(index, 'link', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="https://example.com/resource"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(e, index)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          accept={resource.type === 'pdf' ? '.pdf,.doc,.docx,.txt' : '.mp4,.avi,.mov,.wmv'}
                        />
                        {resource.uploadedFile && (
                          <span className="text-sm text-green-600">
                            ✓ {resource.uploadedFile}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/learning-paths')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Learning Path
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateLearningPath;
