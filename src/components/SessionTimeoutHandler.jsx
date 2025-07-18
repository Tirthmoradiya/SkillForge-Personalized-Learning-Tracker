import useSessionTimeout from '../hooks/useSessionTimeout';
import { useAuth } from '../context/AuthContext';

export default function SessionTimeoutHandler() {
  const { logout, user } = useAuth();
  useSessionTimeout(user ? logout : () => {});
  return null;
} 