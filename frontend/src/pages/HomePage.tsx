import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config.json';

const HomePage = () => {
  const rootURL = config.serverRootURL;
  
  // State to manage posts
  const [posts, setPosts] = useState([]);

  // Fetch posts from the server
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${rootURL}/posts`);
        setPosts(response.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, [rootURL]);

  return (
    <div className='w-screen h-screen flex flex-col items-center'>
      <header className='w-full bg-indigo-500 text-white py-4 flex justify-between px-6'>
        <h1 className='text-3xl font-bold'>Pennstagram</h1>
        <nav>
          <ul className='flex space-x-6'>
            <li>
              <Link to="/login" className='hover:underline'>
                Login/Signup
              </Link>
            </li>
            {/* <li>
              <Link to="/settings" className='hover:underline'>
                About Us
              </Link>
            </li> */}
          </ul>
        </nav>
      </header>

      <main className='flex-1 w-full bg-slate-100 p-6'>
        <div className='text-center mb-6'>
          <h2 className='text-2xl font-semibold'>Welcome to Pennstagram!</h2>
          <p>Share your moments with the world.</p>
        </div>

        {/* Posts section */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {posts.map((post, index) => (
            <div
              key={index}
              className='bg-white rounded-lg shadow-md p-4 flex flex-col items-center'
            >
              <img
                src={post.image}
                alt={`Post ${index}`}
                className='w-full h-48 object-cover rounded-md mb-4'
              />
              <p className='text-lg font-medium'>{post.caption}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
