import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="bg-green-500 text-white">
      <nav className="flex">
        <Link
          to="/dashboard"
          className={`px-4 py-3 text-base font-medium ${
            currentPath === '/dashboard' ? 'bg-green-600' : 'hover:bg-green-400'
          }`}
        >
          Home
        </Link>
        <Link
          to="/dashboard/rooms"
          className={`px-4 py-3 text-base font-medium ${
            currentPath === '/dashboard/rooms' ? 'bg-green-600' : 'hover:bg-green-400'
          }`}
        >
          Rooms
        </Link>
        <Link
          to="/dashboard/schedules"
          className={`px-4 py-3 text-base font-medium ${
            currentPath === '/dashboard/schedules' ? 'bg-green-600' : 'hover:bg-green-400'
          }`}
        >
          Schedules
        </Link>
      </nav>
    </div>
  );
};

export default Header;