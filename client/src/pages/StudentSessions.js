import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

export default function StudentSessions() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:4000/api/live-sessions')
      .then(res => setSessions(res.data))
      .catch(() => alert('Failed to load sessions'));
  }, []);

  return (
    <DashboardLayout role="student">
      <div>
        <h2 className="text-2xl font-bold mb-4">Upcoming Live Sessions</h2>
        <div className="grid gap-4">
          {sessions.map(session => (
            <div key={session._id} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <h3 className="text-xl font-semibold">{session.title}</h3>
              <p>{session.description}</p>
              <p className="text-sm text-gray-500">Date: {new Date(session.date).toLocaleString()}</p>
              <a href={session.link} target="_blank" rel="noopener noreferrer"
                 className="inline-block mt-2 text-blue-600 hover:underline">
                Join Session
              </a>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
