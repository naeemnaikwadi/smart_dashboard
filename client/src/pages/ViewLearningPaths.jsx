import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Users, Play, CheckCircle, ArrowRight, FileText, Video, Link, X, Target, Plus, Filter, Eye } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import DocumentViewer from '../components/DocumentViewer';
import { fetchAllLearningPaths, updateProgress } from '../services/learningPathService';

const ViewLearningPaths = () => {
  const navigate = useNavigate();
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPath, setSelectedPath] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  const [allCourses, setAllCourses] = useState([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userRole && userId) {
      loadLearningPaths();
      loadAllCourses();
    }
  }, [userRole, userId]);

  const loadUserData = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const role = userData.role || localStorage.getItem('userRole');
      const id = userData._id || userData.id || localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      console.log('Raw user data from localStorage:', localStorage.getItem('user'));
      console.log('Raw userRole from localStorage:', localStorage.getItem('userRole'));
      console.log('Raw userId from localStorage:', localStorage.getItem('userId'));
      console.log('Raw token from localStorage:', token ? 'Token exists' : 'No token');
      
      if (!role || !id || !token) {
        console.error('Missing required user data:', { role, id, token: !!token });
        setError('Missing user authentication data. Please log in again.');
        return;
      }
      
      setUserRole(role);
      setUserId(id);
      
      console.log('User data loaded successfully:', { role, id, tokenExists: !!token });
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
    }
  };

  const loadAllCourses = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      let coursesData = [];
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }
      
      if (userRole === 'instructor') {
        // For instructors, get their own courses
        try {
          console.log('Fetching instructor courses for ID:', userId);
          const response = await fetch(`http://localhost:4000/api/courses/instructor/${userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('Instructor courses response status:', response.status);
          
          if (response.ok) {
            coursesData = await response.json();
            console.log('Instructor courses loaded:', coursesData);
          } else {
            const errorText = await response.text();
            console.error('Failed to load instructor courses:', response.status, errorText);
            setError(`Failed to load instructor courses: ${response.status} - ${errorText}`);
          }
        } catch (err) {
          console.error('Error loading instructor courses:', err);
          setError(`Error loading instructor courses: ${err.message}`);
        }
      } else if (userRole === 'student') {
        // For students, get courses from classrooms they're enrolled in
        try {
          console.log('Fetching classrooms for student ID:', userId);
          const classroomsResponse = await fetch('http://localhost:4000/api/classrooms', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('Classrooms response status:', classroomsResponse.status);
          
          if (classroomsResponse.ok) {
            const classrooms = await classroomsResponse.json();
            console.log('All classrooms loaded:', classrooms);
            
            const enrolledClassrooms = classrooms.filter(classroom => 
              classroom.students?.some(studentId => studentId.toString() === userId)
            );
            
            console.log('Enrolled classrooms:', enrolledClassrooms);
            
            // Get courses for each enrolled classroom
            for (const classroom of enrolledClassrooms) {
              console.log('Fetching courses for classroom:', classroom._id);
              const coursesResponse = await fetch(`http://localhost:4000/api/courses/classroom/${classroom._id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (coursesResponse.ok) {
                const classroomCourses = await coursesResponse.json();
                coursesData = [...coursesData, ...classroomCourses];
                console.log('Courses for classroom', classroom._id, ':', classroomCourses);
              } else {
                const errorText = await coursesResponse.text();
                console.error('Failed to load courses for classroom:', classroom._id, coursesResponse.status, errorText);
              }
            }
            console.log('Student courses loaded:', coursesData);
          } else {
            const errorText = await classroomsResponse.text();
            console.error('Failed to load classrooms:', classroomsResponse.status, errorText);
            setError(`Failed to load classrooms: ${classroomsResponse.status} - ${errorText}`);
          }
        } catch (err) {
          console.error('Error loading student courses:', err);
          setError(`Error loading student courses: ${err.message}`);
        }
      }
      
      // If no courses loaded from role-specific logic, try to load all courses as fallback
      if (coursesData.length === 0) {
        try {
          console.log('No courses loaded from role-specific logic, trying fallback...');
          const fallbackResponse = await fetch('http://localhost:4000/api/courses', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('Fallback courses response status:', fallbackResponse.status);
          
          if (fallbackResponse.ok) {
            const fallbackCourses = await fallbackResponse.json();
            coursesData = fallbackCourses;
            console.log('Fallback courses loaded:', fallbackCourses);
          } else {
            const errorText = await fallbackResponse.text();
            console.error('Failed to load fallback courses:', fallbackResponse.status, errorText);
            setError(`Failed to load fallback courses: ${fallbackResponse.status} - ${errorText}`);
          }
        } catch (fallbackErr) {
          console.error('Error loading fallback courses:', fallbackErr);
          setError(`Error loading fallback courses: ${fallbackErr.message}`);
        }
      }
      
      setAllCourses(coursesData);
      console.log('Final courses data set:', coursesData);
      
      if (coursesData.length === 0) {
        setError('No courses found. Please check if you have access to any courses or if there are courses in the system.');
      }
    } catch (error) {
      console.error('Error in loadAllCourses:', error);
      setError(`Failed to load courses: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadLearningPaths = async () => {
    try {
      setLoading(true);
      const response = await fetchAllLearningPaths();
      if (response.success) {
        setPaths(response.data || []);
        console.log('Learning paths loaded:', response.data);
      } else {
        setError(response.message || 'Failed to load learning paths');
      }
    } catch (error) {
      console.error('Error loading learning paths:', error);
      setError('Failed to load learning paths');
    } finally {
      setLoading(false);
    }
  };

  const startLearningSession = async (pathId, topic) => {
    try {
      const response = await fetch(`http://localhost:4000/api/learning-paths/${pathId}/start-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ topic })
      });

      if (response.ok) {
        navigate(`/learning-session/${pathId}`);
      } else {
        setError('Failed to start learning session');
      }
    } catch (error) {
      console.error('Error starting learning session:', error);
      setError('Failed to start learning session');
    }
  };

  const getResourceIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'link':
        return <Link className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatTime = (minutes) => {
    if (!minutes) return '0 min';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    if (progress >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getLearningPathsForCourse = (courseId) => {
    if (selectedCourseFilter === 'all' || selectedCourseFilter === courseId) {
      return paths.filter(path => {
        const pathCourseId = typeof path.courseId === 'object' ? path.courseId._id : path.courseId;
        return pathCourseId === courseId;
      });
    }
    return [];
  };

  const getFilteredCourses = () => {
    if (selectedCourseFilter === 'all') {
      return allCourses;
    }
    return allCourses.filter(course => course._id === selectedCourseFilter);
  };

  const viewMaterials = (resources) => {
    // Filter out link resources and only show uploaded files
    const documents = resources.filter(resource => resource.uploadedFile).map(resource => ({
      filename: resource.uploadedFile,
      originalName: resource.title,
      type: resource.type,
      size: 0, // We don't have size info in the current structure
      uploadedAt: new Date() // We don't have upload date in the current structure
    }));
    
    if (documents.length > 0) {
      setSelectedDocuments(documents);
      setShowDocumentViewer(true);
    } else {
      alert('No uploaded materials available for this learning path.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout role={userRole}>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={userRole}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Learning Paths
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {userRole === 'instructor' 
                ? 'Manage and create learning paths for your courses'
                : 'Explore learning paths for your enrolled courses'
              }
            </p>
          </div>
          {userRole === 'instructor' && (
            <button
              onClick={() => navigate('/create-learning-path')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Create Learning Path
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Course Filter */}
        {allCourses.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Courses</option>
                {allCourses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Debug Info:</h3>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>User Role: {userRole}</div>
              <div>User ID: {userId}</div>
              <div>Total Courses: {allCourses.length}</div>
              <div>Total Learning Paths: {paths.length}</div>
              <div>Selected Course Filter: {selectedCourseFilter}</div>
              <div>Courses: {allCourses.map(c => c.name).join(', ')}</div>
            </div>
            <div className="mt-3 space-x-2">
              <button
                onClick={loadAllCourses}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Reload Courses
              </button>
              <button
                onClick={loadLearningPaths}
                className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
              >
                Reload Learning Paths
              </button>
            </div>
          </div>
        )}

        {/* Courses Sections */}
        <div className="space-y-8">
          {getFilteredCourses().length > 0 ? (
            getFilteredCourses().map((course) => {
              const coursePaths = getLearningPathsForCourse(course._id);
              
              return (
                <div key={course._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                  {/* Course Header */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          {course.name}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                          {course.description || 'No description available'}
                        </p>
                      </div>
                      {userRole === 'instructor' && (
                        <button
                          onClick={() => navigate('/create-learning-path', { state: { selectedCourse: course._id } })}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Create Learning Path
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Learning Paths for this Course */}
                  <div className="p-6">
                    {coursePaths.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {coursePaths.map((path) => {
                          const progress = userProgress[path._id]?.overallProgress || 0;
                          const timeSpent = userProgress[path._id]?.timeSpent || 0;
                          
                          return (
                            <div key={path._id} className="bg-gray-50 dark:bg-gray-700 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                              {/* Path Header */}
                              <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {path.title}
                                  </h3>
                                  {progress > 0 && (
                                    <span className={`text-sm font-medium ${getProgressColor(progress)}`}>
                                      {progress}% Complete
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                                  {path.description}
                                </p>
                                
                                {/* Progress Bar */}
                                {progress > 0 && (
                                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${progress}%` }}
                                    ></div>
                                  </div>
                                )}

                                {/* Path Stats */}
                                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatTime(path.estimatedTime)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>{path.resources?.length || 0} resources</span>
                                  </div>
                                </div>
                              </div>

                              {/* Resources Preview */}
                              {path.resources && path.resources.length > 0 && (
                                <div className="p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                      Resources:
                                    </h4>
                                    {path.resources.some(r => r.uploadedFile) && (
                                      <button
                                        onClick={() => viewMaterials(path.resources)}
                                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 transition-colors"
                                      >
                                        <Eye className="w-4 h-4" />
                                        View Materials
                                      </button>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    {path.resources.slice(0, 3).map((resource, index) => (
                                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        {getResourceIcon(resource.type)}
                                        <span className="truncate">{resource.title}</span>
                                        {resource.uploadedFile && (
                                          <span className="text-green-600 text-xs">✓ Uploaded</span>
                                        )}
                                      </div>
                                    ))}
                                    {path.resources.length > 3 && (
                                      <div className="text-sm text-gray-500">
                                        +{path.resources.length - 3} more resources
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                                {userRole === 'student' ? (
                                  <button
                                    onClick={() => startLearningSession(path._id)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                  >
                                    <Play className="w-4 h-4" />
                                    {progress > 0 ? 'Continue Learning' : 'Start Learning'}
                                  </button>
                                ) : (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => navigate(`/learning-paths/${path._id}/edit`)}
                                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                      <BookOpen className="w-4 h-4" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => navigate(`/learning-paths/${path._id}/analytics`)}
                                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                      <Target className="w-4 h-4" />
                                      Analytics
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No Learning Paths Yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          {userRole === 'instructor' 
                            ? 'Create your first learning path for this course to get started.'
                            : 'No learning paths have been created for this course yet.'
                          }
                        </p>
                        {userRole === 'instructor' && (
                          <button
                            onClick={() => navigate('/create-learning-path', { state: { selectedCourse: course._id } })}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
                          >
                            <Plus className="w-4 h-4" />
                            Create First Learning Path
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Courses Available
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {userRole === 'instructor' 
                  ? 'You need to create courses first before you can create learning paths.'
                  : 'You are not enrolled in any courses yet.'
                }
              </p>
              {userRole === 'instructor' && (
                <button
                  onClick={() => navigate('/create-course')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create Course
                </button>
              )}
            </div>
          )}
        </div>

        {/* Document Viewer Modal */}
        {showDocumentViewer && (
          <DocumentViewer
            documents={selectedDocuments}
            onClose={() => {
              setShowDocumentViewer(false);
              setSelectedDocuments([]);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewLearningPaths;
