import { useState } from 'react';
import axios from 'axios';

const CreateLiveSession = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [joinLink, setJoinLink] = useState(''); // ✅ Add this line

  const handleCreateSession = async () => {
    try {
        const generatedLink = `http://localhost:4000/student/join/${title}/Alice`; // ✅ Define it first

      // Save session to backend
      await axios.post('http://localhost:4000/api/sessions', {
        title,
        description,
        date,
        instructor: 'Instructor A', // ✅ Add this (or get from auth)
        link: generatedLink,         // ✅ Save join link to DB
      });

      // Create LiveKit room
      await axios.post('http://localhost:5000/api/livekit/create-room', {
        roomName: title,
      });

      setJoinLink(`http://localhost:4000/student/join/${title}/Alice`);
      setStatus(`✅ Session and room "${title}" created successfully`);

      setTitle('');
      setDescription('');
      setDate('');
    } catch (err) {
      console.error(err);
      setStatus('❌ Failed to create session or room');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Create Live Session</h2>

      <input
        type="text"
        placeholder="Session Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />

      <button
        onClick={handleCreateSession}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Create Session
      </button>

      {status && <p className="mt-4 text-sm text-gray-700">{status}</p>}
      {joinLink && (
        <p className="mt-2 text-sm">
          👉 Share with students:<br />
          <a href={joinLink} className="text-blue-600 underline" target="_blank" rel="noreferrer">
            {joinLink}
          </a>
        </p>
      )}
    </div>
  );
};

export default CreateLiveSession;
