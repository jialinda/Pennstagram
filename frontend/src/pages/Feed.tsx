import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import PostComponent from '../components/posts/PostComponent';
// import PostComponent from '/nets2120/project-stream-team/frontend/src/components/PostComponent.tsx'; 
import config from '../../config.json';
import NavBar from '../components/Navbar';

export interface Post {
  username: string;
  parent_post: string;
  post_id: string;
  post_author: string;
  post_timestamp: string;
  title: string;
  content: string;
  hashtags: string[];
  comments: Comment[];
  likes_count: number;
  image_url: string;
}

export interface Comment {
  content: string;
  timestamp: string;
  author: string;
}

const Feed = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [feed, setFeed] = useState<Post[]>([]);

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
      <NavBar username={username}></NavBar>
      <div className='flex-1 flex flex-col items-center justify-around p-6'>
        {feed.map(post => (
          <PostComponent
            key={post.post_id}
            postId={post.post_id}
            username={post.username}
            // username={username}
            timestamp={post.post_timestamp}
            hashtags={post.hashtags}
            title={post.title}
            content={post.content}
            comments={post.comments}
            likesCount={post.likes_count}
            image_url={post.image_url}
          />
        ))}
      </div>
    </div>
  );
};

export default Feed;
