import React, { useState } from 'react';
import axios from 'axios';
import config from '../../../config.json';
import { useParams } from 'react-router-dom';

const rootURL = config.serverRootURL;

function InviteFriendComponent({ updatePosts }) {
    const [title, setTitle] = useState('');
    const [friends, setFriends] = useState([]); // State to store selected friends
    const [searchQuery, setSearchQuery] = useState(''); // State to store search query
    const [searchResults, setSearchResults] = useState([]); // State to store search results
    // const { username } = useParams();
    const [invitees, setInvitees] = useState([]);

    const { username, chat_id } = useParams();

    // Now you can use username and chat_id in your component
    console.log('Username:', username);
    console.log('Chat ID:', chat_id);

    const handleSendInvite = async (user) => {
      // Add the user to the invitees list
      console.log('handle send invite called');
      // e.preventDefault();
      try {
        const response = await axios.post(`${config.serverRootURL}/${username}/postInvite`, {
          chat_id: chat_id,
          invitee_id: user.user_id,
          inviter_id: 2, // it technically should be whoever is in session right now
          confirmed: 0
        }
      );
        if (response.status == 201) {
          // CHECK - navigate somewhere?
          console.log('invite was successfully sent to username: ', user.username);        
        } else {
          alert("invite ffailed");
      }

      } catch (error) {
        console.error('Error sending invite:', error);
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
          Search & Invite Friends to your Chatroom
        </div>
        <div className='flex space-x-4 items-center justify-between'>
            <input id="search" type="text" className='outline-none bg-white rounded-md border border-slate-100 p-2'
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <button type="button" className='px-4 py-2 rounded-md bg-blue-500 outline-none font-bold text-white' onClick={handleSearch}>Search</button>
        </div>
        <div>
          {searchResults.map(user => (
            <div key={user.user_id} className="flex items-center space-x-2">
              <span>{user.username}</span>
              <button type="button" className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => handleSendInvite(user)}>Send invite</button>
            </div>
            ))}
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

export default InviteFriendComponent;
