import React, { useEffect, useState } from 'react';
import socket from '../services/socket';

export default function LiveSession({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    socket.emit('joinSession', sessionId);
    socket.on('chatMessage', (msg) => setMessages((prev) => [...prev, msg.message]));
    return () => { socket.off('chatMessage'); };
  }, [sessionId]);

  const sendMessage = () => {
    socket.emit('chatMessage', { sessionId, message: input });
    setInput('');
  };

  return (
    <div>
      <h2>Live Chat</h2>
      <div>{messages.map((m, i) => <div key={i}>{m}</div>)}</div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}