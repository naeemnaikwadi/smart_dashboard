// components/StudentDetails.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Edit, Save, X, Camera, Upload, User, Mail, Phone, MapPin, BookOpen, Target, TrendingUp, Award, Clock } from 'lucide-react';
import TimeSpentChart from './charts/TimeSpentChart';
import ImprovementGraph from './charts/ImprovementGraph';
import PieChart from './charts/PieChart';

const StudentDetails = ({ student, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (student) {
      setEditedStudent({ ...student });
    }
  }, [student]);

  if (!student) return <p className="text-gray-500">Loading student info...</p>;

  const handleEdit = () => {
    setIsEditing(true);
    setEditedStudent({ ...student });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedStudent({ ...student });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Add student data
      Object.keys(editedStudent).forEach(key => {
        if (key !== 'profileImage' && key !== '_id' && key !== '__v' && key !== 'profileImageUrl') {
          formData.append(key, editedStudent[key]);
        }
      });
      
      // Add profile image if selected
      if (selectedImage) {
        formData.append('profileImage', selectedImage);
      }
      
      // Try different endpoints for updating student
      let response;
      try {
        // First try the student endpoint
        response = await axios.put(`http://localhost:4000/api/student/${student._id}`, formData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } catch (studentError) {
        if (studentError.response?.status === 404) {
          // If student endpoint doesn't exist, try users endpoint
          console.log('Student endpoint not found, trying users endpoint');
          response = await axios.put(`http://localhost:4000/api/users/${student._id}`, formData, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
        } else {
          throw studentError;
        }
      }
      
      if (response.data) {
        setIsEditing(false);
        setSelectedImage(null);
        if (onUpdate) {
          onUpdate(response.data);
        }
        // Show success message
        alert('Student information updated successfully!');
      }
    } catch (error) {
      console.error('Error updating student:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update student information. Please try again.';
      alert(errorMessage);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Preview the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditedStudent(prev => ({
          ...prev,
          profileImageUrl: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;
    
    setUploadingImage(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profileImage', selectedImage);
      
      const response = await axios.post(`http://localhost:4000/api/student/${student._id}/profile-image`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data) {
        setSelectedImage(null);
        if (onUpdate) {
          onUpdate(response.data);
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          {student.name}'s Details
        </h2>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Profile Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Profile Image */}
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-600 shadow-lg">
              {editedStudent?.profileImageUrl || student.profileImageUrl ? (
                <img
                  src={editedStudent?.profileImageUrl || student.profileImageUrl}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          {isEditing && selectedImage && (
            <button
              onClick={handleImageUpload}
              disabled={uploadingImage}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {uploadingImage ? 'Uploading...' : 'Upload Image'}
            </button>
          )}
        </div>

        {/* Basic Info */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="inline w-4 h-4 mr-2" />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedStudent?.name || ''}
                  onChange={(e) => setEditedStudent(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 dark:text-white font-medium">{student.name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="inline w-4 h-4 mr-2" />
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedStudent?.email || ''}
                  onChange={(e) => setEditedStudent(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{student.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Phone className="inline w-4 h-4 mr-2" />
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedStudent?.phone || ''}
                  onChange={(e) => setEditedStudent(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{student.phone || 'Not provided'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="inline w-4 h-4 mr-2" />
                Address
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedStudent?.address || ''}
                  onChange={(e) => setEditedStudent(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter address"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{student.address || 'Not provided'}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <BookOpen className="inline w-4 h-4 mr-2" />
                Classroom
              </label>
              <p className="text-gray-900 dark:text-white">{student.classroom?.name || 'Not assigned'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Target className="inline w-4 h-4 mr-2" />
                Course
              </label>
              <p className="text-gray-900 dark:text-white">{student.course?.name || 'Not enrolled'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <TrendingUp className="inline w-4 h-4 mr-2" />
                Progress
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editedStudent?.progress || 0}
                  onChange={(e) => setEditedStudent(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 dark:text-white font-medium">{student.progress || 0}%</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Award className="inline w-4 h-4 mr-2" />
                Status
              </label>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                (student.progress || 0) >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                (student.progress || 0) >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {(student.progress || 0) >= 80 ? 'Excellent' :
                 (student.progress || 0) >= 50 ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
          <h3 className="font-semibold dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Time Spent Analysis
          </h3>
          <TimeSpentChart data={student.timeSpentData || []} />
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
          <h3 className="font-semibold dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Progress Overview
          </h3>
          <ImprovementGraph data={student.improvementData || []} />
        </div>
      </div>

      {/* Pie Chart for Subject Distribution */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
        <h3 className="font-semibold dark:text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          Subject Performance Distribution
        </h3>
        <PieChart 
          data={student.subjectPerformance || []} 
          title="Subject Performance"
          height={250}
        />
      </div>
    </div>
  );
};

export default StudentDetails;
