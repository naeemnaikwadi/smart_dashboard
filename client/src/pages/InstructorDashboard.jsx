// client/src/pages/InstructorDashboard.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Users, Star, Target, Clock, RefreshCw, TrendingUp } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import MonthlyChart from '../components/MonthlyChart';
import InstructorActionButtons from '../components/InstructorActionButtons';
import CompactLiveSessionCalendar from '../components/CompactLiveSessionCalendar';

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [learningPathStats, setLearningPathStats] = useState({
    totalPaths: 0,
    activeLearners: 0,
    averageProgress: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const instructorId = localStorage.getItem('userId');
  
  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:4000/api/instructor/stats/${instructorId}`);
      setStats(res.data);
      setChartData(res.data.monthlyEnrollments || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [instructorId]);

  const fetchLearningPathStats = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:4000/api/learning-paths/instructor/${instructorId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const paths = res.data || [];
      setLearningPathStats({
        totalPaths: paths.length,
        activeLearners: paths.reduce((sum, path) => sum + (path.learners?.length || 0), 0),
        averageProgress: paths.length > 0 ? 
          paths.reduce((sum, path) => sum + (path.overallProgress || 0), 0) / paths.length : 0
      });
    } catch (err) {
      console.error('Error fetching learning path stats:', err);
    }
  }, [instructorId]);

  const refreshAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchStats(), fetchLearningPathStats()]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchLearningPathStats()]);
      setLoading(false);
    };

    loadInitialData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(refreshAllData, 30000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchLearningPathStats]);

  if (loading) {
    return (
      <DashboardLayout role="instructor">
        <div className="px-4 py-6 bg-[#f6f8fb] dark:bg-gray-900 min-h-screen">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading dashboard...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="instructor">
      <div className="px-4 py-6 bg-[#f6f8fb] dark:bg-gray-900 min-h-screen">
        
        {/* Welcome Section with Refresh Button */}
        <section className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Profile Section */}
              <div className="relative">
                {localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).avatarUrl ? (
                  <img 
                    src={`http://localhost:4000${JSON.parse(localStorage.getItem('user')).avatarUrl}`} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold text-white border-4 border-white shadow-lg">
                    {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name?.charAt(0).toUpperCase() || localStorage.getItem('userName')?.charAt(0).toUpperCase() || 'I' : 'I'}
                  </div>
                )}
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  Welcome, {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name || localStorage.getItem('userName') || 'Instructor' : 'Instructor'}!
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Here's an overview of your teaching activities and student progress.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={refreshAllData}
                disabled={refreshing}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </section>

        {/* Overview Stats */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <StatCard
              label="Total Courses"
              value={stats?.totalCourses || 0}
              icon={<BookOpen />}
              bgColor="bg-blue-100 dark:bg-blue-900"
              textColor="text-blue-800 dark:text-blue-200"
            />
            <StatCard
              label="Total Students"
              value={stats?.totalStudents || 0}
              icon={<Users />}
              bgColor="bg-green-100 dark:bg-green-900"
              textColor="text-green-800 dark:text-green-200"
            />
            <StatCard
              label="Average Rating"
              value={stats?.averageRating?.toFixed(1) || 0}
              icon={<Star />}
              bgColor="bg-yellow-100 dark:bg-yellow-900"
              textColor="text-yellow-800 dark:text-yellow-200"
              subtitle={`${stats?.totalRatings || 0} ratings`}
            />
            <StatCard
              label="Learning Paths"
              value={learningPathStats.totalPaths}
              icon={<Target />}
              bgColor="bg-purple-100 dark:bg-purple-900"
              textColor="text-purple-800 dark:text-purple-200"
            />
            <StatCard
              label="Active Learners"
              value={stats?.activeLearners || 0}
              icon={<Clock />}
              bgColor="bg-indigo-100 dark:bg-indigo-900"
              textColor="text-indigo-800 dark:text-indigo-200"
              subtitle="Last 30 days"
            />
          </div>
        </section>

        {/* Learning Paths Quick Access */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Learning Paths</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/create-learning-path')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Create New Learning Path
                </button>
                <button
                  onClick={() => navigate('/learning-paths')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Target className="w-4 h-4" />
                  View All Learning Paths
                </button>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Learning Path Stats</h3>
                <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Total Paths:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{learningPathStats.totalPaths}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Active Learners:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{learningPathStats.activeLearners}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Avg Progress:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{learningPathStats.averageProgress.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Chart and Mini Calendar */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">
            Monthly Enrollments & Live Sessions
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 min-h-[350px]">
              <MonthlyChart data={chartData} />
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 min-h-[350px]">
              <CompactLiveSessionCalendar instructorId={instructorId} height={300} />
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <InstructorActionButtons navigate={navigate} />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
