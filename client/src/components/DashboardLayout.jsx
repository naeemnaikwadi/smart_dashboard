import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearUser } from '../redux/userSlice';
import logo from '../assets/logo.png';
import {
  Menu, Moon, Sun, ChevronDown,
  LayoutDashboard, Video, Upload, Users, BookOpen,
  BadgeCheck, Calendar, Target, TrendingUp, Plus,
  Home,
  X,
  LogOut,
  Download,
  MessageCircle,
  Bell,
  Award,
  Star
} from 'lucide-react';
import LiveSessionCalendar from './LiveSessionCalendar';
import NotificationPopup from './NotificationPopup';

export default function DashboardLayout({ role, children }) {
 // const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const [user, setUser] = useState(null);

  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const initial = (user?.name || "U").charAt(0).toUpperCase();

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

  // Resolve role: prefer prop, then user.state, then localStorage
  const resolvedRole = role || user?.role || (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.role || localStorage.getItem('userRole') || 'student';
    } catch {
      return 'student';
    }
  })();

  const sidebarLinks = resolvedRole === 'instructor'
    ? [
        { label: 'Dashboard', path: '/instructor', icon: <LayoutDashboard size={18} /> },
        { label: 'My Courses', path: '/instructor/courses', icon: <BookOpen size={18} /> },
        { label: 'Classrooms', path: '/instructor/classrooms', icon: <Users size={18} /> },
        { label: 'Student Management', path: '/student-info', icon: <Users size={18} /> },
        { label: 'Learning Paths', path: '/learning-paths', icon: <Target size={18} /> },
        { label: 'Live Sessions', path: '/live-sessions', icon: <Video size={18} /> },
        { label: 'Reviews & Ratings', path: '/instructor/reviews', icon: <Star size={18} /> },
        { label: 'Upload Materials', path: '/upload', icon: <Upload size={18} /> },
        { label: 'Doubts', path: '/instructor/doubts', icon: <MessageCircle size={18} /> },
        // Calendar button will open modal, not navigate
        { label: 'Calendar', path: null, icon: <Calendar size={18} />, isCalendar: true },
        // Replace Analytics with Learning Sessions overview
        { label: 'Learning Sessions', path: '/learning-paths', icon: <Target size={18} /> },
        { label: 'Profile', path: '/profile', icon: <BadgeCheck size={18} /> },
      ]
    : [
        { label: 'Dashboard', path: '/student', icon: <LayoutDashboard size={18} /> },
        { label: 'My Courses', path: '/student-courses', icon: <BookOpen size={18} /> },
        { label: 'Classrooms', path: '/student/classrooms', icon: <Users size={18} /> },
        { label: 'Learning Paths', path: '/learning-paths', icon: <Target size={18} /> },
        { label: 'Live Sessions', path: '/student/live-sessions', icon: <Video size={18} /> },
        { label: 'Doubts', path: '/student/doubts', icon: <MessageCircle size={18} /> },
        { label: 'Assessments', path: '/assessments', icon: <Award size={18} /> },
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
    <div className="min-h-screen h-screen overflow-hidden flex bg-gray-50 dark:bg-gray-900 dark:text-white transition-colors duration-300">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed and Static */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 md:translate-x-0`}>
        <div className="flex flex-col h-full m-4  justify-between overflow-y-auto">
          <div>
            {/* Sidebar Header with Close Button for Mobile */}
            {/* <div className="flex items-center justify-between mb-6"> */}
              <div className="w-25 h-14 ml-2 flex items-center justify-start border-b-2">
  <img 
    src={logo} 
    alt="logo" 
    className="max-w-full max-h-full object-contain mix-blend-multiply " 
  />
  <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white  ml-2  pb-4">SkillSync</h2>

</div>


              {/* <h2 className="text-xl md:text-2xl font-bold text-primary dark:text-white">
                {role === 'instructor' ? 'Instructor' : 'Student'}
              </h2> */}
              {/* <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button> */}
            {/* </div> */}

            {/* Sidebar Navigation */}
            <nav className="space-y-2 mt-4">
              {sidebarLinks.map(link => (
                <button
                  key={link.label}
                  onClick={() => {
                    if (link.isCalendar) {
                      setShowCalendarModal(true);
                      setSidebarOpen(false);
                    } else if (link.path) {
                      navigate(link.path);
                      setSidebarOpen(false);
                    }
                  }}
                  className={`flex items-center gap-3 w-full text-left px-3 md:px-4 py-2 md:py-3 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm
                    ${location.pathname === link.path && link.path
                      ? 'bg-primary/10 text-primary dark:bg-primary dark:text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                  {link.icon}
                  <span className="hidden sm:inline">{link.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <div className="hidden sm:block">© {new Date().getFullYear()} Smart Learning Dashboard</div>
            <div className="sm:hidden text-center">Smart Learning</div>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 md:ml-64 h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                <Menu size={20} />
              </button>
              
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                {resolvedRole === 'instructor' ? 'Instructor Dashboard' : 'Student Dashboard'}
              </h1>
            </div>
            
            {/* Profile Section - Right Side */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {isDark ? <Sun className='w-6 h-6' /> : <Moon className='w-6 h-6' />}
              </button>

              {/* Notification Popup */}
              <NotificationPopup role={resolvedRole} />
              
              {/* User Info - Hidden on small screens */}
              {/* <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">
                Welcome, {user?.name || localStorage.getItem('userName') || (role === 'instructor' ? 'Instructor' : 'Student')}
              </div> */}
              
              <div className="relative">
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full bg-blue-600 text-white  flex items-center justify-center text-sm font-semibold cursor-pointer overflow-hidden"
        onClick={() => setOpen(!open)}
      >
        {user?.avatarUrl ? (
          <img
            src={
              user?.avatarUrl?.startsWith("http")
                ? user.avatarUrl
                : `http://localhost:4000${user?.avatarUrl}`
            }
            alt={user?.name || "User"}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          initial
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <button
            onClick={() => {
              setOpen(false);
              navigate("/profile");
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Profile
          </button>
          <button
            onClick={() => {
              setOpen(false);
              logoutHandler();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      )}
    </div>
            </div>
          </div>
        </header>

        {/* Calendar Modal */}
        {showCalendarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-4 md:p-6 w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white text-xl"
                onClick={() => setShowCalendarModal(false)}
              >
                &times;
              </button>
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                Calendar
              </h2>
              <LiveSessionCalendar role={resolvedRole} />
            </div>
          </div>
        )}

        {/* Page Content - Scrollable area only */}
        <main className=" md:p-6 overflow-y-auto flex-1 min-h-0">{children}</main>
      </div>
    </div>
  );
}
