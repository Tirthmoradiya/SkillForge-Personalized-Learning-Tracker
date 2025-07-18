import { UserIcon } from '@heroicons/react/24/outline';

export default function UserAvatar({ user, size = 40 }) {
  const initials = user?.username
    ? user.username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : null;
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold shadow-lg`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-label={user?.username || 'User'}
    >
      {initials ? initials : <UserIcon className="w-2/3 h-2/3 text-white opacity-80" />}
    </div>
  );
} 