import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import PostComponent from '../components/PostComponent';
import CreatePostComponent from '../components/CreatePostComponent';
<<<<<<< HEAD


export default function Home() {
=======
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
axios.defaults.withCredentials = true;


export default function Home() {

  axios.defaults.withCredentials = true;
>>>>>>> main
  const { username } = useParams();
  const rootURL = config.serverRootURL;
  const location = useLocation();
  const actors = location.state ? location.state.actors : [];
  const navigate = useNavigate(); 

  const [posts, setPosts] = useState([]);

  const fetchData = async () => {
    try {
      // fix later, load posts from feed into the UI here
      const postsRes = await axios.get(`${rootURL}/${username}/feed`);
      setPosts(postsRes.data.results);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => { 
    fetchData();
  }, []);

  return (
    <div className='w-screen h-screen bg-gray-100'>
        <header className='w-full h-16 bg-blue-500 flex justify-between items-center px-5 text-white'>
            <h1 className='text-2xl'>My Feed</h1>
            <nav>
                <button className='mx-2 py-1 px-3 rounded bg-blue-700 hover:bg-blue-800' onClick={() => navigate(`/${username}/friends`)}>Friends</button>
                <button className='mx-2 py-1 px-3 rounded bg-blue-700 hover:bg-blue-800' onClick={() => navigate(`/${username}/chat`)}>Chat</button>
                <button className='mx-2 py-1 px-3 rounded bg-blue-700 hover:bg-blue-800' onClick={() => navigate(`/${username}/profile`)}>My Profile</button>
            </nav>
        </header>
        
        <main className='max-w-4xl mx-auto p-4'>
            {actors.length > 0 && (
                <section>
                  <h2 className='text-lg font-bold mb-3'>Similar Actors</h2>
                  <div className='grid grid-cols-3 gap-4'>
                    {actors.map((actor) => (
                      <div key={actor.id} className='text-center p-2'>
                        <img src={actor.imageUrl} alt="Actor" className='w-24 h-24 object-cover rounded-full'/>
                        <p>Distance: {actor.distance.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </section>
            )}
        </main>
    </div>
  );
}
