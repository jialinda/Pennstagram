import React, { useState } from 'react';
import axios from 'axios';
import config from '../../../config.json';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import $ from 'jquery';


const rootURL = config.serverRootURL;

const FriendComponent = ({ user, handleSendInvite }: { name: string }) => {
    return (
        <div className='rounded-md bg-blue-100 p-3 flex space-x-2 items-center flex-auto justify-between'>
            <div className='font-semibold text-base'>
                { user.username }
            </div>
            <button type="button" className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => handleSendInvite(user)}>Send friend invite</button>
        </div>
    )
}

const AlreadyFriendComponent = ({ user }: { name: string }) => {
    return (
        <div className='rounded-md bg-green-100 p-3 flex space-x-2 items-center flex-auto justify-between'>
            <div className='font-semibold text-base'>
                {user.username} (Already a friend)
            </div>
        </div>
    )
}

function FindFriendComponent({ friends }) {
    const [title, setTitle] = useState('');
    // const [friends, setFriends] = useState([]); // State to store selected friends
    const [searchQuery, setSearchQuery] = useState(''); // State to store search query
    const [searchResults, setSearchResults] = useState([]); // State to store search results
    // const { username } = useParams();

    const { username } = useParams();
    console.log('friends', friends);
    const friend_usernames = friends.map(friend => friend.username);
    console.log('usernames', friend_usernames)

    // Now you can use username and chat_id in your component
    console.log('Username:', username);
    // console.log('Chat ID:', chat_id);
    const navigate = useNavigate(); 

    const handleSendInvite = async (user) => {
        // Add the user to the invitees list
        console.log('f invite called 1');
        // e.preventDefault();
        console.log('user.user_id', user.userId);
        try {
          const response = await axios.post(`${rootURL}/postFInvite`, {
            invitee_id: user.userId
          }
        );
          if (response.status == 201) {
            console.log('invite was successfully sent to username: ', user.username);   
            alert('invite sent successfully!');     
          } else {
            alert("invite failed");
        }
        } catch (error) {
              // For other errors, log the error to the console
              console.error('Error sending invite:', error);
      };
    }

    const handleSearch = async () => {
        console.log('handle search is called');
        try {
        console.log('finding ANYONE with username: ', searchQuery);
        const response = await axios.get(`${rootURL}/getUserByUsername`, {
            params: {
                friend_name: searchQuery // check
            }
        });
        const allUsers = response.data.results;
        console.log('all friends with username', allUsers);
        if (allUsers.length === 0) {
            setSearchResults([]);
        } else {
            setSearchResults(allUsers);
        }
        } catch (error) {
            if (error.response && error.response.status === 409) {
                alert('No user exists with that username!');
            } else {
                console.error('Error fetching users:', error);
                alert('An error occurred while searching.');
            }
            setSearchResults([]);
        }
        
    };
    
      const handleSubmit = async (e) => {
        navigate("/"+ username+"/chat");
      };

  return (
    <form>
      <div className='rounded-md bg-blue-50 p-6 space-y-2 w-full'>
        <div className='font-bold flex w-full justify-center text-2xl mb-4'>
          Search & Add Friends
        </div>
        <div className='flex space-x-4 items-center justify-between'>
            <input id="search" type="text" className='outline-none bg-white rounded-md border border-slate-100 p-2'
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <button type="button" className='px-4 py-2 rounded-md bg-blue-500 outline-none font-bold text-white' onClick={handleSearch}>Search</button>
        </div>
        <div>
          {searchResults.map(user => (
            <div key={user.user_id} className="flex items-center space-x-2">
                {friend_usernames.includes(user.username) ?
                    <AlreadyFriendComponent user={user} /> :
                    <FriendComponent user={user} handleSendInvite={handleSendInvite}/>
                }
            </div>
            ))}
        </div>
        <div className='w-full flex justify-center'>
          <button type="button" className='px-4 py-2 rounded-md bg-blue-500 outline-none font-bold text-white'
            onClick={handleSubmit}>Done</button>
        </div>
      </div>
    </form>
  );
}

export default FindFriendComponent;
