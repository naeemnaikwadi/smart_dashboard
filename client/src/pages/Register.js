import { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react'; // optional if using Lucide icons

export default function Register() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const roleRef = useRef(null);

  const handleRegister = async () => {
    try {
      await axios.post('http://localhost:4000/api/auth/register', {
        name,
        email,
        password,
        role,
      });
      alert('Registered successfully!');
      navigate('/');
    } catch {
      alert('Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sm:p-8 relative">
        
        {/* Back Arrow */}
        <button
  onClick={() => navigate('/')}
  className="absolute top-4 left-4 text-gray-400 hover:text-gray-800 dark:text-gray-500 dark:hover:text-white transition-colors"
  aria-label="Back to login"
>
  <ArrowLeft size={20} />
</button>


        <h2 className="text-xl font-semibold text-center text-gray-800 dark:text-white mb-2">
          Create Your Account
        </h2>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          Register as a student or instructor
        </p>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && emailRef.current?.focus()}
            className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <input
            type="email"
            ref={emailRef}
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && passwordRef.current?.focus()}
            className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <input
            type="password"
            ref={passwordRef}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && roleRef.current?.focus()}
            className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <select
            value={role}
            ref={roleRef}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
            className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>

        <button
          onClick={handleRegister}
          className="w-full mt-6 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-md transition duration-200"
        >
          Register
        </button>
      </div>
    </div>
  );
}
