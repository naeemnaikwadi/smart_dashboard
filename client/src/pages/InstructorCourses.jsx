import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserId, getAuthHeaders } from '../utils/auth';
import DashboardLayout from '../components/DashboardLayout';

const InstructorCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const instructorId = getCurrentUserId();
      
      if (!instructorId) {
        setError('User not authenticated. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('Fetching courses for instructor:', instructorId);

      const response = await fetch(`http://localhost:4000/api/courses/instructor/${instructorId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      console.log('Courses response:', data);
      setCourses(data);
    } catch (error) {
      console.error('Error fetching instructor courses:', error);
      setError(error.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const response = await fetch(`http://localhost:4000/api/courses/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (response.ok) {
          setCourses(prev => prev.filter(c => c._id !== id));
        } else {
          throw new Error('Failed to delete course');
        }
      } catch (err) {
        console.error('Delete failed:', err);
        alert('Failed to delete course');
      }
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
            <div className="text-lg">Loading courses...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="instructor">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-indigo-900 dark:text-white">My Courses</h2>
          <div className="space-x-2">
            <button
              onClick={() => navigate('/create-course')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Create Course
            </button>
            <button
              onClick={() => navigate('/instructor/classrooms')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              View Classrooms
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              No courses created yet.
            </p>
            <button
              onClick={() => navigate('/create-course')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              Create Your First Course
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course._id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {course.name}
                  </h3>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  {course.description}
                </p>
                
                <div className="space-y-2 text-sm">
                  <p className="text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Classroom:</span> {course.classroom?.name || 'N/A'}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Date:</span> {formatDate(course.date)}
                  </p>
                </div>
                
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => navigate(`/course/${course._id}`)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                  >
                    Open Course
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/edit-course/${course._id}`)}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course._id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg"
                    >
                      Delete
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

export default InstructorCourses;
