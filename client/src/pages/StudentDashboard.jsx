import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

import StudentStatCard from '../components/StudentStatCard';
import WhatToDoList from '../components/WhatToDoList';
import StudentActionButtons from '../components/StudentActionButtons';

import { BookOpen, Users, Star } from 'lucide-react'; // Assuming these icons are still relevant for student stats

export default function StudentDashboard() {
  const navigate = useNavigate();

  // Placeholder for student stats, these would ideally come from an API
  const studentStats = {
    coursesEnrolled: 6,
    certificatesEarned: 3,
    liveSessionsAttended: 8,
    progressLevel: 'Advanced',
  };



  return (
    <DashboardLayout role="student">
      <div className="px-4 py-6 bg-[#f6f8fb] dark:bg-gray-900 min-h-screen">
        
        {/* Welcome Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Welcome, {localStorage.getItem('userName') || 'Student'}!</h2>
          <p className="text-gray-600 dark:text-gray-300">Here's a quick overview of your progress and actions.</p>
        </section>

        {/* Overview Stats */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StudentStatCard title="Courses Enrolled" value={studentStats.coursesEnrolled} />
            <StudentStatCard title="Certificates Earned" value={studentStats.certificatesEarned} />
            <StudentStatCard title="Live Sessions Attended" value={studentStats.liveSessionsAttended} />
            <StudentStatCard title="Progress Level" value={studentStats.progressLevel} />
          </div>
        </section>

        {/* Progress Chart & What to Do */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Progress Chart & What To Do</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Placeholder for Progress Chart - You'll need to implement this component */}
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-4 h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              Progress Chart Placeholder
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
