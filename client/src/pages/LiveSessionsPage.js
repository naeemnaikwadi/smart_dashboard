import { useEffect, useState } from 'react';
import axios from 'axios';

export default function LiveSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await axios.get('http://localhost:4000/api/live-sessions');
        setSessions(res.data);
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Scheduled Live Sessions
      </h1>

      {loading ? (
        <p className="text-gray-600 dark:text-gray-300">Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No live sessions scheduled.</p>
      ) : (
        <ul className="space-y-4">
          {sessions.map((s) => (
            <li key={s._id} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{s.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {new Date(s.date).toLocaleString()}
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
