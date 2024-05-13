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
    actorsList: [],
    linkedActor: '',
    hashtags: [], 
    imageURL: ''
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(`${config.serverRootURL}/${username}/userinfo`);
        const userData = response.data[0];
        setUserDetails({
          username: userData.username,
          email: userData.email,
          actorsList: userData.actorsList.split(', '),
          linkedActor: userData.linkedActor,
          hashtags: userData.hashtags ? userData.hashtags.split(', ') : [], 
          imageURL: userData.imageURL
        });
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      }
    };

    fetchUserDetails();
  }, [username]);

  const handleLogout = async () => {
    try {
      const response = await axios.post(`${config.serverRootURL}/logout`);
      console.log(response.data.message); 
      navigate("/login");
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };


  const handleEditProfile = () => {
    navigate(`/${username}/editprofile`);
  };

  return (
    <div className='flex flex-col min-h-screen bg-gray-100'>
      <div className="w-full px-6 py-4 bg-blue-500 text-white flex items-center justify-between">
        <button onClick={() => navigate("/"+username+"/feed")} className="text-lg font-semibold">
          Back to Feed
        </button>
        <h1 className='text-2xl font-bold'>Profile</h1>
        <div className="space-x-4">
          <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none">
            Log Out
          </button>
          <button onClick={handleEditProfile} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 focus:outline-none">
            Edit Profile
          </button>
        </div>
      </div>
      <div className='flex-grow flex items-center justify-center p-4'>
        <div className='bg-white rounded-lg shadow-lg p-6 max-w-md w-full'>
          <div className='text-center space-y-4'>
            {userDetails.imageURL && (
              <img src={'/nets2120/project-stream-team/uploads/1714079672158-423944057_1461939054356673_4217162015685765151_n.png'} alt="Profile" className="w-40 h-40 rounded-full mx-auto" onError={(e) => e.target.style.display = 'none'}/>
            )}
            <p className='text-md'><strong>Email:</strong> {userDetails.email}</p>
            <p className='text-md'><strong>Linked Actor:</strong> {userDetails.linkedActor}</p>
            <p className='text-md'><strong>Actors List:</strong> {userDetails.actorsList.join(', ')}</p>
            <div className='text-md overflow-auto whitespace-nowrap'>
              <strong>Hashtags:</strong> {userDetails.hashtags.length > 0 ? userDetails.hashtags.join(' #') : 'No hashtags'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
