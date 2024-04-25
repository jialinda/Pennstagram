import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config.json';

const HomePage = () => {
  const rootURL = config.serverRootURL;
  const navigate = useNavigate(); // Use the hook to navigate to other pages
  
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

  const handleGetStarted = () => {
    navigate("/signup"); // Navigate to the sign-up page
  };

  return (
    <div className='w-screen h-screen flex flex-col bg-gray-50'>
      {/* Large title and curved subheading with a background photo */}
      <div
        className='flex flex-col items-center justify-center h-1/2 bg-cover bg-center text-white'
        style={{ backgroundImage: "url('/pennstagram_backdrop.png')" }}
      >
        <h1 className='text-6xl font-bold mb-2'>Pennstagram</h1>
        <h2 className='text-2xl font-semibold mb-4' style={{ textTransform: 'uppercase' }}>
          Where Fun Stuff Happens.
        </h2>
        <div className='flex space-x-6'>
          <Link
            to="/login"
            className='px-6 py-3 rounded-md bg-blue text-blue-500 font-bold'
          >
            Log In
          </Link>
          <Link
            to="/about"
            className='px-6 py-3 rounded-md bg-gray-300 text-black font-bold'
          >
            About Us
          </Link>
        </div>
      </div>

      {/* Main content with lively features */}
      <div className='flex-1 flex flex-col items-center justify-around p-6'>
        <div className='text-center'>
          <h3 className='text-3xl font-bold mb-4 text-blue-400'>Share Your Moments with a Welcoming Community</h3>
          <p>Check out the latest posts and chat with your friends!</p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg-grid-cols-3 gap-6 w-full'>
          {posts.map((post, index) => (
            <div
              key={index}
              className='bg-blue rounded-lg shadow-lg p-4 transition-transform duration-300 hover:scale-105'
            >
              <img
                src={post.image}
                alt={`Post ${index}`}
                className='w-full h-48 object-cover rounded-md mb-4'
              />
              <p className='text-lg font-medium text-center'>{post.caption}</p>
            </div>
          ))}
        </div>

        <div className='flex space-x-6 mt-6'>
          <h3 className='text-2xl font-bold mb-4 text-blue-500'>Don't have an account?</h3>
          <button
            className='px-6 py-3 rounded-md bg-gray-300 text-black font-bold transition-colors duration-300 hover:bg-gray-400'
            onClick={handleGetStarted} // Route to sign-up when clicked
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
