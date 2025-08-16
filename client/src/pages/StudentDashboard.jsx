import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

import StudentStatCard from '../components/StudentStatCard';
import WhatToDoList from '../components/WhatToDoList';
import StudentActionButtons from '../components/StudentActionButtons';
import TimeSpentChart from '../components/charts/TimeSpentChart';
import ImprovementGraph from '../components/charts/ImprovementGraph';

import { BookOpen, Users, Star, Target, Clock, TrendingUp, RefreshCw, Edit3, Camera, Save, X, ArrowRight, FileText, Video, Award } from 'lucide-react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [learningPathStats, setLearningPathStats] = useState({
    totalPaths: 0,
    completedPaths: 0,
    averageProgress: 0,
    totalTimeSpent: 0
  });
  const [studentStats, setStudentStats] = useState({
    coursesEnrolled: 0,
    certificatesEarned: 0,
    liveSessionsAttended: 0,
    progressLevel: 'Beginner',
    totalStudyTime: 0,
    averageSessionTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Profile editing states
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const fetchLearningPathStats = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/learning-paths', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const paths = res.data || [];
      
      // Calculate stats from learning paths with null checks
      const totalPaths = paths?.length || 0;
      const completedPaths = paths?.filter(path => path?.overallProgress === 100)?.length || 0;
      const averageProgress = paths && paths.length > 0 ? 
        paths.reduce((sum, path) => sum + (path?.overallProgress || 0), 0) / paths.length : 0;
      const totalTimeSpent = paths?.reduce((sum, path) => sum + (path?.timeSpent || 0), 0) || 0;

      setLearningPathStats({
        totalPaths,
        completedPaths,
        averageProgress,
        totalTimeSpent
      });
    } catch (err) {
      console.error('Error fetching learning path stats:', err);
      setLearningPathStats({
        totalPaths: 0,
        completedPaths: 0,
        averageProgress: 0,
        totalTimeSpent: 0
      });
    }
  }, []);

  const fetchStudentStats = useCallback(async () => {
    try {
      // Fetch student-specific stats from various endpoints with better error handling
      const [coursesRes, progressRes, liveSessionsRes] = await Promise.allSettled([
        axios.get('http://localhost:4000/api/courses/enrolled', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('http://localhost:4000/api/progress/student', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('http://localhost:4000/api/live-sessions', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      // Handle courses response
      let courses = [];
      if (coursesRes.status === 'fulfilled' && coursesRes.value?.data) {
        courses = coursesRes.value.data;
      } else {
        console.warn('Courses API failed:', coursesRes.reason?.response?.status);
        // Try alternative endpoint
        try {
          const altResponse = await axios.get('http://localhost:4000/api/courses', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          courses = altResponse.data || [];
        } catch (altError) {
          console.warn('Alternative courses API also failed:', altError);
        }
      }

      // Handle progress response
      let progress = [];
      if (progressRes.status === 'fulfilled' && progressRes.value?.data) {
        progress = progressRes.value.data;
      } else {
        console.warn('Progress API failed:', progressRes.reason?.response?.status);
      }

      // Handle live sessions response
      let liveSessions = [];
      if (liveSessionsRes.status === 'fulfilled' && liveSessionsRes.value?.data) {
        liveSessions = liveSessionsRes.value.data;
      } else {
        console.warn('Live sessions API failed:', liveSessionsRes.reason?.response?.status);
      }

      // Calculate progress level based on average progress with null checks
      const avgProgress = progress && progress.length > 0 ? 
        progress.reduce((sum, p) => sum + (p?.overallProgress || 0), 0) / progress.length : 0;
      
      let progressLevel = 'Beginner';
      if (avgProgress >= 80) progressLevel = 'Advanced';
      else if (avgProgress >= 50) progressLevel = 'Intermediate';

      // Calculate study time stats with null checks
      const totalStudyTime = progress?.reduce((sum, p) => sum + (p?.timeSpent || 0), 0) || 0;
      const averageSessionTime = progress && progress.length > 0 ? 
        progress.reduce((sum, p) => sum + (p?.readingStatistics?.averageSessionTime || 0), 0) / progress.length : 0;

      setStudentStats({
        coursesEnrolled: courses?.length || 0,
        certificatesEarned: Math.floor((learningPathStats?.completedPaths || 0) * 0.7), // Simulate certificates
        liveSessionsAttended: liveSessions?.length || 0,
        progressLevel,
        totalStudyTime,
        averageSessionTime
      });
    } catch (err) {
      console.error('Error fetching student stats:', err);
      // Set default values instead of failing completely
      setStudentStats({
        coursesEnrolled: 0,
        certificatesEarned: 0,
        liveSessionsAttended: 0,
        progressLevel: 'Beginner',
        totalStudyTime: 0,
        averageSessionTime: 0
      });
    }
  }, [learningPathStats?.completedPaths]);

  const refreshAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchLearningPathStats(), fetchStudentStats()]);
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchLearningPathStats(), fetchStudentStats()]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
        setLastUpdated(new Date());
      }
    };

    loadInitialData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(refreshAllData, 30000);

    return () => clearInterval(interval);
  }, [fetchLearningPathStats, fetchStudentStats]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setProfileData({
        name: userData.name || '',
        email: userData.email || ''
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleProfileEdit = () => {
    setEditingProfile(true);
    setProfileError('');
    setProfileSuccess('');
  };

  const handleProfileCancel = () => {
    setEditingProfile(false);
    loadUserData();
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setProfileError('');
    setProfileSuccess('');
  };

  const handleProfileInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return;

    setUploadingPhoto(true);
    setProfileError('');

    try {
      const formData = new FormData();
      formData.append('photo', selectedPhoto);

      const response = await fetch('http://localhost:4000/api/users/profile-photo', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const result = await response.json();
      
      // Update local storage and state
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { ...currentUser, avatarUrl: result.avatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      if (localStorage.getItem('userName')) {
        localStorage.setItem('userName', updatedUser.name);
      }
      
      setProfileSuccess('Profile photo updated successfully!');
      setSelectedPhoto(null);
      setPhotoPreview(null);
      
      // Update the user context without page reload
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
    } catch (error) {
      setProfileError('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        // Update local storage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        if (localStorage.getItem('userName')) {
          localStorage.setItem('userName', updatedUser.name);
        }
        
        setEditingProfile(false);
        setProfileSuccess('Profile updated successfully!');
        
        // Update the user context without page reload
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
      } else {
        const errorData = await response.json();
        setProfileError(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileError('Failed to update profile');
    }
  };

  const formatTime = (minutes) => {
    if (!minutes || isNaN(minutes)) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="px-4 py-6 bg-[#f6f8fb] dark:bg-gray-900 min-h-screen">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading dashboard...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
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
                    {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name?.charAt(0).toUpperCase() || localStorage.getItem('userName')?.charAt(0).toUpperCase() || 'S' : 'S'}
                  </div>
                )}
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  Welcome, {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name || localStorage.getItem('userName') || 'Student' : 'Student'}!
                </h2>
                <p className="text-gray-600 dark:text-gray-300">Here's a quick overview of your progress and actions.</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <StudentStatCard 
            title="Courses Enrolled" 
            value={studentStats?.coursesEnrolled || 0}  
            bgColor="bg-blue-100 dark:bg-blue-900"
            textColor="text-blue-800 dark:text-blue-200"
            />
            <StudentStatCard title="Certificates Earned" 
            value={studentStats?.certificatesEarned || 0}  
            bgColor="bg-green-100 dark:bg-green-900"
            textColor="text-green-800 dark:text-green-200"
            />
            <StudentStatCard title="Live Sessions Attended" 
            value={studentStats?.liveSessionsAttended || 0}  
            bgColor="bg-yellow-100 dark:bg-yellow-900"
            textColor="text-yellow-800 dark:text-yellow-200"
            />
            <StudentStatCard title="Progress Level" 
            value={studentStats?.progressLevel || 'Beginner'}  
            bgColor="bg-purple-100 dark:bg-purple-900"
            textColor="text-purple-800 dark:text-purple-200"
            />
            <StudentStatCard title="Learning Paths" 
            value={learningPathStats?.totalPaths || 0}  
            bgColor="bg-red-100 dark:bg-red-900"
            textColor="text-red-800 dark:text-red-200"
            />
            <StudentStatCard title="Completed Paths" 
            value={learningPathStats?.completedPaths || 0} 
            bgColor="bg-violet-100 dark:bg-violet-900"
            textColor="text-violet-800 dark:text-violet-200"
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
                  onClick={() => navigate('/learning-paths')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Explore Learning Paths
                </button>
                <button
                  onClick={() => navigate('/reading-statistics')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  View Reading Statistics
                </button>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Learning Progress</h3>
                <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Total Paths:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{learningPathStats?.totalPaths || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Completed:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{learningPathStats?.completedPaths || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Avg Progress:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{(learningPathStats?.averageProgress || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Time Spent:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatTime(learningPathStats?.totalTimeSpent || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Assessments Quick Access */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Assessments</h2>
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Track Your Progress</h3>
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {learningPathStats?.totalPaths || 0}
                </div>
                <div className="text-sm text-purple-600">Available Assessments</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {learningPathStats?.completedPaths || 0}
                </div>
                <div className="text-sm text-green-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {(learningPathStats?.averageProgress || 0).toFixed(0)}%
                </div>
                <div className="text-sm text-blue-600">Average Score</div>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/assessments')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Award className="w-4 h-4" />
                View Assessment Dashboard
              </button>
            </div>
          </div>
        </section>

        {/* Progress Charts & What to Do */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Progress Charts & What To Do</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-4 h-[300px]">
              <TimeSpentChart />
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-4 h-[300px]">
              <ImprovementGraph />
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-4 h-[300px] overflow-y-auto">
              <WhatToDoList />
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">
            <StudentActionButtons navigate={navigate} />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
