import React, { useState } from 'react';
import axios from 'axios';
import config from '../../../config.json';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';


const rootURL = config.serverRootURL;

function CreateChatComponentv1({ updatePosts }) {

    const navigate = useNavigate(); 
    const rootURL = config.serverRootURL;


    const [title, setTitle] = useState('');
    const [friends, setFriends] = useState([]); // State to store selected friends
    const [searchQuery, setSearchQuery] = useState(''); // State to store search query
    const [searchResults, setSearchResults] = useState([]); // State to store search results
    const { username } = useParams();
    const [invitees, setInvitees] = useState([]);

    const handleSubmit = async () => {
      console.log('handle create chat is called');
      try {
        console.log('title, ', title);
        const response = await axios.post(`${rootURL}/${username}/postChat`, {
          // params: {
            user_id: 1,
            chatName: title
          // }
        }
        , { withCredentials: true }
      );
        console.log('creating chat results, ', response);
  
        if (response.status === 201 || response.status === 200) {
          // Redirect to the inviteFriend page with chat_id parameter
          // insert dummy chat_id
          const chat_id = response.data.chat_id;
          // const chat_id = 1;
          navigate(`/${username}/createChat/${chat_id}/inviteFriend`);
        }
      } catch (error) {
        console.error('Error creating chatroom:', error);
      }
    };

  
  
    const handleAddFriend = (user) => {
      // Check if the user is already in the invitees list
      console.log('adding this user: ', user);
      if (!invitees.find(invitee => invitee.user_id === user.user_id)) {
          // Add the user to the invitees list
          setInvitees([...invitees, user]);
          console.log('curr invitees: ', invitees);
      }
    };
    
    const handleRemoveFriend = (friendToRemove) => {
        setFriends(friends.filter(friend => friend !== friendToRemove));
      };
    
      // Function to handle search
      const handleSearch = async () => {
        console.log('handle search is called');
        try {
          console.log('finding friends with username: ', searchQuery);
          const response = await axios.get(`${rootURL}/getFriend`, {
              params: {
                  user_id: 2, // hardcode first
                  username: searchQuery // check
              }
          });
          console.log('username is ', username);
          const allUsers = response.data.results;
          console.log('all friends with username', allUsers);
          if (allUsers.length === 0) {
            setSearchResults([]);
          } else {
            setSearchResults(allUsers);
          }
          // setSearchResults(allUsers);

          // setChats(testChats);
        } catch (error) {
          setSearchResults([]);
          console.error('Error fetching invites:', error);
        }
          
      };
    
      // const handleSubmit = async (e) => {
      //   e.preventDefault();
      //   handleCreateChat();
      // };


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
        <div className='w-full flex justify-center'>
          <button type="button" className='px-4 py-2 rounded-md bg-blue-500 outline-none font-bold text-white'
            onClick={handleSubmit}>Create Chatroom</button>
        </div>
      </div>
    </form>
  </div>

   


  );
}

export default CreateChatComponentv1;
