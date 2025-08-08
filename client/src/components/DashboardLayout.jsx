import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearUser } from '../redux/userSlice';
import {
  Menu, Moon, Sun, ChevronDown,
  LayoutDashboard, Video, Upload, Users, BookOpen,
  BadgeCheck, Calendar
} from 'lucide-react';

export default function DashboardLayout({ role, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

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
        { label: 'Dashboard', path: '/instructor-dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Create Live Session', path: '/create-live-session', icon: <Video size={18} /> },
        { label: 'Upload Resources', path: '/upload-resource', icon: <Upload size={18} /> },
        { label: 'Classrooms', path: '/instructor/classrooms', icon: <Users size={18} /> },
      ]
    : [
        { label: 'Dashboard', path: '/student-dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'My Courses', path: '/my-courses', icon: <BookOpen size={18} /> },
        { label: 'Certificates', path: '/certificates', icon: <BadgeCheck size={18} /> },
        { label: 'Live Sessions', path: '/live-sessions', icon: <Calendar size={18} /> },
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
      {/* Sidebar */}
<div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 md:translate-x-0 md:static md:inset-0 shadow-lg`}>
  <div className="flex flex-col h-full p-6 justify-between">
    <div>
      {/* Sidebar Title */}
      <h2 className="text-2xl font-bold mb-6 text-primary dark:text-white">
        {role === 'instructor' ? 'Instructor Dashboard' : 'Student Dashboard'}
      </h2>

      {/* Action Buttons */}
      <nav className="space-y-3">
        {sidebarLinks.map(link => (
          <button
            key={link.path}
            onClick={() => {
              navigate(link.path);
              setSidebarOpen(false);
            }}
            className={`flex items-center gap-3 w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm
              ${location.pathname === link.path
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800 shadow md:pl-72">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden">
              <Menu />
            </button>
            <h2 className="text-xl font-semibold">Welcome, {user?.name || "User"}</h2>
          </div>

          <div className="flex items-center gap-4 relative">
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {getInitials(user?.name)}
                  </div>
                )}
                <ChevronDown size={16} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 animate-fade-in">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Profile
                  </button>
                  <button
                    onClick={logoutHandler}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-2  md:p-2  md:ml-38">{children}</main>
        </div>
    </div>
  );
}
