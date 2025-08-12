import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getAuthHeaders } from '../utils/auth';
import DashboardLayout from '../components/DashboardLayout';
import { User, Mail, Shield, Edit3, Save, X, Camera } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setLoading(false);
    }
  }, [currentUser?.name, currentUser?.email]); // Only depend on specific fields, not the entire object

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEdit = () => {
    setEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
    setSuccess('');
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return;

    setUploadingPhoto(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('photo', selectedPhoto);

      const response = await fetch('http://localhost:4000/api/users/profile-photo', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const result = await response.json();
      
      // Update local storage and state
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { ...currentUser, avatarUrl: result.avatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Also update userName if it exists separately
      if (localStorage.getItem('userName')) {
        localStorage.setItem('userName', updatedUser.name);
      }
      
      setUser(updatedUser);
      setSuccess('Profile photo updated successfully!');
      setSelectedPhoto(null);
      setPhotoPreview(null);
      
      // Update the user context without page reload
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
    } catch (error) {
      setError('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate password change if attempting to change password
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        setError('Current password is required to change password');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters long');
        return;
      }
    }

    try {
      const updateData = {
        name: formData.name,
        email: formData.email
      };

      // Only include password fields if changing password
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch(`http://localhost:4000/api/users/profile`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        // Update local storage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Also update userName if it exists separately
        if (localStorage.getItem('userName')) {
          localStorage.setItem('userName', updatedUser.name);
        }
        
        setUser(updatedUser);
        setEditing(false);
        setSuccess('Profile updated successfully!');
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));

        // Update the user context without page reload
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <DashboardLayout role={user?.role || 'student'}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout role="student">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            User Not Found
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Unable to load user information. Please try logging in again.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={user.role || 'student'}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage your account information and preferences
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 text-white">
            <div className="flex items-center space-x-6">
              <div className="relative">
                {user.avatarUrl && user.avatarUrl !== '/uploads/default-avatar.png' ? (
                  <img 
                    src={`http://localhost:4000${user.avatarUrl}`} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-white/20"
                  />
                ) : (
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                {editing && (
                  <label className="absolute -bottom-2 -right-2 bg-white text-gray-700 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <Camera size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-blue-100">{user.email}</p>
                <div className="flex items-center mt-2">
                  <Shield size={16} className="mr-2" />
                  <span className="text-sm capitalize">{user.role}</span>
                </div>
              </div>
            </div>
            
            {/* Photo Upload Section */}
            {editing && selectedPhoto && (
              <div className="mt-6 p-4 bg-white/10 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden">
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedPhoto.name}</p>
                    <p className="text-xs text-blue-100">
                      {(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                    >
                      {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPhoto(null);
                        setPhotoPreview(null);
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User size={16} className="inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      editing 
                        ? 'border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600' 
                        : 'border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600'
                    }`}
                    required
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail size={16} className="inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      editing 
                        ? 'border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600' 
                        : 'border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600'
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Password Change Section */}
              {editing && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Change Password
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Leave password fields empty if you don't want to change your password
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                {!editing ? (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit3 size={16} className="mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save size={16} className="mr-2" />
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
