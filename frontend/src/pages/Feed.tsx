import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useParams } from 'react-router-dom';

const Feed = () => {
  const rootURL = config.serverRootURL;
  const navigate = useNavigate(); // Use the hook to navigate to other pages
  const { username } = useParams();
  
  // State to manage posts
  const [feed, setFeed] = useState([]);

  // Fetch posts from the server
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${rootURL}/${username}/feed`);
        setFeed(response.data.results);
      } catch (error) {
        console.error("Error fetching feed:", error);
      }
    };

    fetchPosts();
  }, [rootURL]);

  return (
    <div className='w-screen h-screen flex flex-col bg-gray-50'>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-blue-500 text-white">
        <button onClick={() => navigate("/"+username+"/profile")} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none focus:bg-blue-600">My Profile</button>
        <div className="flex space-x-4">
          <button onClick={() => navigate("/"+username+"/chat")} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none focus:bg-blue-600">Chat</button>
          <button onClick={() => navigate("/notifications")} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none focus:bg-blue-600">Notifications</button>
        </div>
      </div>
      
      <div className='flex-1 flex flex-col items-center justify-around p-6'>
        {/* Main content with posts */}
        <div className='text-center mt-6'>
          <h3 className='text-3xl font-bold mb-4 text-blue-400'>Share Your Moments with a Welcoming Community</h3>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full'>
          {feed.map((post, index) => (
            <div key={index} className='bg-sky-200 rounded-lg shadow-lg p-4 transition-transform duration-300 hover:scale-105'>
              <img src={post.image} alt={`Post ${index}`} className='w-full h-48 object-cover rounded-md mb-4' />
              <p className='text-lg font-medium text-center'>{post.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Feed;
