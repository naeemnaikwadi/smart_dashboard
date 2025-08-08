import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserId, getAuthHeaders } from '../utils/auth';
import DashboardLayout from '../components/DashboardLayout';

const InstructorClassrooms = () => {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const instructorId = getCurrentUserId();
      
      if (!instructorId) {
        setError('User not authenticated. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('Fetching classrooms for instructor:', instructorId);

      const response = await fetch(`http://localhost:4000/api/classrooms/instructor/${instructorId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error('Failed to fetch classrooms');
      }

      const data = await response.json();

      console.log('Classrooms response:', data);
      setClassrooms(data);
    } catch (error) {
      console.error('Error fetching instructor classrooms:', error);
      setError(error.message || 'Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout role="instructor">
        <div className="p-6 max-w-5xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading classrooms...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="instructor">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-indigo-900 dark:text-white">Your Classrooms</h2>
          <div className="space-x-2">
            <button
              onClick={() => navigate('/create-classroom')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Create New Classroom
            </button>
            <button
              onClick={() => navigate('/instructor/courses')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Manage Courses
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {classrooms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              No classrooms created yet.
            </p>
            <button
              onClick={() => navigate('/create-classroom')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              Create Your First Classroom
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom) => (
              <div key={classroom._id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {classroom.name}
                  </h3>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-blue-800 dark:text-blue-200 font-medium">
                    Entry Code: <span className="font-mono text-lg">{classroom.entryCode}</span>
                  </p>
                  <p className="text-blue-600 dark:text-blue-300 text-xs mt-1">
                    Share this code with students to join
                  </p>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  {classroom.description}
                </p>
                
                <div className="space-y-2 text-sm">
                  <p className="text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Course:</span> {classroom.course}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Date:</span> {formatDate(classroom.date)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Students:</span> {classroom.students?.length || 0}
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => navigate(`/instructor/classroom/${classroom._id}`)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                  >
                    Open Classroom
                  </button>
                  <button
                    onClick={() => navigate(`/instructor/classroom/${classroom._id}/courses`)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Manage Courses
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InstructorClassrooms;
