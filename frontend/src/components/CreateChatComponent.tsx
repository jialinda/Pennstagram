import React, { useState } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useParams } from 'react-router-dom';

function CreateChatComponent({ updatePosts }) {
    const [title, setTitle] = useState('');
    const [friends, setFriends] = useState([]); // State to store selected friends
    const [searchQuery, setSearchQuery] = useState(''); // State to store search query
    const [searchResults, setSearchResults] = useState([]); // State to store search results
    const { username } = useParams();
  
    // Function to handle adding friends
    const handleAddFriend = (friend) => {
      setFriends([...friends, friend]);
      setSearchQuery(''); // Clear search query after selecting a friend
      setSearchResults([]); // Clear search results after selecting a friend
    };
    
    const handleRemoveFriend = (friendToRemove) => {
        setFriends(friends.filter(friend => friend !== friendToRemove));
      };
    
      // Function to handle search
      const handleSearch = async () => {
        // Implement your search logic here, such as sending a request to the backend
        // In this example, searchResults are set to an empty array as a placeholder
        setSearchResults([]);
      };
    
      const handleSubmit = async (e) => {
        e.preventDefault();
        try {
          const response = await axios.post(`${config.serverRootURL}/${username}/createChatroom`, {
            title,
            friends,
          }, { withCredentials: true });
          console.log(response);
          if (response.status === 201 || response.status === 200) {
            // Clear input fields
            setTitle('');
            setFriends([]);
            // Update posts
            updatePosts();
          }
        } catch (error) {
          console.error('Error creating chatroom:', error);
        }
      };

      
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await axios.post(`${config.serverRootURL}/${username}/createPost`, {
//         title,
//         content,
//       }, {withCredentials: true });
//       console.log(response);
//       if (response.status === 201 || response.status === 200) {
//         // Clear input fields
//         setTitle('');
//         setContent('');
//         // Update posts
//         updatePosts();
//       }
//     } catch (error) {
//       console.error('Error creating post:', error);
//     }
//   };

  return (
    <div className='w-screen h-screen flex justify-center'>
    <form>
      <div className='rounded-md bg-blue-50 p-6 space-y-2 w-full'>
        <div className='font-bold flex w-full justify-center text-2xl mb-4'>
          Create Chatroom
        </div>
        <div className='flex space-x-4 items-center justify-between'>
          <label htmlFor="title" className='font-semibold'>Chatroom Name</label>
          <input id="title" type="text" className='outline-none bg-white rounded-md border border-slate-100 p-2'
            value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className='flex space-x-4 items-center justify-between'>
        <label htmlFor="search" className='font-semibold'>Search Friends</label>
            <input id="search" type="text" className='outline-none bg-white rounded-md border border-slate-100 p-2'
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <button type="button" className='px-4 py-2 rounded-md bg-blue-500 outline-none font-bold text-white' onClick={handleSearch}>Search</button>
        </div>
        
        <div className='w-full flex justify-center'>
          <button type="button" className='px-4 py-2 rounded-md bg-blue-500 outline-none font-bold text-white'
            onClick={handleSubmit}>Create Chatroom</button>
        </div>
      </div>
    </form>
  </div>

   


  );
}

export default CreateChatComponent;
