import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentUser, getAuthHeaders } from '../utils/auth';
import { uploadMultipleToCloudinary } from '../utils/cloudinaryUpload';
import DashboardLayout from '../components/DashboardLayout';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Star, 
  Upload, 
  X, 
  ArrowLeft, 
  Target, 
  Plus, 
  FileText, 
  Tag, 
  Save 
} from 'lucide-react';

const CreateCourse = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [classroom, setClassroom] = useState(null);
  const [course, setCourse] = useState({
    name: '',
    description: '',
    date: '',
    duration: '',
    maxStudents: 50,
    materials: [],
    objectives: [''],
    requirements: [''],
    syllabus: '',
    category: 'general',
    difficulty: 'beginner',
    tags: []
  });
  const [newTag, setNewTag] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileUploading, setFileUploading] = useState(false);

  useEffect(() => {
    fetchClassroom();
  }, [classroomId]);

  const fetchClassroom = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/classrooms/${classroomId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setClassroom(data);
      } else {
        throw new Error('Failed to fetch classroom');
      }
    } catch (error) {
      console.error('Error fetching classroom:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourse(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (index, field, value) => {
    setCourse(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setCourse(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setCourse(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const uploadFiles = async (files) => {
    setFileUploading(true);
    try {
      // Upload multiple files to Cloudinary using the utility
      const newFiles = await uploadMultipleToCloudinary(files, 'smart-learning/materials');
      
      setUploadedFiles(prev => [...prev, ...newFiles]);
      setCourse(prev => ({
        ...prev,
        materials: [...prev.materials, ...newFiles.map(f => f.cloudinaryUrl)]
      }));
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setFileUploading(false);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setCourse(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !course.tags.includes(newTag.trim())) {
      setCourse(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setCourse(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...course,
        classroom: classroomId,
        instructor: localStorage.getItem('userId')
      };

      const response = await fetch('http://localhost:4000/api/courses', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        navigate(`/instructor/classroom/${classroomId}`);
      } else {
        throw new Error('Failed to create course');
      }
    } catch (error) {
      console.error('Error creating course:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!classroom) {
    return (
      <DashboardLayout role="instructor">
        <div className="px-4 py-6 bg-[#f6f8fb] dark:bg-gray-900 min-h-screen">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading classroom...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="instructor">
      <div className="px-4 py-6 bg-[#f6f8fb] dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(`/instructor/classroom/${classroomId}`)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Course</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Add a new course to {classroom.name}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-blue-600" />
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={course.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter course name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={course.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="general">General</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="science">Science</option>
                    <option value="language">Language</option>
                    <option value="history">History</option>
                    <option value="art">Art</option>
                    <option value="technology">Technology</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    name="difficulty"
                    value={course.difficulty}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={course.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={course.duration}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="e.g., 20"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Students
                  </label>
                  <input
                    type="number"
                    name="maxStudents"
                    value={course.maxStudents}
                    onChange={handleInputChange}
                    min="1"
                    max="200"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={course.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Describe what students will learn in this course..."
                />
              </div>
            </div>

            {/* Course Objectives */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <Target className="w-6 h-6 text-green-600" />
                Learning Objectives
              </h2>
              
              {course.objectives.map((objective, index) => (
                <div key={index} className="flex gap-3 mb-3">
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => handleArrayChange(index, 'objectives', e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    placeholder={`Learning objective ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('objectives', index)}
                    className="p-3 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => addArrayItem('objectives')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Objective
              </button>
            </div>

            {/* Course Requirements */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <Users className="w-6 h-6 text-purple-600" />
                Prerequisites & Requirements
              </h2>
              
              {course.requirements.map((requirement, index) => (
                <div key={index} className="flex gap-3 mb-3">
                  <input
                    type="text"
                    value={requirement}
                    onChange={(e) => handleArrayChange(index, 'requirements', e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder={`Requirement ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('requirements', index)}
                    className="p-3 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => addArrayItem('requirements')}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Requirement
              </button>
            </div>

            {/* Course Materials */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <FileText className="w-6 h-6 text-orange-600" />
                Course Materials
              </h2>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="mb-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">
                      Click to upload
                    </span>
                    <span className="text-gray-500 dark:text-gray-400"> or drag and drop</span>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={(e) => uploadFiles(Array.from(e.target.files))}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  PDF, DOC, PPT, TXT, JPG, PNG up to 10MB each
                </p>
                {fileUploading && (
                  <div className="mt-4 text-blue-600">Uploading files...</div>
                )}
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Uploaded Files</h3>
                  <div className="space-y-3">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{file.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <Tag className="w-6 h-6 text-indigo-600" />
                Course Tags
              </h2>
              
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  placeholder="Add a tag and press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                >
                  Add
                </button>
              </div>
              
              {course.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-lg text-sm font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Syllabus */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-teal-600" />
                Course Syllabus
              </h2>
              
              <textarea
                name="syllabus"
                value={course.syllabus}
                onChange={handleInputChange}
                rows="8"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                placeholder="Outline the course structure, topics, and schedule..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate(`/instructor/classroom/${classroomId}`)}
                className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Course
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateCourse;
