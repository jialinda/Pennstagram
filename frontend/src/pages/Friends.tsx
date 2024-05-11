import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import $ from 'jquery';
import FindFriendComponent from '../components/chats/FindFriendComponent';
import FInvites from '../components/invites/FInvites';
import NavBar from '../components/Navbar';

const rootURL = config.serverRootURL;

const FriendComponent = ({ friend, add = true, remove = true }) => {
    return (
        <div className='rounded-md bg-slate-100 p-3 flex space-x-2 items-center justify-between'>
            <div className='font-semibold text-base'>{friend.username}</div>
            <button
                    type="button"
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() => onRemove(friend)}
                >
                    Remove friend
                </button>
        </div>
    );
};

const onRemove = async (user) => {
    // Add the user to the invitees list
    console.log('removing user', user);
    // e.preventDefault();
    try {
      const response = await axios.post(`${rootURL}/removeFriend`, {
        friendId: user.followed
      }
    );
      if (response.status == 200) {
        alert(`You successfully unfriended!`);
        console.log('remove friend was successfully sent to username: ', user.username);        
      } 

    } catch (error) {
          // For other errors, log the error to the console
          console.error('Error removing friend:', error);
    }
  };

export default function Friends() {
    const navigate = useNavigate(); 
    const { username } = useParams();
    const rootURL = config.serverRootURL;
    
    const [usersFriends, setUsersFriends] = useState([]);
    const [usersRecs, setUsersRecs] = useState([]);
    const [invites, setInvites] = useState([]);

    useEffect(() => {
        const fetchInvites = async () => {
            $.ajax({
                url: `${rootURL}/getFInviteAll`,
                method: 'GET',
                data: {
                    user_id: 0 // Adjust accordingly
                },
                success: function(response) {
                    setInvites(response.results);
                },
                error: function(error) {
                    console.error('Error fetching invites:', error);
                }
            });
        };

        const fetchData = async () => {
            try {
                const friendsRes = await axios.get(`${rootURL}/${username}/friends`);
                setUsersFriends(friendsRes.data.results);
                console.log('all friends here', usersFriends);
                
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchInvites();
        fetchData();
    }, [username, rootURL]);
    // });

    const feed = () => navigate(`/${username}/feed`);
    const chat = () => navigate(`/${username}/chat`);
    const onlineFriends = usersFriends.filter(friend => friend.is_online);
    const offlineFriends = usersFriends.filter(friend => !friend.is_online);

    return (
        <div>
            <NavBar username={username}></NavBar>
        <div className='w-full max-w-7xl mx-auto px-4'>
            {/* <div className='text-2xl flex justify-between items-center my-4'>
                <span>Pennstagram - {username}</span>
                <div>
                    <button onClick={feed} className='mx-2 px-2 py-2 rounded-md bg-gray-500 text-white'>
                        Feed
                    </button>
                    <button onClick={chat} className='px-2 py-2 rounded-md bg-gray-500 text-white'>
                        Chat
                    </button>
                </div>
            </div> */}
            <div className='grid grid-cols-4 gap-4'>
                <div>
                    <h2 className='font-bold text-xl mb-2'>Friends</h2>
                    <div className='space-y-2'>
                        <div className='font-bold text-lg text-green-500'>Online</div>
                        {onlineFriends.map((friend, index) => (
                            <FriendComponent key={index} friend={friend} />
                        ))}
                        <div className='font-bold text-lg text-gray-500'>Offline</div>
                        {offlineFriends.map((friend, index) => (
                            <FriendComponent key={index} friend={friend} />
                        ))}
                    </div>
                </div>
                {/* <div>
                    <h2 className='font-bold text-xl mb-2'>Friends</h2>
                    <div className='space-y-2'>
                        {usersFriends.map((friend, index) => (
                            <FriendComponent key={index} friend={friend} />
                        ))}
                    </div>
                </div> */}
                <div>
                    <h2 className='font-bold text-xl mb-2'>Recommended Friends</h2>
                    {/* <div className='space-y-2'>
                        {usersRecs.map((rec, index) => (
                            <FriendComponent key={index} friend={rec} />
                        ))}
                    </div> */}
                </div>
                <div>
                    <h2 className='font-bold text-xl mb-2'>Search Friends</h2>
                    <FindFriendComponent friends={usersFriends}/>
                </div>
                <div>
                    <h2 className='font-bold text-xl mb-2'>Invites</h2>
                    <FInvites invites={invites} />
                </div>
            </div>
        </div>
        </div>
    );
}
