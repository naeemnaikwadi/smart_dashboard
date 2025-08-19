import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, Info } from 'lucide-react';

const getDaysInMonth = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  return days;
};

const CompactLiveSessionCalendar = ({ instructorId, height = 220 }) => {
  const [sessions, setSessions] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoverAgenda, setHoverAgenda] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:4000/api/live-sessions/instructor/${instructorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSessions(res.data || []);
      } catch (err) {
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    if (instructorId) fetchSessions();
  }, [instructorId, currentDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Map sessions by date
  const sessionMap = {};
  sessions.forEach(session => {
    const dateStr = new Date(session.date).toDateString();
    if (!sessionMap[dateStr]) sessionMap[dateStr] = [];
    sessionMap[dateStr].push(session);
  });

  const today = new Date();

  return (
    <div style={{ height , width: '100%' }} className="flex flex-col">
      <div className="flex items-center justify-between w-full ">
        <button
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
        >
          &#8592;
        </button>
        <span className="font-semibold text-gray-800 dark:text-white text-lg">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
        >
          &#8594;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 w-full text-xs mb-2">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="text-center text-gray-500 dark:text-gray-400 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 w-full border rounded-lg bg-gray-50 dark:bg-gray-800 p-2 flex-1">
        {Array(firstDayOfWeek).fill(null).map((_, i) => (
          <div key={i} />
        ))}
        {days.map(day => {
          const dateStr = day.toDateString();
          const daySessions = sessionMap[dateStr] || [];
          const isToday = day.toDateString() === today.toDateString();
          return (
            <div
              key={dateStr}
              className={`relative flex flex-col items-center justify-center h-12 w-full rounded-lg transition-colors
                ${isToday ? 'bg-blue-200 dark:bg-blue-900 border-2 border-blue-500 font-bold' : 'hover:bg-blue-100 dark:hover:bg-gray-700'}
                ${daySessions.length > 0 ? 'cursor-pointer' : ''}`}
              onMouseLeave={() => setHoverAgenda(null)}
            >
              <span className={`text-sm ${isToday ? 'font-bold text-blue-900 dark:text-blue-200' : 'text-gray-800 dark:text-white'}`}>
                {day.getDate()}
              </span>
              {/* Dots for sessions */}
              <div className="flex gap-1 mt-1">
                {daySessions.map((session, idx) => {
                  const sessionDate = new Date(session.date);
                  const sessionEnd = new Date(session.date + 'T' + session.endTime);
                  const isPast = sessionEnd < today;
                  const dotColor = isPast ? 'bg-red-500' : 'bg-green-500';
                  return (
                    <span
                      key={idx}
                      className={`w-3 h-3 rounded-full ${dotColor} cursor-pointer border-2 border-white shadow`}
                      onMouseEnter={e => setHoverAgenda({ agenda: session.agenda, title: session.title, time: session.startTime, status: isPast ? 'Expired' : 'Upcoming', x: day.getDate(), y: idx, left: e.clientX, top: e.clientY })}
                    />
                  );
                })}
              </div>
              {/* Agenda Tooltip */}
              {hoverAgenda && hoverAgenda.x === day.getDate() && hoverAgenda.y < daySessions.length && (
                <div
                  className="fixed z-50 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white rounded shadow-lg px-2 py-1 border border-gray-200 dark:border-gray-700 min-w-[140px]"
                  style={{ left: hoverAgenda.left + 10, top: hoverAgenda.top - 10 }}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <Info className="w-3 h-3 text-blue-500" />
                    <span className="font-semibold">{hoverAgenda.title}</span>
                  </div>
                  <div>Status: <span className={hoverAgenda.status === 'Expired' ? 'text-red-500' : 'text-green-500'}>{hoverAgenda.status}</span></div>
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

export default CompactLiveSessionCalendar;
