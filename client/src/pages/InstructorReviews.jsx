import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Star, Filter, Users, Calendar, ArrowLeft, ExternalLink } from 'lucide-react';

const InstructorReviews = () => {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const instructorId = user?._id || user?.id;

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError('');
        // Fetch classrooms for filter dropdown
        const clsRes = await fetch('http://localhost:4000/api/classrooms/filters', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (clsRes.ok) {
          const data = await clsRes.json();
          setClassrooms(data.classrooms || []);
        }
        // Fetch instructor courses
        const crsRes = await fetch(`http://localhost:4000/api/courses/instructor/${instructorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (crsRes.ok) {
          const data = await crsRes.json();
          setCourses(data || []);
        }
      } catch (e) {
        setError('Failed to load filters');
      } finally {
        setLoading(false);
      }
    };
    if (instructorId && token) init();
  }, [instructorId, token]);

  const filteredCourses = useMemo(() => {
    if (selectedClassroom === 'all') return courses;
    return courses.filter(c => (c.classroom?._id || c.classroom) === selectedClassroom);
  }, [courses, selectedClassroom]);

  useEffect(() => {
    const loadRatings = async () => {
      try {
        setRatings([]);
        setError('');
        if (selectedCourse === 'all') return;
        const res = await fetch(`http://localhost:4000/api/courses/${selectedCourse}/ratings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRatings(Array.isArray(data) ? data : []);
        } else {
          setError('Failed to load ratings');
        }
      } catch (e) {
        setError('Failed to load ratings');
      }
    };
    loadRatings();
  }, [selectedCourse, token]);

  const handleGoToCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  return (
    <DashboardLayout role="instructor">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/instructor')}
              className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-500" /> Course Reviews
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">View and filter ratings by classroom and course.</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
          <div className="flex items-center gap-3 mb-3 text-gray-700 dark:text-gray-300">
            <Filter className="w-4 h-4" /> Filters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={selectedClassroom}
              onChange={e => { setSelectedClassroom(e.target.value); setSelectedCourse('all'); }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Classrooms</option>
              {classrooms.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Courses</option>
              {filteredCourses.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Courses Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredCourses.map(course => (
            <div key={course._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{course.name}</h3>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="font-medium text-gray-900 dark:text-white">{course.averageRating?.toFixed(1) || 0}</span>
                  <span className="text-xs text-gray-500">({course.totalRatings || 0})</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{course.description}</p>
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
                <Users className="w-4 h-4" /> Classroom: {course.classroom?.name || '—'}
              </div>
              <button
                onClick={() => handleGoToCourse(course._id)}
                className="mt-3 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Go to Course
              </button>
            </div>
          ))}
        </div>

        {/* Ratings List */}
        {selectedCourse !== 'all' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Ratings</h2>
              <div className="text-sm text-gray-500">{ratings.length} reviews</div>
            </div>
            {ratings.length === 0 ? (
              <div className="p-6 text-gray-600 dark:text-gray-300">No ratings yet for this course.</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {ratings.map(r => (
                  <div key={r._id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < (r.rating || 0) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                          ))}
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{r.rating}/5</span>
                        </div>
                        {r.review && (
                          <p className="mt-2 text-gray-700 dark:text-gray-300">{r.review}</p>
                        )}
                        <div className="mt-2 text-xs text-gray-500">By: {r.userName || 'Anonymous'}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <Calendar className="w-4 h-4" /> {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                        <button
                          onClick={() => handleGoToCourse(selectedCourse)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Course
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InstructorReviews;


