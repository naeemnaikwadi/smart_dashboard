import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, List } from 'lucide-react';

const LiveSessionCalendar = ({ role = 'student', onSessionClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverAgenda, setHoverAgenda] = useState(null);

  useEffect(() => {
    fetchSessions();
    // Real-time updates
    const dateInterval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    const sessionInterval = setInterval(() => {
      fetchSessions(true);
    }, 30000);
    return () => {
      clearInterval(dateInterval);
      clearInterval(sessionInterval);
    };
  }, []);

  const fetchSessions = async (isRefresh = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/api/live-sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data || []);
    } catch (error) {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const today = new Date();
  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Map sessions by date
  const sessionMap = {};
  sessions.forEach(session => {
    const dateStr = new Date(session.date).toDateString();
    if (!sessionMap[dateStr]) sessionMap[dateStr] = [];
    sessionMap[dateStr].push(session);
  });

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <button
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
        >&#8592;</button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
        >&#8594;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 w-full text-xs mb-1">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="text-center text-gray-500 dark:text-gray-400 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 w-full border rounded-lg bg-gray-50 dark:bg-gray-800 p-1">
        {days.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const dateStr = day.toDateString();
          const daySessions = sessionMap[dateStr] || [];
          const isToday = day.toDateString() === today.toDateString();
          return (
            <div
              key={dateStr}
              className={`relative flex flex-col items-center justify-center h-16 rounded-lg transition-colors
                ${isToday ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 font-bold' : 'hover:bg-blue-50 dark:hover:bg-gray-700'}
                ${daySessions.length > 0 ? 'cursor-pointer' : ''}`}
              onMouseLeave={() => setHoverAgenda(null)}
            >
              <span className={`text-sm ${isToday ? 'font-bold text-blue-900 dark:text-blue-200' : 'text-gray-800 dark:text-white'}`}>
                {day.getDate()}
              </span>
              {/* Dots for sessions */}
              <div className="flex gap-1 mt-1">
                {daySessions.map((session, idx2) => {
                  const sessionDate = new Date(session.date);
                  const sessionEnd = new Date(session.date + 'T' + session.endTime);
                  let dotColor = 'bg-green-500';
                  if (session.status === 'live') dotColor = 'bg-yellow-400';
                  else if (sessionEnd < today) dotColor = 'bg-red-500';
                  return (
                    <span
                      key={idx2}
                      className={`w-3 h-3 rounded-full ${dotColor} cursor-pointer border-2 border-white shadow`}
                      onMouseEnter={e => setHoverAgenda({ agenda: session.agenda, title: session.title, time: session.startTime, status: session.status, left: e.clientX, top: e.clientY })}
                    />
                  );
                })}
              </div>
              {/* Agenda Tooltip */}
              {hoverAgenda && hoverAgenda.left && hoverAgenda.top && (
                <div
                  className="fixed z-50 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white rounded shadow-lg px-2 py-1 border border-gray-200 dark:border-gray-700 min-w-[140px]"
                  style={{ left: hoverAgenda.left + 10, top: hoverAgenda.top - 10 }}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <List className="w-3 h-3 text-blue-500" />
                    <span className="font-semibold">{hoverAgenda.title}</span>
                  </div>
                  <div>Status: <span className={hoverAgenda.status === 'completed' ? 'text-red-500' : hoverAgenda.status === 'live' ? 'text-yellow-500' : 'text-green-500'}>{hoverAgenda.status}</span></div>
                  <div>Time: {hoverAgenda.time}</div>
                  <div>Agenda: {hoverAgenda.agenda || 'No agenda'}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-900/60 rounded-lg">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
        </div>
      )}
    </div>
  );
};

export default LiveSessionCalendar;
