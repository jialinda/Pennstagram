import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NavBar = ({ username }) => {
  const navigate = useNavigate();
  const [showNav, setShowNav] = useState(false); // State to toggle navigation

  const toggleNav = () => {
    setShowNav(!showNav); // Toggle the showNav state
  };

  return (
    <div className="px-6 py-4 bg-blue-500 text-white">
      <div className="flex items-center justify-between">
        <button onClick={toggleNav} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none focus:bg-blue-600">
          Menu
        </button>
        {showNav && ( // Conditional rendering based on showNav state
          <div className="flex space-x-4">
            <button onClick={() => navigate(`/${username}/profile`)} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none focus:bg-blue-600">My Profile</button>
            <button onClick={() => navigate(`/${username}/createPost`)} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none focus:bg-blue-600">Create a Post</button>
            <button onClick={() => navigate(`/${username}/chat`)} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none focus:bg-blue-600">Chat</button>
            <button onClick={() => navigate(`/${username}/friends`)} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none focus:bg-blue-600">Friends</button>
            <button onClick={() => navigate(`/${username}/groups`)} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none focus:bg-blue-600">Groups</button>
            <button onClick={() => navigate("/notifications")} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none focus:bg-blue-600">Notifications</button>
            <button onClick={() => navigate(`/${username}/search`)} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none focus:bg-blue-600">Search</button>

          </div>
        )}
      </div>
    </div>
  );
}

export default NavBar;
