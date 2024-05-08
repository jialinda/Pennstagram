import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState({
    username: '',
    email: '',
    linkedActor: '',
    actorsList: [],
    hashtags: [],
    newEmail: '',
    newPassword: '',
    suggestedHashtags: []
  });
  const [statusMessage, setStatusMessage] = useState('');  
  const [selectedHashtags, setSelectedHashtags] = useState([]);


  useEffect(() => {
    fetchUserDetails();
    fetchSuggestedHashtags();
  }, [username]);


  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(`${config.serverRootURL}/${username}/userinfo`);
      const userData = response.data[0];
      setUserDetails(prev => ({
        ...prev,
        username: userData.username,
        email: userData.email,
        actorsList: userData.actorsList.split(', '),
        linkedActor: userData.linkedActor,
        hashtags: userData.hashtags ? userData.hashtags.split(', ') : []
      }));
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  const fetchSuggestedHashtags = async () => {
    try {
      const response = await axios.get(`${config.serverRootURL}/hashtags/top`);
      setUserDetails(prev => ({
        ...prev,
        suggestedHashtags: response.data.map(h => ({ name: h.hashtagname, selected: false }))
      }));
    } catch (error) {
      console.error('Failed to fetch suggested hashtags:', error);
    }
  };

  // useEffect(() => {
  //   const fetchUserDetails = async () => {
  //     try {
  //       const response = await axios.get(`${config.serverRootURL}/${username}/userinfo`);
  //       const userData = response.data[0]; // Assuming the first element of the response data is the user data
  //       setUserDetails({
  //         ...userDetails,
  //         username: userData.username,
  //         email: userData.email,
  //         linkedActor: userData.linkedActor,
  //         actorsList: userData.actorsList.split(', '),
  //         hashtags: userData.hashtags ? userData.hashtags.split(', ') : [],
  //       });
  //     } catch (error) {
  //       console.error('Failed to fetch user details:', error);
  //       setStatusMessage('Failed to load user details.'); // Display error in loading details
  //     }
  //   };

  //   fetchUserDetails();
  // }, [username]);

  const handleActorChange = async (newActor) => {
    if (newActor !== userDetails.linkedActor) {
      try {
        await axios.post(`${config.serverRootURL}/${username}/changeActor`, { newActor });
        setUserDetails({ ...userDetails, linkedActor: newActor });
        setStatusMessage(`${username} is now linked to ${newActor}`);  // Set success message
      } catch (error) {
        console.error('Failed to change actor:', error);
        setStatusMessage('Failed to change linked actor.'); // Display error message
      }
    }
  };

  const handleEmailChange = async () => {
    try {
      await axios.post(`${config.serverRootURL}/${username}/changeEmail`, { newEmail: userDetails.newEmail });
      setUserDetails({ ...userDetails, email: userDetails.newEmail });
      setStatusMessage('Email updated successfully.');  // Set success message
    } catch (error) {
      console.error('Failed to update email:', error);
      setStatusMessage('Failed to update email.'); // Display error message
    }
  };
  
  const handlePasswordChange = async () => {
    try {
      await axios.post(`${config.serverRootURL}/${username}/changePassword`, { newPassword: userDetails.newPassword });
      setStatusMessage('Password updated successfully.');  // Set success message
    } catch (error) {
      console.error('Failed to update password:', error);
      setStatusMessage('Failed to update password.'); // Display error message
    }
  };

  const toggleHashtagSelection = (hashtagName) => {
    setUserDetails(prev => ({
      ...prev,
      suggestedHashtags: prev.suggestedHashtags.map(hashtag =>
        hashtag.name === hashtagName ? { ...hashtag, selected: !hashtag.selected } : hashtag
      )
    }));
  };

  const handleHashtagUpdate = async () => {
    const selectedHashtags = userDetails.suggestedHashtags
      .filter(tag => tag.selected)
      .map(tag => tag.name);

      console.log('selected:', selectedHashtags);

    try {
      await axios.post(`${config.serverRootURL}/${username}/changeHashtags`, { hashtags: selectedHashtags});
      setUserDetails(prev => ({
        ...prev,
        hashtags: selectedHashtags,
        suggestedHashtags: prev.suggestedHashtags.map(tag => ({ ...tag, selected: false }))
      }));
      setStatusMessage('Hashtags updated successfully.');
    } catch (error) {
      console.error('Failed to update hashtags:', error);
      setStatusMessage('Failed to update hashtags.');
    }
  };

  const handleBackProfile = () => {
    navigate(`/${username}/profile`);
  };

  const handleLogout = async () => {
    try {
      const response = await axios.post(`${config.serverRootURL}/logout`);
      console.log(response.data.message); 
      navigate("/login");
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };


  return (
    <div className='flex flex-col min-h-screen bg-gray-100'>
      <div className="w-full px-6 py-4 bg-blue-500 text-white flex items-center justify-between">
        <button onClick={() => navigate("/"+username+"/feed")} className="text-lg font-semibold">
          Back to Feed
        </button>
        <h1 className='text-2xl font-bold'>Edit Profile</h1>
        <div className="space-x-4">
          <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none">
            Log Out
          </button>
          <button onClick={handleBackProfile} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none">
            Back to Profile
          </button>
        </div>
      </div>
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4'>
      <div className='bg-white rounded-lg shadow-lg p-6 max-w-md w-full'>
        <div className='text-center space-y-4'>
          <h1 className='text-2xl font-semibold text-gray-800'>{userDetails.username}</h1>
          <p><strong>Email:</strong> {userDetails.email}</p>
          <p><strong>Linked Actor:</strong> {userDetails.linkedActor}</p>
          <div>
            <p><strong>Change Actor:</strong></p>
            {userDetails.actorsList.map((actor, index) => (
              <button key={index} onClick={() => handleActorChange(actor)} className='m-2 bg-blue-200 hover:bg-blue-300 rounded px-2 py-1'>
                {actor}
              </button>
            ))}
          </div>
          {statusMessage && <p className="text-green-500">{statusMessage}</p>} {/* Display status message here */}
          <div>
            <p><strong>Current Hashtags:</strong></p>
            {userDetails.hashtags.map((tag, index) => (
              <span key={index} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">{tag}</span>
            ))}
          </div>
          <div>
            <p><strong>Suggested Hashtags:</strong></p>
            {userDetails.suggestedHashtags.map((tag, index) => (
              <label key={index} className="inline-flex items-center space-x-2">
                <input type="checkbox" checked={tag.selected} onChange={() => toggleHashtagSelection(tag.name)} />
                <span>{tag.name}</span>
              </label>
            ))}
          </div>
          <button onClick={handleHashtagUpdate} className="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
            Update Hashtags
          </button>
          <div className='space-x-2'>
            <input type="text" placeholder="New email" onChange={e => setUserDetails({...userDetails, newEmail: e.target.value})} />
            <button onClick={handleEmailChange} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
              Update Email
            </button>
            <input type="password" placeholder="New password" onChange={e => setUserDetails({...userDetails, newPassword: e.target.value})} />
            <button onClick={handlePasswordChange} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
              Update Password
            </button>
          </div>
        </div>
      </div>
     </div>
    </div>
  );
}
