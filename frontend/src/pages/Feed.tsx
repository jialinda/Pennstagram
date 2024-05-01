// this will be the "landing page" after a user has logged in
// create a header with a "My Profile" button that routes to the /profile page, a chat button, and a notifications button. these will all route to other pages. 
// the main content of this landing page will consist of posts, but that will be figured out later for the Kafka stuff

import { useState } from 'react';
import axios from 'axios'; // Import Axios
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';

export default function Feed() {
  const navigate = useNavigate(); 
  const { username } = useParams();
  const rootURL = config.serverRootURL;
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');

// handleActivityFeed

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${rootURL}/login`, {
        username,
        password,
      });

      if (response.status === 200) {
        navigate(`/${username}/home`);
      } else {
        alert("Log in failed.");
      }
    } catch (error) {
      console.error("Log in error:", error);
      alert("Log in failed. Please try again later.");
    }
  };

  const signup = () => {
    navigate("/register");
  };

  const backToHome = () => {
    navigate("/");
  };

  return (
    <div className='w-screen h-screen flex items-center justify-center'>
      <form>
        <div className='rounded-md bg-slate-50 p-6 space-y-2 w-full'>
          <div className='font-bold flex w-full justify-center text-2xl mb-4'>
            Log In
          </div>
          <div className='flex space-x-4 items-center justify-between'>
            <label htmlFor="username" className='font-semibold'>Username</label>
            <input
              id="username"
              type="text"
              className='outline-none bg-white rounded-md border border-slate-100 p-2'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className='flex space-x-4 items-center justify-between'>
            <label htmlFor="password" className='font-semibold'>Password</label>
            <input
              id="password"
              type="password"
              className='outline-none bg-white rounded-md border border-slate-100 p-2'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className='w-full flex justify-center space-x-4'>
            <button
              type="button"
              className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
              onClick={handleLogin}
            >
              Log in
            </button>
            <button
              type="button"
              className='px-4 py-2 rounded-md bg-indigo-500 outline-none text-white'
              onClick={signup}
            >
              Sign up
            </button>
            <button
              type="button"
              className='px-4 py-2 rounded-md bg-gray-300 outline-none text-black'
              onClick={backToHome}
            >
              Back to Home
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

