import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import StudentList from "../components/StudentList";
import StudentDetails from "../components/StudentDetails";
import axios from "axios";
import { Users, Filter, RefreshCw, Search, TrendingUp } from 'lucide-react';

export default function StudentInfo() {
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filters, setFilters] = useState({ classroom: "", course: "" });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    averageProgress: 0
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, filters, searchTerm]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch classrooms and courses in parallel
      const [classroomsRes, coursesRes] = await Promise.all([
        axios.get("/api/classrooms/filters", { headers }),
        axios.get("/api/courses", { headers })
      ]);

      setClassrooms(classroomsRes.data.classrooms || []);
      setCourses(coursesRes.data || []);

      // Fetch initial student data
      await fetchStudents();
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load initial data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setRefreshing(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get("/api/student/info", {
        headers,
        params: filters
      });

      setStudents(res.data || []);
      calculateStats(res.data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load student information. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const calculateStats = (studentData) => {
    const totalStudents = studentData.length;
    const activeStudents = studentData.filter(student => 
      student.progress && student.progress > 0
    ).length;
    const averageProgress = totalStudents > 0 
      ? Math.round(studentData.reduce((sum, student) => sum + (student.progress || 0), 0) / totalStudents)
      : 0;

    setStats({
      totalStudents,
      activeStudents,
      averageProgress
    });
  };

  const filterStudents = () => {
    let filtered = [...students];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply classroom filter
    if (filters.classroom) {
      filtered = filtered.filter(student =>
        student.classroom?._id === filters.classroom ||
        student.classroom === filters.classroom
      );
    }

    // Apply course filter
    if (filters.course) {
      filtered = filtered.filter(student =>
        student.course?._id === filters.course ||
        student.course === filters.course
      );
    }

    setFilteredStudents(filtered);
  };

  const handleFilterChange = async (e) => {
    const updatedFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(updatedFilters);
    
    // Fetch students with new filters
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get("/api/student/info", {
        headers,
        params: updatedFilters
      });

      setStudents(res.data || []);
      calculateStats(res.data || []);
    } catch (err) {
      console.error('Error fetching filtered students:', err);
      setError('Failed to load filtered student data.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleStudentSelect = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(`/api/student/details/${id}`, { headers });
      setSelectedStudent(res.data);
    } catch (err) {
      console.error('Error fetching student details:', err);
      setError('Failed to load student details.');
    }
  };

  const handleRefresh = () => {
    fetchStudents();
  };

  const clearFilters = () => {
    setFilters({ classroom: "", course: "" });
    setSearchTerm('');
  };

  if (loading) {
    return (
      <DashboardLayout role="instructor">
        <div className="p-6 space-y-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="instructor">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Information</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Monitor student performance and progress across all classrooms
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeStudents}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageProgress}%</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Search className="inline w-4 h-4 mr-2" />
                Search Students
              </label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Filter className="inline w-4 h-4 mr-2" />
                  Classroom
                </label>
                <select
                  name="classroom"
                  value={filters.classroom}
                  onChange={handleFilterChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">All Classrooms</option>
                  {classrooms.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Filter className="inline w-4 h-4 mr-2" />
                  Course
                </label>
                <select
                  name="course"
                  value={filters.course}
                  onChange={handleFilterChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">All Courses</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredStudents.length} of {students.length} students
          </div>
        </div>

        {/* Student List and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Students ({filteredStudents.length})
              </h2>
            </div>
            <StudentList 
              students={filteredStudents} 
              onSelect={handleStudentSelect}
              selectedStudentId={selectedStudent?._id}
            />
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
            {selectedStudent ? (
              <StudentDetails 
                student={selectedStudent} 
                onUpdate={(updatedStudent) => {
                  setStudents(prev => prev.map(s => s._id === updatedStudent._id ? updatedStudent : s));
                  setSelectedStudent(updatedStudent);
                }}
              />
            ) : (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a student to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
