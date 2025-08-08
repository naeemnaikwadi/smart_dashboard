import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css';

const localizer = momentLocalizer(moment);

const CustomToolbar = ({ label, onNavigate, onView }) => (
  <div>
    {/* Line 1: Arrows, Today, Views - all in one line */}
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <button onClick={() => onNavigate('PREV')} className="px-2 py-1 border rounded">←</button>
        <button onClick={() => onNavigate('TODAY')} className="px-2 py-1 border rounded">Today</button>
        <button onClick={() => onNavigate('NEXT')} className="px-2 py-1 border rounded">→</button>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onView('month')} className="px-2 py-1 border rounded">Month</button>
        <button onClick={() => onView('week')} className="px-2 py-1 border rounded">Week</button>
        <button onClick={() => onView('day')} className="px-2 py-1 border rounded">Day</button>
        <button onClick={() => onView('agenda')} className="px-2 py-1 border rounded">Agenda</button>
      </div>
    </div>

    {/* Line 2: Month and Year centered below */}
    <div className="text-center text-sm text-gray-450 mt-1 ">
      {label}
    </div>
  </div>
);

const LiveSessionCalendar = () => {
  const dummyEvents = [
    {
      title: "Live AI Class",
      start: new Date(2025, 7, 2, 14, 0),
      end: new Date(2025, 7, 2, 15, 0),
    },
    {
      title: "Project Q&A",
      start: new Date(2025, 7, 5, 10, 30),
      end: new Date(2025, 7, 5, 11, 30),
    },
  ];

  return (
<div className="w-full max-w-[600px] mx-auto h-[268px] bg-white dark:bg-gray-900 rounded-lg shadow p-3 scale-[0.95]">
<Calendar
        localizer={localizer}
        events={dummyEvents}
        startAccessor="start"
        endAccessor="end"
        defaultView="month"
        views={['month', 'week', 'day', 'agenda']}
        components={{ toolbar: CustomToolbar }}
        style={{ height: '100%' }}
      />
    </div>
  );
  
};

export default LiveSessionCalendar;
