import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  FileText, 
  Video, 
  Link, 
  Search, 
  Filter, 
  BookOpen, 
  Calendar,
  Eye,
  ArrowDown,
  FolderOpen
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import DocumentViewer from '../components/DocumentViewer';

const StudentDownloads = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedClassroom, setSelectedClassroom] = useState('all');
  const [classrooms, setClassrooms] = useState([]);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (classrooms.length > 0) {
      loadDownloadedMaterials();
    }
  }, [classrooms]);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData._id || userData.id;

      if (!token || !userId) {
        setError('Authentication required');
        return;
      }

      // Load classrooms first
      await loadClassrooms(token, userId);
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
    }
  };

  const loadClassrooms = async (token, userId) => {
    try {
      const response = await fetch('http://localhost:4000/api/classrooms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const allClassrooms = await response.json();
        const enrolledClassrooms = allClassrooms.filter(classroom => 
          classroom.students?.some(studentId => studentId.toString() === userId)
        );
        setClassrooms(enrolledClassrooms);
      } else {
        console.warn('Failed to load classrooms:', response.status);
        setClassrooms([]);
      }
    } catch (error) {
      console.error('Error loading classrooms:', error);
      setClassrooms([]);
    }
  };

  const loadDownloadedMaterials = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData._id || userData.id;

      // Get learning paths for enrolled classrooms
      const learningPathsResponse = await fetch('http://localhost:4000/api/learning-paths', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (learningPathsResponse.ok) {
        const allPaths = await learningPathsResponse.json();
        
        // Filter paths by enrolled classrooms
        const enrolledPaths = allPaths.filter(path => 
          classrooms.some(classroom => 
            classroom.courses?.some(course => course.toString() === path.courseId?.toString())
          )
        );

        // Extract materials from learning paths
        const allMaterials = [];
        enrolledPaths.forEach(path => {
          if (path.resources && path.resources.length > 0) {
            path.resources.forEach(resource => {
              if (resource.uploadedFile) {
                allMaterials.push({
                  id: `${path._id}-${resource._id || Math.random()}`,
                  title: resource.title,
                  type: resource.type,
                  filename: resource.uploadedFile,
                  originalName: resource.originalName || resource.title,
                  size: resource.size || 0,
                  uploadedAt: resource.uploadedAt || new Date(),
                  courseName: path.courseName || 'Unknown Course',
                  classroomName: path.classroomName || 'Unknown Classroom',
                  pathName: path.title,
                  downloadCount: resource.downloadCount || 0
                });
              }
            });
          }
        });

        setMaterials(allMaterials);
      } else {
        console.warn('Failed to load learning paths:', learningPathsResponse.status);
        setMaterials([]);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
      setError('Failed to load downloaded materials');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type) => {
    if (type?.includes('video') || type?.includes('mp4') || type?.includes('avi')) {
      return <Video className="w-5 h-5 text-red-500" />;
    } else if (type?.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-600" />;
    } else if (type?.includes('image')) {
      return <FileText className="w-5 h-5 text-green-500" />;
    } else {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  const getFileTypeLabel = (type) => {
    if (type?.includes('video')) return 'Video';
    if (type?.includes('pdf')) return 'PDF';
    if (type?.includes('image')) return 'Image';
    if (type?.includes('document')) return 'Document';
    return 'File';
  };

  const handleDownload = (material) => {
    const link = document.createElement('a');
    link.href = `http://localhost:4000/uploads/${material.filename}`;
    link.download = material.originalName || material.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (material) => {
    setSelectedDocument([material]);
    setShowDocumentViewer(true);
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.classroomName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || material.type?.includes(selectedType);
    const matchesClassroom = selectedClassroom === 'all' || material.classroomName === selectedClassroom;
    
    return matchesSearch && matchesType && matchesClassroom;
  });

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FolderOpen className="w-8 h-8 text-blue-600" />
                My Downloads
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Access all your downloaded learning materials and resources
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{materials.length}</div>
              <div className="text-sm text-gray-500">Total Materials</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search materials, courses, or classrooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="video">Videos</option>
                <option value="pdf">PDFs</option>
                <option value="image">Images</option>
                <option value="document">Documents</option>
              </select>
              
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Classrooms</option>
                {classrooms.map(classroom => (
                  <option key={classroom._id} value={classroom.name}>
                    {classroom.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Materials Grid */}
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {materials.length === 0 ? 'No Materials Downloaded Yet' : 'No Materials Found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {materials.length === 0 
                ? 'Start learning to see your downloaded materials here.'
                : 'Try adjusting your search or filters.'
              }
            </p>
            {materials.length === 0 && (
              <button
                onClick={() => navigate('/learning-paths')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Explore Learning Paths
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => (
              <div key={material.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getFileIcon(material.type)}
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {getFileTypeLabel(material.type)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(material.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {material.title}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span className="truncate">{material.courseName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="truncate">{material.classroomName}</span>
                    </div>
                    {material.size > 0 && (
                      <div className="text-xs">
                        Size: {(material.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(material)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(material)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowDown className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      {showDocumentViewer && (
        <DocumentViewer
          documents={selectedDocument}
          onClose={() => {
            setShowDocumentViewer(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default StudentDownloads;
