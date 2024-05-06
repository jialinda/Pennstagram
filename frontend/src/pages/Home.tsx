import {useState, useEffect, Key} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import PostComponent from '../components/posts/PostComponent'
import CreatePostComponent from '../components/posts/CreatePostComponent';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
axios.defaults.withCredentials = true;


axios.defaults.withCredentials = true;

export default function Home() {

  axios.defaults.withCredentials = true;
  const { username } = useParams();
  const rootURL = config.serverRootURL;
  const location = useLocation();
  const actors = location.state ? location.state.actors : [];


  const navigate = useNavigate(); 

  const friends = () => {
      navigate("/"+ username+"/friends");
  };

  const chat = () => {
    navigate("/"+ username+"/chat");
  };
  
    // TODO: add state variable for posts
  const [posts, setPosts] = useState([]);

  const fetchData = async () => {
    try {
    // TODO: fetch posts data and set appropriate state variables 
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
    <div className='w-screen h-screen'>
        <div className='w-full h-16 bg-slate-50 flex justify-center mb-2'>
            <div className='text-2xl max-w-[1800px] w-full flex items-center'>
                Pennstagram - {username} &nbsp;
                <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white'
              onClick={friends}>Friends</button>&nbsp;
                <button type="button" className='px-2 py-2 rounded-md bg-gray-500 outline-none text-white'
              onClick={chat}>Chat</button>
            </div>
            <div>
          {actors.length > 0 && (
            <div>
              <h2 className='text-xl font-bold'>Similar Actors</h2>
              <div className='flex space-x-4'>
                {actors.map((actor: { id: Key | null | undefined; imageUrl: string | undefined; distance: number; }) => (
                  <div key={actor.id} className='text-center p-2'>
                    <img src={actor.imageUrl} alt="Actor" className='w-24 h-24 object-cover rounded-full'/>
                    <p>Distance: {actor.distance.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
        
        {/* <div className='h-full w-full mx-auto max-w-[1800px] flex flex-col items-center space-y-4'>
          <CreatePostComponent updatePosts={fetchData} />
          {
              // TODO: map each post to a PostComponent
              posts.map((post, index) => (
                <PostComponent key={index} title={post.title} description={post.content}/>
            ))
            }
        </div> */}
    </div>
  )
}

