import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

const InstructorClassroomDetail = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateCourseForm, setShowCreateCourseForm] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    description: '',
    date: ''
  });

  useEffect(() => {
    fetchClassroom();
    fetchCourses();
  }, [classroomId]);

  const fetchClassroom = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4000/api/classrooms/${classroomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClassroom(response.data);
    } catch (error) {
      setError('Failed to load classroom');
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4000/api/courses/classroom/${classroomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data);
    } catch (error) {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...newCourse,
        classroom: classroomId
      };
      const response = await axios.post('http://localhost:4000/api/courses', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses([response.data, ...courses]);
      setNewCourse({ name: '', description: '', date: '' });
      setShowCreateCourseForm(false);
    } catch (err) {
      setError('Failed to create course');
    }
  };

  const handleInputChange = (e) => {
    setNewCourse({ ...newCourse, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <DashboardLayout role="instructor">
        <div className="p-6 max-w-5xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading classroom details...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="instructor">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{classroom?.name} - Classroom Management</h2>
          <button
            onClick={() => navigate('/instructor/classrooms')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Classrooms
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow mb-6">
          <h3 className="text-xl font-bold mb-4">Classroom Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Name:</strong> {classroom?.name}</p>
              <p><strong>Description:</strong> {classroom?.description}</p>
              <p><strong>Entry Code:</strong> {classroom?.entryCode}</p>
            </div>
            <div>
              <p><strong>Course:</strong> {classroom?.course}</p>
              <p><strong>Students:</strong> {classroom?.students?.length || 0}</p>
              <p><strong>Date:</strong> {new Date(classroom?.date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Courses</h3>
            <button
              onClick={() => setShowCreateCourseForm(!showCreateCourseForm)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              {showCreateCourseForm ? 'Cancel' : 'Create New Course'}
            </button>
          </div>

          {showCreateCourseForm && (
            <form onSubmit={handleCreateCourse} className="mb-6 space-y-4">
              <div>
                <label className="block mb-1 font-semibold">Course Name</label>
                <input
                  type="text"
                  name="name"
                  value={newCourse.name}
                  onChange={handleInputChange}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">Description</label>
                <textarea
                  name="description"
                  value={newCourse.description}
                  onChange={handleInputChange}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">Date</label>
                <input
                  type="date"
                  name="date"
                  value={newCourse.date}
                  onChange={handleInputChange}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Create Course
              </button>
            </form>
          )}

          {courses.length === 0 ? (
            <p className="text-gray-500">No courses created yet.</p>
          ) : (
            <div className="space-y-4">
              {courses.map(course => (
                <div key={course._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-lg">{course.name}</h4>
                    <p className="text-gray-600 dark:text-gray-300">{course.description}</p>
                    <p className="text-sm text-gray-500">Date: {new Date(course.date).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/instructor/course/${course._id}`)}
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

export default InstructorClassroomDetail;
