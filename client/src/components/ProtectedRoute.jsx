import { useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { useNavigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ role }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (role && user.role !== role)) {
      navigate('/login');
    }
  }, [user, role, navigate]);

  return user ? <Outlet /> : null;
}