import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  Play,
  Target,
  Star,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const StudentCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (classrooms.length > 0) {
      loadCourses();
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

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      
      // Try to load courses from the API
      const response = await fetch('http://localhost:4000/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const allCourses = await response.json();
        
        // Filter courses by enrolled classrooms
        const enrolledCourses = allCourses.filter(course => 
          classrooms.some(classroom => 
            classroom.courses?.some(c => c.toString() === course._id?.toString())
          )
        );

        // Add mock data for demonstration if no real courses exist
        if (enrolledCourses.length === 0) {
          const mockCourses = generateMockCourses();
          setCourses(mockCourses);
        } else {
          setCourses(enrolledCourses);
        }
      } else {
        console.warn('Failed to load courses:', response.status);
        // Generate mock data if API fails
        const mockCourses = generateMockCourses();
        setCourses(mockCourses);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      // Generate mock data if API fails
      const mockCourses = generateMockCourses();
      setCourses(mockCourses);
    } finally {
      setLoading(false);
    }
  };

  const generateMockCourses = () => {
    const mockCourses = [];
    const subjects = ['Mathematics', 'Science', 'English', 'History', 'Computer Science', 'Physics', 'Chemistry', 'Biology'];
    const levels = ['Beginner', 'Intermediate', 'Advanced'];
    
    for (let i = 1; i <= 15; i++) {
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const level = levels[Math.floor(Math.random() * levels.length)];
      const classroom = classrooms[Math.floor(Math.random() * classrooms.length)] || { name: 'General Class' };
      const instructor = `Instructor ${Math.floor(Math.random() * 5) + 1}`;
      const progress = Math.floor(Math.random() * 100);
      const rating = (Math.random() * 2 + 3).toFixed(1); // 3.0 to 5.0
      
      mockCourses.push({
        id: i,
        title: `${subject} - ${level} Level`,
        description: `Comprehensive ${subject.toLowerCase()} course designed for ${level.toLowerCase()} learners. Covers fundamental concepts and advanced topics.`,
        instructor,
        duration: Math.floor(Math.random() * 20 + 10), // 10-30 hours
        lessons: Math.floor(Math.random() * 15 + 8), // 8-23 lessons
        students: Math.floor(Math.random() * 50 + 20), // 20-70 students
        rating: parseFloat(rating),
        totalRatings: Math.floor(Math.random() * 100 + 20),
        progress,
        classroom: classroom.name,
        category: subject,
        level,
        startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within 30 days
        lastAccessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within 7 days
        certificate: progress >= 80,
        featured: Math.random() > 0.7 // 30% chance of being featured
      });
    }

    return mockCourses;
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClassroom = selectedClassroom === 'all' || course.classroom === selectedClassroom;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'completed' && course.progress >= 80) ||
                         (selectedStatus === 'in-progress' && course.progress > 0 && course.progress < 80) ||
                         (selectedStatus === 'not-started' && course.progress === 0);
    
    return matchesSearch && matchesClassroom && matchesStatus;
  });

  const getStats = () => {
    const total = courses.length;
    const completed = courses.filter(c => c.progress >= 80).length;
    const inProgress = courses.filter(c => c.progress > 0 && c.progress < 80).length;
    const notStarted = courses.filter(c => c.progress === 0).length;
    const averageProgress = courses.length > 0 ? 
      courses.reduce((sum, c) => sum + c.progress, 0) / courses.length : 0;
    
    return { total, completed, inProgress, notStarted, averageProgress };
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
                <BookOpen className="w-8 h-8 text-blue-600" />
                My Courses
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Track your learning progress across all enrolled courses
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
              <div className="text-sm text-gray-500">Total Courses</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <Play className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Not Started</p>
                <p className="text-2xl font-bold text-red-600">{stats.notStarted}</p>
              </div>
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Progress</p>
                <p className="text-2xl font-bold text-purple-600">{stats.averageProgress.toFixed(1)}%</p>
              </div>
              <GraduationCap className="w-8 h-8 text-purple-600" />
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
                  placeholder="Search courses, instructors, or subjects..."
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
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="not-started">Not Started</option>
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

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {courses.length === 0 ? 'No Courses Enrolled Yet' : 'No Courses Found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {courses.length === 0 
                ? 'Join classrooms to access courses and start learning.'
                : 'Try adjusting your search or filters.'
              }
            </p>
            {courses.length === 0 && (
              <button
                onClick={() => navigate('/student-classrooms')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Browse Classrooms
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getLevelColor(course.level)}`}>
                        {course.level}
                      </span>
                      {course.featured && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{course.rating}</span>
                      <span className="text-xs text-gray-500">({course.totalRatings})</span>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {course.description}
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{course.instructor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="truncate">{course.classroom}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration}h • {course.lessons} lessons</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{course.students} students enrolled</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                      <span className={`text-sm font-bold ${getProgressColor(course.progress)}`}>
                        {course.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          course.progress >= 80 ? 'bg-green-600' : 
                          course.progress >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/course/${course.id}`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {course.progress === 0 ? (
                        <>
                          <Play className="w-4 h-4" />
                          Start Learning
                        </>
                      ) : course.progress >= 80 ? (
                        <>
                          <Target className="w-4 h-4" />
                          Review Course
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Continue Learning
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => navigate(`/course/${course.id}`)}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {course.certificate && (
                    <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded text-center">
                      <span className="text-sm text-green-800 dark:text-green-300 font-medium">
                        🎉 Certificate Available!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentCourses;
