import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import { Clock, BookOpen, Target, TrendingUp, Users, Award, Filter } from 'lucide-react';
import axios from 'axios';

const ReadingStatisticsDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [courses, setCourses] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);

  useEffect(() => {
    fetchLearningPaths();
  }, []);

  useEffect(() => {
    if (learningPaths.length > 0) {
      fetchReadingStats();
    }
  }, [learningPaths, selectedTimeframe, selectedCourse]);

  const fetchLearningPaths = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/learning-paths', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data) {
        setLearningPaths(response.data);
        
        // Extract unique courses - handle both populated and unpopulated courseId
        const uniqueCourses = response.data.reduce((acc, path) => {
          if (path.courseId) {
            const courseId = typeof path.courseId === 'object' ? path.courseId._id : path.courseId;
            const courseName = typeof path.courseId === 'object' ? path.courseId.name : 'Unknown Course';
            const existingCourse = acc.find(c => c._id === courseId);
            if (!existingCourse) {
              acc.push({
                _id: courseId,
                name: courseName
              });
            }
          }
          return acc;
        }, []);
        setCourses(uniqueCourses);
      }
    } catch (error) {
      console.error('Error fetching learning paths:', error);
    }
  };

  const fetchReadingStats = async () => {
    try {
      setLoading(true);
      
      // Filter learning paths by selected course
      const filteredPaths = selectedCourse === 'all' 
        ? learningPaths 
        : learningPaths.filter(path => {
            if (!path.courseId) return false;
            const courseId = typeof path.courseId === 'object' ? path.courseId._id : path.courseId;
            return courseId === selectedCourse;
          });

      // Calculate statistics from learning paths and progress data
      let totalReadingTime = 0;
      let totalSessions = 0;
      let topicsCompleted = 0;
      let totalTopics = 0;
      let timeSpentByTopic = [];
      let dailyReadingTime = [];
      let completionRates = { completed: 0, inProgress: 0, notStarted: 0 };

      // Fetch progress data for each learning path
      for (const path of filteredPaths) {
        try {
          const progressResponse = await axios.get(`http://localhost:4000/api/learning-paths/${path._id}/progress`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          const progress = progressResponse.data;
          
          if (progress) {
            totalReadingTime += progress.timeSpent || 0;
            totalSessions += progress.readingSessions?.length || 0;
            
            // Calculate progress percentage
            const progressPercentage = progress.overallProgress || 0;
            if (progressPercentage >= 100) {
              topicsCompleted++;
              completionRates.completed++;
            } else if (progressPercentage > 0) {
              completionRates.inProgress++;
            } else {
              completionRates.notStarted++;
            }
            
            totalTopics++;
            
            // Add to time spent by topic
            timeSpentByTopic.push({
              topic: path.title,
              timeSpent: progress.timeSpent || 0,
              progress: progressPercentage
            });
          } else {
            totalTopics++;
            completionRates.notStarted++;
            timeSpentByTopic.push({
              topic: path.title,
              timeSpent: 0,
              progress: 0
            });
          }
        } catch (error) {
          console.error('Error fetching progress for path:', path._id, error);
          totalTopics++;
          completionRates.notStarted++;
          timeSpentByTopic.push({
            topic: path.title,
            timeSpent: 0,
            progress: 0
          });
        }
      }

      // Calculate average reading time
      const averageReadingTime = totalSessions > 0 ? Math.round(totalReadingTime / totalSessions) : 0;
      
      // Calculate overall progress
      const readingProgress = totalTopics > 0 ? Math.round((topicsCompleted / totalTopics) * 100) : 0;

      // Generate daily reading time data (mock data for now)
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      dailyReadingTime = days.map(day => ({
        day,
        minutes: Math.floor(Math.random() * 120) + 20
      }));

      // Prepare completion rates for pie chart
      const completionRatesData = [
        { status: 'Completed', value: completionRates.completed, color: '#10B981' },
        { status: 'In Progress', value: completionRates.inProgress, color: '#F59E0B' },
        { status: 'Not Started', value: completionRates.notStarted, color: '#EF4444' }
      ];

      setStats({
        totalReadingTime,
        averageReadingTime,
        topicsCompleted,
        totalTopics,
        readingProgress,
        timeSpentByTopic,
        dailyReadingTime,
        completionRates: completionRatesData
      });
    } catch (error) {
      console.error('Error fetching reading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading reading statistics...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Reading Statistics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Track your learning progress and reading habits across courses
            </p>
          </div>
          <div className="flex gap-4">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Key Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reading Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatTime(stats?.totalReadingTime || 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Session</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatTime(stats?.averageReadingTime || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Topics Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.topicsCompleted || 0}/{stats?.totalTopics || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <Target className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.readingProgress || 0}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Reading Time Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Daily Reading Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.dailyReadingTime || []}>
                <XAxis dataKey="day" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  formatter={(value) => [`${value} minutes`, 'Reading Time']}
                  labelStyle={{ color: '#374151' }}
                />
                <Bar dataKey="minutes" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Topic Progress Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Learning Path Progress
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.timeSpentByTopic || []} layout="horizontal">
                <XAxis type="number" stroke="#6B7280" />
                <YAxis dataKey="topic" type="category" stroke="#6B7280" width={100} />
                <Tooltip 
                  formatter={(value, name) => [`${formatTime(value)}`, 'Time Spent']}
                  labelStyle={{ color: '#374151' }}
                />
                <Bar dataKey="timeSpent" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Completion Rates and Topic Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Completion Rates Pie Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Completion Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.completionRates || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ status, value }) => `${status}: ${value}%`}
                >
                  {(stats?.completionRates || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Topic Details Table */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Learning Path Details
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Learning Path</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Time Spent</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.timeSpentByTopic || []).map((topic, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2 text-sm text-gray-900 dark:text-white">{topic.topic}</td>
                      <td className="py-2 text-sm text-gray-600 dark:text-gray-300">
                        {formatTime(topic.timeSpent)}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${topic.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {topic.progress}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReadingStatisticsDashboard;
