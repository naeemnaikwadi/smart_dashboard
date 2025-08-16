import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export default function LiveSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassroom, setSelectedClassroom] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:4000/api/live-sessions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSessions(res.data);
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const classrooms = useMemo(() => {
    const set = new Set();
    sessions.forEach(s => {
      const name = s.classroom?.name || 'Unknown';
      set.add(name);
    });
    return Array.from(set);
  }, [sessions]);

  const courses = useMemo(() => {
    const set = new Set();
    sessions.forEach(s => {
      const name = s.courseId?.name || 'Unknown';
      if (s.courseId) set.add(name);
    });
    return Array.from(set);
  }, [sessions]);

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      const clsOk = selectedClassroom === 'all' || (s.classroom?.name || 'Unknown') === selectedClassroom;
      const courseOk = selectedCourse === 'all' || (s.courseId?.name || 'Unknown') === selectedCourse;
      return clsOk && courseOk;
    });
  }, [sessions, selectedClassroom, selectedCourse]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Scheduled Live Sessions
      </h1>

      {/* Filters */}
      {!loading && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-4 flex flex-col md:flex-row gap-3">
          <select
            value={selectedClassroom}
            onChange={e => setSelectedClassroom(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"
          >
            <option value="all">All Classrooms</option>
            {classrooms.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"
          >
            <option value="all">All Courses</option>
            {courses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p className="text-gray-600 dark:text-gray-300">Loading sessions...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No live sessions scheduled.</p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((s) => (
            <li key={s._id} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{s.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {new Date(s.date).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Classroom: {s.classroom?.name || 'Unknown'} {s.courseId?.name ? `• Course: ${s.courseId.name}` : ''}
              </p>
              <a
                href={s.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                Join Now
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
