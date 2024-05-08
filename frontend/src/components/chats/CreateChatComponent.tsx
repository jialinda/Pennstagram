import React, { useState } from 'react';
import axios from 'axios';
import config from '../../../config.json';
import { useParams, useNavigate } from 'react-router-dom';

function CreateChatComponent() {
    const { username, chat_id } = useParams();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [invitedUsers, setInvitedUsers] = useState(new Set()); // Tracks IDs of users who have been invited

    const handleSearch = async () => {
        console.log('handle search is called');
        try {
            const response = await axios.get(`${config.serverRootURL}/getFriend`, {
                params: {
                    user_id: 2, // This should be dynamically set based on the current user
                    username: searchQuery
                }
            });
            console.log('all friends with username', response.data.results);
            if (!response.data.results) {
              alert(`Can't find your friend with this username!`);
              setSearchResults([]);
            } else {
              setSearchResults(response.data.results);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setSearchResults([]);
        }
    };

    const handleSendInvite = async (user) => {
        if (invitedUsers.has(user.user_id)) { // keep track of user id?
            console.log('Invite already sent to', user.username);
            return;
        }

        try {
            const response = await axios.post(`${config.serverRootURL}/postInvite`, {
                chat_id: chat_id,
                invitee_id: user.user_id,
                inviter_id: 2, // Adjust based on session or authentication context
                confirmed: 0
            });

            if (response.status === 201) {
                console.log('Invite was successfully sent to', user.username);
                setInvitedUsers(prev => new Set(prev).add(user.user_id));
                alert(response.data.message);
            } else {
                alert("Invite failed");
            }
        } catch (error) {
            console.error('Error sending invite:', error);
            if (error.response && error.response.status === 409) {
                alert("Chat already exists!");
            }
        }
    };

    const handleSubmit = () => {
        navigate(`/${username}/chat`);
    };

    return (
        <div className='w-screen h-screen flex justify-center'>
            <form className='rounded-md bg-blue-50 p-6 space-y-2 w-full'>
                <div className='font-bold flex w-full justify-center text-2xl mb-4'>
                    Search & Invite Friends to your Chatroom
                </div>
                <div className='flex space-x-4 items-center justify-between'>
                    <input
                        id="search"
                        type="text"
                        className='outline-none bg-white rounded-md border border-slate-100 p-2'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button
                        type="button"
                        className='px-4 py-2 rounded-md bg-blue-500 outline-none font-bold text-white'
                        onClick={handleSearch}
                    >
                        Search
                    </button>
                </div>
                <div>
                    {searchResults.map(user => (
                        <div key={user.user_id} className="flex items-center space-x-2">
                            <span>{user.username}</span>
                            {invitedUsers.has(user.user_id) ? (
                                <button
                                    type="button"
                                    className="bg-green-500 text-white px-2 py-1 rounded"
                                    disabled
                                >
                                    Invite Sent
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="bg-blue-500 text-white px-2 py-1 rounded"
                                    onClick={() => handleSendInvite(user)}
                                >
                                    Send Invite
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <div className='w-full flex justify-center'>
                    <button
                        type="button"
                        className='px-4 py-2 rounded-md bg-blue-500 outline-none font-bold text-white'
                        onClick={handleSubmit}
                    >
                        Done
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateChatComponent;
