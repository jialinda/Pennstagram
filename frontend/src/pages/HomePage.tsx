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
    navigate("/register"); // Route to the sign-up page
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
          <button
            className='px-6 py-3 rounded-md bg-blue-500 text-white font-bold transition-colors duration-300 hover:bg-blue-600'
            onClick={handleGetStarted} // Route to sign-up when clicked
          >
            Get Started
          </button>
          <Link
            to="/login"
            className='px-6 py-3 rounded-md bg-white text-blue-500 font-bold'
          >
            Log In
          </Link>
        </div>
      </div>

      {/* Section for app values and descriptions */}
      <div className='flex-1 flex flex-col items-center justify-around p-6'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full'>
          {/* First box */}
          <div className='bg-sky-200 rounded-lg shadow-lg p-4 text-center'>
            <h3 className='text-2xl font-bold mb-2 text-blue-400'>Community</h3>
            <p>Pennstagram allows you to connect with friends, family, and like-minded people.</p>
          </div>
          
          {/* Second box */}
          <div className='bg-sky-200 rounded-lg shadow-lg p-4 text-center'>
            <h3 className='text-2xl font-bold mb-2 text-blue-400'>Creativity</h3>
            <p>Express yourself with photos, videos, and stories. Our platform is designed for creative expression.</p>
          </div>
          
          {/* Third box */}
          <div className='bg-sky-200 rounded-lg shadow-lg p-4 text-center'>
            <h3 className='text-2xl font-bold mb-2 text-blue-400'>Exploration</h3>
            <p>Discover new content, ideas, and meet new people. There's a world of possibilities on Pennstagram.</p>
          </div>
        </div>

        {/* Main content with posts */}
        <div className='text-center mt-6'>
          <h3 className='text-3xl font-bold mb-4 text-blue-400'>Share Your Moments with a Welcoming Community</h3>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg-grid-cols-3 gap-6 w-full'>
          {posts.map((post, index) => (
            <div
              key={index}
              className='bg-sky-200 rounded-lg shadow-lg p-4 transition-transform duration-300 hover:scale-105'
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
      </div>
    </div>
  );
};

export default HomePage;
