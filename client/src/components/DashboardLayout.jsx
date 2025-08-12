import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearUser } from '../redux/userSlice';
import {
  Menu, Moon, Sun, ChevronDown,
  LayoutDashboard, Video, Upload, Users, BookOpen,
  BadgeCheck, Calendar, Target, TrendingUp, Plus,
  Home,
  X,
  LogOut,
  Download
} from 'lucide-react';
import LiveSessionCalendar from './LiveSessionCalendar';


export default function DashboardLayout({ role, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) setUser(storedUser);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    const newTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    setIsDark(!isDark);
  };

  const logoutHandler = () => {
    dispatch(clearUser());
    navigate('/login');
  };

  const sidebarLinks = role === 'instructor'
    ? [
        { label: 'Dashboard', path: '/instructor', icon: <LayoutDashboard size={18} /> },
        { label: 'My Courses', path: '/instructor/courses', icon: <BookOpen size={18} /> },
        { label: 'Classrooms', path: '/instructor/classrooms', icon: <Users size={18} /> },
        { label: 'Student Management', path: '/student-info', icon: <Users size={18} /> },
        { label: 'Learning Paths', path: '/learning-paths', icon: <Target size={18} /> },
        { label: 'Live Sessions', path: '/live-sessions', icon: <Video size={18} /> },
        { label: 'Upload Materials', path: '/upload', icon: <Upload size={18} /> },
        // Calendar button will open modal, not navigate
        { label: 'Calendar', path: null, icon: <Calendar size={18} />, isCalendar: true },
        { label: 'Analytics', path: '/instructor/analytics', icon: <TrendingUp size={18} /> },
        { label: 'Profile', path: '/profile', icon: <BadgeCheck size={18} /> },
      ]
    : [
        { label: 'Dashboard', path: '/student', icon: <LayoutDashboard size={18} /> },
        { label: 'My Courses', path: '/student-courses', icon: <BookOpen size={18} /> },
        { label: 'Classrooms', path: '/student/classrooms', icon: <Users size={18} /> },
        { label: 'Learning Paths', path: '/learning-paths', icon: <Target size={18} /> },
        { label: 'Live Sessions', path: '/student/live-sessions', icon: <Video size={18} /> },
        { label: 'Downloads', path: '/student/downloads', icon: <Download size={18} /> },
        // Calendar button will open modal, not navigate
        { label: 'Calendar', path: null, icon: <Calendar size={18} />, isCalendar: true },
        { label: 'Certificates', path: '/certificates', icon: <BadgeCheck size={18} /> },
        { label: 'Profile', path: '/profile', icon: <BadgeCheck size={18} /> },
      ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 dark:text-white transition-colors duration-300">
      {/* Sidebar - Fixed and Static */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 md:translate-x-0`}>
        <div className="flex flex-col h-full p-6 justify-between overflow-y-auto">
          <div>
            {/* Sidebar Title */}
            <h2 className="text-2xl font-bold mb-6 text-primary dark:text-white">
              {role === 'instructor' ? 'Instructor Dashboard' : 'Student Dashboard'}
            </h2>

            {/* Sidebar Navigation */}
            <nav className="space-y-3">
              {sidebarLinks.map(link => (
                <button
                  key={link.label}
                  onClick={() => {
                    if (link.isCalendar) {
                      setShowCalendarModal(true);
                    } else if (link.path) {
                      navigate(link.path);
                      setSidebarOpen(false);
                    }
                  }}
                  className={`flex items-center gap-3 w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm
                    ${location.pathname === link.path && link.path
                      ? 'bg-primary/10 text-primary dark:bg-primary dark:text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                  {link.icon}
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Smart Learning Dashboard
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {role === 'instructor' ? 'Instructor Dashboard' : 'Student Dashboard'}
              </h1>
            </div>
            
            {/* Profile Section - Right Side */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Welcome, {user?.name || localStorage.getItem('userName') || (role === 'instructor' ? 'Instructor' : 'Student')}
              </div>
              
              {/* Profile Image/Initial */}
              <div className="relative">
                {user?.avatarUrl ? (
                  <img 
                    src={`http://localhost:4000${user.avatarUrl}`} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-lg font-bold text-white border-2 border-gray-300 dark:border-gray-600 shadow-sm">
                    {user?.name ? user.name.charAt(0).toUpperCase() : (role === 'instructor' ? 'I' : 'S')}
                  </div>
                )}
              </div>

              {/* Profile and Logout Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/profile')}
                  className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Profile
                </button>
                <button
                  onClick={logoutHandler}
                  className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Calendar Modal */}
        {showCalendarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-3xl relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white text-xl"
                onClick={() => setShowCalendarModal(false)}
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                Calendar
              </h2>
              <LiveSessionCalendar role={role} />
            </div>
          </div>
        )}

        {/* Page Content - Scrollable */}
        <main className="p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
