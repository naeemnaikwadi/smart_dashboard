import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

const StudentClassroomDetail = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="p-6 max-w-5xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading classroom details...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{classroom?.name} - Courses</h2>
          <button
            onClick={() => navigate('/student/classrooms')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Classrooms
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow mb-6">
          <h3 className="text-xl font-bold mb-4">Classroom Details</h3>
          <p><strong>Name:</strong> {classroom?.name}</p>
          <p><strong>Description:</strong> {classroom?.description}</p>
          <p><strong>Instructor:</strong> {classroom?.instructor?.name}</p>
          <p><strong>Students:</strong> {classroom?.students?.length || 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <h3 className="text-xl font-bold mb-4">Available Courses</h3>
          {courses.length === 0 ? (
            <p className="text-gray-500">No courses available yet.</p>
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

export default StudentClassroomDetail;
