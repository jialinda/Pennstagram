import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import $ from 'jquery';
import FindGroupComponent from '../components/groups/FindGroupComponent';
// import FindFriendComponent from '../components/chats/FindFriendComponent';
import FInvites from '../components/invites/FInvites';
import CreateGroupComponent from '../components/groups/CreateGroupComponent';
import NavBar from '../components/Navbar';

const rootURL = config.serverRootURL;

const GroupComponent = ({ group, add = true, remove = true }) => {
    const navigate = useNavigate(); 
    const { username } = useParams();
    return (
        <div className='rounded-md bg-slate-100 p-3 flex space-x-2 items-center justify-between'>
            <div className='font-semibold text-base'>{group.communities_name}</div>
            <button
                    type="button"
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() => onRemove(group)}
                >
                    Leave group
                </button>
                <button
                    type="button"
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    onClick={() => navigate(`/${username}/chat`)}
                >
                    Go to group chatroom
                </button>
        </div>
    );
};

const onRemove = async (group) => {
    // Add the user to the invitees list
    console.log('leave group', group);
    // e.preventDefault();
    try {
      const response = await axios.post(`${rootURL}/leaveGroup`, {
        groupId: group.communities_id
      }
    );
      if (response.status == 200) {
        alert(`You successfully left the group!`);
        console.log('remove friend was successfully sent to username: ', group.communities_name);        
      } 

    } catch (error) {
          // For other errors, log the error to the console
          console.error('Error leaving group:', error);
    }
  };

export default function Groups() {
    const navigate = useNavigate(); 
    const { username } = useParams();
    const rootURL = config.serverRootURL;
    
    const [usersGroups, setUsersGroups] = useState([]);
    // const [invites, setInvites] = useState([]);

    useEffect(() => {

        const fetchData = async () => {
            try {
                const groupRes = await axios.get(`${rootURL}/${username}/getGroupsAll`);
                setUsersGroups(groupRes.data.results);
                console.log('all groups here', usersGroups);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [usersGroups]);
    // });
    
    const feed = () => navigate(`/${username}/feed`);
    const chat = () => navigate(`/${username}/chat`);

    return (
        <div>
            <NavBar> username={username}</NavBar>
        <div className='w-full max-w-7xl mx-auto px-4'>
            
            <div className='text-2xl flex justify-between items-center my-4'>
                {/* <span>Pennstagram - {username}</span>
                <div>
                    <button onClick={feed} className='mx-2 px-2 py-2 rounded-md bg-gray-500 text-white'>
                        Feed
                    </button>
                    <button onClick={chat} className='px-2 py-2 rounded-md bg-gray-500 text-white'>
                        Chat
                    </button>
                </div> */}
            </div>
            <div className='grid grid-cols-4 gap-4'>
                <div>
                    <h2 className='font-bold text-xl mb-2'>Groups</h2>
                    <div className='space-y-2'>
                        {usersGroups.map((group, index) => (
                            <GroupComponent key={index} group={group} />
                        ))}
                    </div>
                </div>
                <div>
                        <CreateGroupComponent></CreateGroupComponent>
                </div>
                <div>
                    <h2 className='font-bold text-xl mb-2'>Search for Groups</h2>
                    <FindGroupComponent groups={usersGroups}/>
                </div>
            </div>
        </div>
        </div>
    );
}
