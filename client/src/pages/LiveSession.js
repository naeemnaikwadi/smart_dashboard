import { useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

export default function LiveSession() {
  const [form, setForm] = useState({ title: '', description: '', date: '' });
  const [status, setStatus] = useState('');
  const [joinLink, setJoinLink] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Save session to your DB
      await axios.post('http://localhost:4000/api/live-sessions', {
        ...form,
        instructor: 'Instructor A',
      });

      // 2. Create LiveKit Room
      await axios.post('http://localhost:4000/api/livekit/create-room', {
        roomName: form.title,
      });

      // 3. Generate join link for students
      const joinUrl = `http://localhost:3000/student/join/${form.title}/Alice`;
      setJoinLink(joinUrl);
      setStatus('✅ Session created successfully!');
      setForm({ title: '', description: '', date: '' });
    } catch (err) {
      console.error(err);
      setStatus('❌ Failed to create session.');
    }
  };

  return (
    <DashboardLayout role="instructor">
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Create Live Session</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="title" value={form.title} onChange={handleChange} placeholder="Session Title" required
            className="w-full p-2 border rounded" />
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description"
            className="w-full p-2 border rounded" />
          <input type="datetime-local" name="date" value={form.date} onChange={handleChange} required
            className="w-full p-2 border rounded" />
          
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Create Session
          </button>
        </form>

        {status && <p className="mt-4 text-gray-700">{status}</p>}
        {joinLink && (
          <p className="mt-2 text-sm">
            👉 Share with students:<br />
            <a href={joinLink} className="text-blue-600 underline" target="_blank" rel="noreferrer">
              {joinLink}
            </a>
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
