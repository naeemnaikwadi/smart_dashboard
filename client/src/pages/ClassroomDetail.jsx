import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentUserId, getAuthHeaders, getCurrentUser } from '../utils/auth';
import DashboardLayout from '../components/DashboardLayout';

const ClassroomDetail = () => {
  const { id: classroomId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [classroom, setClassroom] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const currentUser = getCurrentUser();
  const userRole = currentUser?.role || null;

  useEffect(() => {
    fetchData();
  }, [classroomId]);

  const fetchData = async () => {
    try {
      const classroomRes = await fetch(`http://localhost:4000/api/classrooms/${classroomId}`, {
        headers: getAuthHeaders()
      });
      
      if (classroomRes.ok) {
        const classroomData = await classroomRes.json();
        setClassroom(classroomData);
      }

      const coursesRes = await fetch(`http://localhost:4000/api/courses/classroom/${classroomId}`, {
        headers: getAuthHeaders()
      });
      
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load classroom data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:4000/api/courses/', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          date,
          classroom: classroomId
        })
      });

      if (response.ok) {
        setSuccess('Course created successfully!');
        setName('');
        setDescription('');
        setDate('');
        // Refresh courses list
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create course');
      }
    } catch (err) {
      console.error('Error creating course:', err);
      setError('Failed to create course');
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
      <DashboardLayout role={userRole}>
        <div className="p-6 max-w-5xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading classroom details...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={userRole}>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-indigo-900 dark:text-white">
            {classroom?.name} - Details
          </h2>
          <button
            onClick={() => navigate(userRole === 'instructor' ? '/instructor/classrooms' : '/student/classrooms')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Classrooms
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow mb-6">
          <h3 className="text-xl font-bold mb-4">Classroom Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">Name:</span> {classroom?.name}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">Description:</span> {classroom?.description}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">Entry Code:</span> {classroom?.entryCode}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">Students:</span> {classroom?.students?.length || 0}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">Date:</span> {classroom?.date ? formatDate(classroom.date) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {userRole === 'instructor' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow mb-6">
            <h3 className="text-xl font-bold mb-4">Create New Course</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter course name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  placeholder="Enter course description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
              >
                Create Course
              </button>
            </form>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <h3 className="text-xl font-bold mb-4">Courses</h3>
          {courses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No courses available yet.</p>
          ) : (
            <div className="space-y-4">
              {courses.map(course => (
                <div key={course._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-lg">{course.name}</h4>
                    <p className="text-gray-600 dark:text-gray-300">{course.description}</p>
                    <p className="text-sm text-gray-500">Date: {formatDate(course.date)}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/course/${course._id}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClassroomDetail;
