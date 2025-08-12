import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentUserId, getAuthHeaders } from '../utils/auth';
import DashboardLayout from '../components/DashboardLayout';

const EditCourse = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState({
    name: '',
    description: '',
    date: '',
    classroom: '',
  });
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCourse();
    fetchClassrooms();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/courses/${courseId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setCourseData({
          name: data.name || '',
          description: data.description || '',
          date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
          classroom: data.classroom?._id || data.classroom || '',
        });
      } else {
        throw new Error('Failed to fetch course');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const instructorId = getCurrentUserId();
      const response = await fetch(`http://localhost:4000/api/classrooms/instructor/${instructorId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setClassrooms(data);
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
  };

  const handleChange = (e) => {
    setCourseData({
      ...courseData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:4000/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseData)
      });

      if (response.ok) {
        setSuccess('Course updated successfully!');
        
        // Navigate back to courses page after a short delay
        setTimeout(() => {
          navigate('/instructor/courses');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update course');
      }
    } catch (error) {
      console.error('Error updating course:', error);
      setError('Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="instructor">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="instructor">
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/instructor/courses')}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back to Courses
          </button>
          <h2 className="text-2xl font-bold text-indigo-900 dark:text-white">Edit Course</h2>
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
        
        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course Name *
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter course name"
              value={courseData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              placeholder="Enter course description"
              value={courseData.description}
              onChange={handleChange}
              required
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date *
            </label>
            <input
              type="date"
              name="date"
              value={courseData.date}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
              Classroom *
            </label>
            <select
              name="classroom"
              value={courseData.classroom}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select a classroom</option>
              {classrooms.map((classroom) => (
                <option key={classroom._id} value={classroom._id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/instructor/courses')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                saving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {saving ? 'Updating Course...' : 'Update Course'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditCourse;
