import { useEffect, useState } from 'react';
import LiveSessionRoom from '../components/LiveSessionRoom';

export default function LiveSessionsPage() {
  const [token, setToken] = useState('');
  const url = 'ws://localhost:7880'; // Local LiveKit server

  useEffect(() => {
    const fetchToken = async () => {
      const res = await fetch(`http://localhost:5000/api/livekit/join-room?roomName=test-room&identity=student123`);
      const data = await res.json();
      setToken(data.token);
    };
    fetchToken();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">📺 Live Class Room</h2>
      <LiveSessionCard sessions={sessions} />
      {token ? <LiveSessionRoom url={url} token={token} /> : <p>Loading session...</p>}
    </div>
  );
}
