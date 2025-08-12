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
  LogIn
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
  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (classrooms.length > 0) {
      loadLiveSessions();
    }
  }, [classrooms]);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData._id || userData.id;

      if (!token || !userId) {
        setError('Authentication required');
        return;
      }

      // Load classrooms first
      await loadClassrooms(token, userId);
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

  const loadLiveSessions = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      
      // Try to load live sessions from the API
      const response = await fetch('http://localhost:4000/api/live-sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const allSessions = await response.json();
        
        // Filter sessions by enrolled classrooms
        const enrolledSessions = allSessions.filter(session => 
          classrooms.some(classroom => 
            classroom.courses?.some(course => course.toString() === session.courseId?.toString())
          )
        );

        // Add mock data for demonstration if no real sessions exist
        if (enrolledSessions.length === 0) {
          const mockSessions = generateMockSessions();
          setSessions(mockSessions);
        } else {
          setSessions(enrolledSessions);
        }
      } else {
        console.warn('Failed to load live sessions:', response.status);
        // Generate mock data if API fails
        const mockSessions = generateMockSessions();
        setSessions(mockSessions);
      }
    } catch (error) {
      console.error('Error loading live sessions:', error);
      // Generate mock data if API fails
      const mockSessions = generateMockSessions();
      setSessions(mockSessions);
    } finally {
      setLoading(false);
    }
  };

  const generateMockSessions = () => {
    const mockSessions = [];
    const statuses = ['upcoming', 'ongoing', 'completed'];
    const subjects = ['Mathematics', 'Science', 'English', 'History', 'Computer Science'];
    
    for (let i = 1; i <= 12; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const classroom = classrooms[Math.floor(Math.random() * classrooms.length)] || { name: 'General Class' };
      
      let startTime, endTime;
      if (status === 'completed') {
        startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      } else if (status === 'ongoing') {
        startTime = new Date(Date.now() - Math.random() * 60 * 60 * 1000);
        endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      } else {
        startTime = new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000);
        endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      }

      mockSessions.push({
        id: i,
        title: `${subject} Session ${i}`,
        description: `Interactive ${subject.toLowerCase()} learning session with practical examples and Q&A.`,
        instructor: `Instructor ${Math.floor(Math.random() * 5) + 1}`,
        startTime,
        endTime,
        status,
        maxParticipants: Math.floor(Math.random() * 50) + 20,
        currentParticipants: Math.floor(Math.random() * 30) + 10,
        classroom: classroom.name,
        course: `${subject} Course`,
        meetingLink: status === 'upcoming' ? null : `https://meet.example.com/session${i}`,
        recordingUrl: status === 'completed' ? `https://recordings.example.com/session${i}` : null
      });
    }

    return mockSessions;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'ongoing':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="w-4 h-4" />;
      case 'ongoing':
        return <Play className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleJoinSession = (session) => {
    if (session.status === 'upcoming') {
      alert('This session has not started yet. Please wait until the scheduled time.');
    } else if (session.status === 'ongoing' && session.meetingLink) {
      window.open(session.meetingLink, '_blank');
    } else if (session.status === 'completed' && session.recordingUrl) {
      window.open(session.recordingUrl, '_blank');
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.course.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || session.status === selectedStatus;
    const matchesClassroom = selectedClassroom === 'all' || session.classroom === selectedClassroom;
    
    return matchesSearch && matchesStatus && matchesClassroom;
  });

  const getStats = () => {
    const total = sessions.length;
    const upcoming = sessions.filter(s => s.status === 'upcoming').length;
    const ongoing = sessions.filter(s => s.status === 'ongoing').length;
    const completed = sessions.filter(s => s.status === 'completed').length;
    
    return { total, upcoming, ongoing, completed };
  };

  const stats = getStats();

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Video className="w-8 h-8 text-green-600" />
                Live Sessions
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Join live learning sessions and access recorded sessions
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{sessions.length}</div>
              <div className="text-sm text-gray-500">Total Sessions</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <Video className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
                <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ongoing</p>
                <p className="text-2xl font-bold text-green-600">{stats.ongoing}</p>
              </div>
              <Play className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search sessions, instructors, or courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
              
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Classrooms</option>
                {classrooms.map(classroom => (
                  <option key={classroom._id} value={classroom.name}>
                    {classroom.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sessions Grid */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {sessions.length === 0 ? 'No Live Sessions Available' : 'No Sessions Found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {sessions.length === 0 
                ? 'Check back later for upcoming live learning sessions.'
                : 'Try adjusting your search or filters.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <div key={session.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(session.status)}
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(session.status)}`}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDateTime(session.startTime)}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {session.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {session.description}
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{session.instructor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="truncate">{session.classroom}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{session.currentParticipants}/{session.maxParticipants} participants</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleJoinSession(session)}
                      className={`flex-1 px-3 py-2 rounded text-sm transition-colors flex items-center justify-center gap-2 ${
                        session.status === 'upcoming' 
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : session.status === 'ongoing'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                      disabled={session.status === 'upcoming'}
                    >
                      {session.status === 'upcoming' ? (
                        <>
                          <Clock className="w-4 h-4" />
                          Wait
                        </>
                      ) : session.status === 'ongoing' ? (
                        <>
                          <LogIn className="w-4 h-4" />
                          Join Now
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Watch Recording
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => navigate(`/live-sessions/${session.id}`)}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentLiveSessions;
