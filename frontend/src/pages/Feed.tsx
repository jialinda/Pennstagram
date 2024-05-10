import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import PostComponent from '../components/posts/PostComponent';
// import PostComponent from '/nets2120/project-stream-team/frontend/src/components/PostComponent.tsx'; 
import config from '../../config.json';

const Feed = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${config.serverRootURL}/${username}/feed`);
        setFeed(response.data.results);
      } catch (error) {
        console.error("Error fetching feed:", error);
      }
    };

    fetchPosts();
  }, [username]);

  return (
    <div className='w-screen h-screen flex flex-col bg-gray-50'>
      <div className="flex items-center justify-between px-6 py-4 bg-blue-500 text-white">
        <button onClick={() => navigate("/"+username+"/profile")} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none focus:bg-blue-600">My Profile</button>
        <div className="flex space-x-4">
          <button onClick={() => navigate(`/${username}/chat`)} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none focus:bg-blue-600">Chat</button>
          <button onClick={() => navigate("/notifications")} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none focus:bg-blue-600">Notifications</button>
        </div>
      </div>
      <div className='flex-1 flex flex-col items-center justify-around p-6'>
        {feed.map(post => (
          <PostComponent
            key={post.post_id}
            username={post.username}
            timestamp={post.post_timestamp}
            title={post.title}
            content={post.content}
            comments={post.comments}
            likesCount={post.likes_count}
          />
        ))}
      </div>
    </div>
  );
};

export default Feed;
