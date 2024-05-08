import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';

export default function CreatePost() {
  const navigate = useNavigate();
  const { username } = useParams();

  const rootURL = config.serverRootURL;

  const [title, setTitle] = useState<string | undefined>(undefined);
  const [content, setContent] = useState<File | undefined>(undefined);
  const [hashtags, setHashtags] = useState<string | undefined>(undefined);

  const handleCreatePost = async () => {
    try {

      if (!title && !content && !hashtags) {
        alert("At least one field (title, picture, or hashtags) must contain some content.");
        return;
      }
      const formData = new FormData();
      if (title) formData.append('title', title);
      if (content) formData.append('content', content);
      if (hashtags) formData.append('hashtags', hashtags);

      const response = await axios.post(`${rootURL}/${username}/createPost`, formData);

      if (response.status === 200) {
        navigate(`/${username}/feed`);
      } else {
        alert("Post Creation failed.");
      }
    } catch (error) {
      console.error("Post Creation Failed:", error);
      alert("Post creation failed. Please try again later.");
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setContent(event.target.files[0]);
    } else {
      setContent(undefined);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className='w-screen h-screen flex items-center justify-center'>
      <form onSubmit={handleCreatePost}>
        <div className='rounded-md bg-slate-50 p-6 space-y-4 w-full max-w-md'>
          <div className='font-bold text-2xl mb-4 text-center'>Create a Post</div>
          <input
            type="file"
            onChange={handlePhotoChange}
          />
          <input
            type="text"
            placeholder="Caption"
            value={title || ''}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Hashtags, comma-separated"
            value={hashtags || ''}
            onChange={(e) => setHashtags(e.target.value)}
          />
          <button type="submit" className='bg-indigo-500 text-white font-bold py-2 px-4 rounded'>Create Post</button>
          <button
            type="button"
            className='bg-gray-300 text-black font-bold py-2 px-4 rounded'
            onClick={handleBackToHome}
          >
            Back to Home
          </button>
        </div>
      </form>
    </div>
  );
}