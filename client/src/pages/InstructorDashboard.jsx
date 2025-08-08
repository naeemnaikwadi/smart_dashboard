// client/src/pages/InstructorDashboard.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Users, Star } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import MonthlyChart from '../components/MonthlyChart';
import InstructorActionButtons from '../components/InstructorActionButtons';
import LiveSessionCalendar from '../components/LiveSessionCalendar';

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const instructorId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/instructor/stats/${instructorId}`);
        setStats(res.data);
        setChartData(res.data.monthlyEnrollments || []);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();
  }, [instructorId]);

  return (
    <DashboardLayout role="instructor">
      <div className="px-4 py-6 bg-[#f6f8fb] dark:bg-gray-900 min-h-screen">
        
       

        {/* Overview Stats */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
            />
          </div>
        </section>

        {/* Chart and Calendar */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">
            Monthly Enrollments & Live Sessions
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-4 h-[300px]">
              <MonthlyChart data={chartData} />
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-4 h-[300px] overflow-y-auto">
              <LiveSessionCalendar instructorId={instructorId} />
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
