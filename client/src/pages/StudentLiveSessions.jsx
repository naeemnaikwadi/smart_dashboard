import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Calendar, 
  Clock, 
  Users, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  Eye,
  LogIn,
  ArrowLeft
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const StudentLiveSessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedClassroom, setSelectedClassroom] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (classrooms.length > 0) {
      loadLiveSessions();
    }
  }, [classrooms, selectedStatus, selectedClassroom, selectedCourse]);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData._id || userData.id;

      if (!token || !userId) {
        setError('Authentication required');
        return;
      }

      // Load classrooms and courses first
      await Promise.all([
        loadClassrooms(token, userId),
        loadCourses(token)
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
    }
  };

  const loadClassrooms = async (token, userId) => {
    try {
      const response = await fetch('http://localhost:4000/api/classrooms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const allClassrooms = await response.json();
        const enrolledClassrooms = allClassrooms.filter(classroom => 
          classroom.students?.some(studentId => studentId.toString() === userId)
        );
        setClassrooms(enrolledClassrooms);
      } else {
        console.warn('Failed to load classrooms:', response.status);
        setClassrooms([]);
      }
    } catch (error) {
      console.error('Error loading classrooms:', error);
      setClassrooms([]);
    }
  };

  const loadCourses = async (token) => {
    try {
      const response = await fetch('http://localhost:4000/api/courses/enrolled', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const enrolledCourses = await response.json();
        setCourses(enrolledCourses || []);
      } else {
        console.warn('Failed to load courses:', response.status);
        setCourses([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    }
  };

  const loadLiveSessions = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedClassroom !== 'all') params.append('classroom', selectedClassroom);
      if (selectedCourse !== 'all') params.append('courseId', selectedCourse);
      
      const response = await fetch(`http://localhost:4000/api/live-sessions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const allSessions = await response.json();
        
        // Filter sessions by enrolled classrooms if no specific filters
        let filteredSessions = allSessions;
        if (selectedClassroom === 'all' && selectedCourse === 'all') {
          filteredSessions = allSessions.filter(session => {
            const sessionClassroomId = (session.classroom?._id || session.classroom || '').toString();
            return classrooms.some(classroom => classroom._id.toString() === sessionClassroomId);
          });
        }
        
        setSessions(filteredSessions);
      } else {
        console.warn('Failed to load live sessions:', response.status);
        setSessions([]);
      }
    } catch (error) {
      console.error('Error loading live sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'live':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'live':
        return <Play className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleJoinSession = (session) => {
    if (session.status === 'live') {
      navigate(`/live-session/${session.roomName}`);
    } else if (session.status === 'scheduled') {
      // Show countdown or join when available
      alert('Session will be available at the scheduled time');
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/student')}
              className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Live Sessions
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Join live sessions from your enrolled courses
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
          <div className="flex items-center gap-3 mb-3 text-gray-700 dark:text-gray-300">
            <Filter className="w-4 h-4" /> Filters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Classroom
              </label>
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Classrooms</option>
                {classrooms.map(classroom => (
                  <option key={classroom._id} value={classroom._id}>
                    {classroom.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Loading live sessions...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-8 text-center">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No live sessions found
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {searchTerm || selectedStatus !== 'all' || selectedClassroom !== 'all' || selectedCourse !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'No live sessions are currently available for your enrolled courses.'}
              </p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Live Sessions ({filteredSessions.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSessions.map(session => (
                  <div key={session._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {session.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(session.status)}`}>
                            {getStatusIcon(session.status)}
                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                          </span>
                        </div>
                        
                        {session.description && (
                          <p className="text-gray-600 dark:text-gray-300 mb-3">
                            {session.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(session.scheduledAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {session.duration} minutes
                          </span>
                          {session.instructor && (
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {session.instructor.name}
                            </span>
                          )}
                          {session.classroom && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {session.classroom.name}
                            </span>
                          )}
                          {session.courseId && (
                            <span className="flex items-center gap-1">
                              <Video className="w-4 h-4" />
                              {session.courseId.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {session.status === 'live' && (
                          <button
                            onClick={() => handleJoinSession(session)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                          >
                            <LogIn className="w-4 h-4" />
                            Join Now
                          </button>
                        )}
                        {session.status === 'scheduled' && (
                          <button
                            onClick={() => handleJoinSession(session)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                          >
                            <Clock className="w-4 h-4" />
                            Join Later
                          </button>
                        )}
                        {session.status === 'completed' && (
                          <span className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">
                            Session Ended
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentLiveSessions;
