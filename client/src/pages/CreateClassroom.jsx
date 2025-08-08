// client/src/pages/CreateClassroom.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import ExcelTemplate from '../components/ExcelTemplate';

const CreateClassroom = () => {
  const navigate = useNavigate();
  const [classroomData, setClassroomData] = useState({
    name: '',
    description: '',
    date: '',
    course: '',
  });

  const [excelFile, setExcelFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid Excel file (.xlsx or .xls)');
        return;
      }
      
      setExcelFile(file);
      setError('');
    }
  };

  const handleChange = (e) => {
    setClassroomData({
      ...classroomData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', classroomData.name);
      formData.append('description', classroomData.description);
      formData.append('date', classroomData.date);
      formData.append('course', classroomData.course);
      
      if (excelFile) {
        formData.append('excelFile', excelFile);
      }

      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:4000/api/classrooms/create', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(`Classroom created successfully! Entry Code: ${response.data.entryCode}`);
      
      // Navigate to classrooms page after a short delay
      setTimeout(() => {
        navigate('/instructor/classrooms');
      }, 2000);

    } catch (error) {
      console.error('Error creating classroom:', error);
      setError(error.response?.data?.error || 'Failed to create classroom');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="instructor">
      <div className="p-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-indigo-900 dark:text-white">Create Classroom</h2>
        
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
              Classroom Name *
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter classroom name"
              value={classroomData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              placeholder="Enter classroom description"
              value={classroomData.description}
              onChange={handleChange}
              required
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date *
            </label>
            <input
              type="date"
              name="date"
              value={classroomData.date}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course *
            </label>
            <input
              type="text"
              name="course"
              placeholder="Enter course name"
              value={classroomData.course}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block font-medium text-gray-700 dark:text-gray-300">
              Upload Student List (Excel) - Optional
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Upload an Excel file with columns: name, email, studentId
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {excelFile && (
              <p className="text-sm text-green-600 dark:text-green-400">
                ✓ File selected: {excelFile.name}
              </p>
            )}
            <ExcelTemplate />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {loading ? 'Creating Classroom...' : 'Create Classroom'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateClassroom;
