import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';

export default function CreatePost() {
  const navigate = useNavigate();
  const { username } = useParams();
  const rootURL = config.serverRootURL;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState(any); // Changed to null for clarity
  const [hashtags, setHashtags] = useState('');

  const handleCreatePost = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    // formData.append('title', title);
    // formData.append('content', content); // Ensure this matches the file input
    // formData.append('hashtags', hashtags);
    formData.append('linda', 'sucks');
    console.log("Creating post...");
    console.log(content);
  //   {
  //     'title': title,
  //     'content': content,
  //     'hashtags': hashtags
  // }
    try {
      const response = await axios.post(`${rootURL}/${username}/createPost`, content, 
      {headers : {
        'Content-Type': content.type
      }});
  
      if (response.status === 200) {
        navigate(`/${username}/feed`);
      } else {
        alert("Post Creation failed: " + response.data.error);
      }
    } catch (error) {
      console.error("Post Creation Failed:", error);
      alert("Post creation failed. Please try again later.");
    }
  };

  
  const handlePhotoChange = (event) => {
    console.log("Handling file upload...");
    if (event.target.files && event.target.files[0]) {
      setContent(event.target.files[0]);
    } else {
      setContent(null);
    }
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Hashtags, comma-separated"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
          />
          <button type="submit" className='bg-indigo-500 text-white font-bold py-2 px-4 rounded'>Create Post</button>
        </div>
      </form>
    </div>
  );
}
