import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';

export default function CreatePost() {
  const navigate = useNavigate();
  const { username } = useParams();

  const rootURL = config.serverRootURL;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState<File | null>(null);
  const [hashtags, setHashtags] = useState('');
  const [photo, setPhoto] = useState('');

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log('creating post fe');
    e.preventDefault();
    if (!title && !content && !hashtags) {
      alert("At least one field (title, picture, or hashtags) must contain some content.");
      return;
    }
    console.log('a');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('hashtags', hashtags);
    if (photo) formData.append('photo', photo);

    if (content) formData.append('content', content);

    try {

      console.log('b');
      const response = await axios.post(`${config.serverRootURL}/${username}/createPost`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
      // const response = await axios.post(`${rootURL}/${username}/createPost`, formData);

      console.log(response.data);

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
      console.log("photo set to:",event.target.files[0]);
    } else {
      setContent(null);
    }
  };

  const handleBackToHome = () => {
    navigate(`/${username}/feed`)
  };

  return (
    <div className='w-screen h-screen flex items-center justify-center'>
      <form onSubmit={handleCreatePost}>
        <div className='rounded-md bg-slate-50 p-6 space-y-4 w-full max-w-md'>
          <div className='font-bold text-2xl mb-4 text-center'>Create a Post</div>
          <input
            id="content"
            type="file"
            onChange={handlePhotoChange}
          />
          <input
            id="title"
            type="text"
            placeholder="Caption"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            id="hashtag"
            type="text"
            placeholder="Hashtags, comma-separated"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
          />
          <button type="submit" className='bg-indigo-500 text-white font-bold py-2 px-4 rounded'>Create Post</button>
          <button
            type="button"
            className='bg-gray-300 text-black font-bold py-2 px-4 rounded'
            onClick={handleBackToHome}
          >
            Back to Feed
          </button>
        </div>
      </form>
    </div>
  );
}