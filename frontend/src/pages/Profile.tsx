import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState({
    username: '',
    firstname: '',
    lastname: '',
    email: '',
    affiliation: '',
    birthday: '',
    photo: null
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(`${config.serverRootURL}/user/${username}`);
        if (response.data) {
          setUserDetails({
            ...response.data,
            photo: response.data.photo ? `data:image/jpeg;base64,${response.data.photo}` : null
          });
        }
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      }
    };
    fetchUserDetails();
  }, [username]);

  // check this, need to make sure user's session ends
  const handleLogout = () => {
    navigate('/');
  };

  // navigate to edit profile page if button clicked
  const handleEditProfile = () => {
    navigate(`/${username}/editprofile`);
  };

  return (
    <div className='w-screen h-screen flex flex-col items-center justify-center'>
      <div className='bg-white shadow-xl rounded-lg p-8 max-w-md w-full'>
        <div className='text-center'>
          <img src={userDetails.photo || 'default_profile.png'} alt="Profile" className='w-32 h-32 rounded-full mx-auto' />
          <h1 className='text-2xl font-semibold mt-4'>{userDetails.firstname} {userDetails.lastname}</h1>
          <p className='text-md text-gray-600'>{userDetails.username}</p>
          <p className='text-md text-gray-500'>{userDetails.email}</p>
          <p className='text-md'>{userDetails.affiliation}</p>
          <p className='text-md'>{new Date(userDetails.birthday).toLocaleDateString()}</p>
        </div>
        <div className='flex justify-around mt-6'>
          <button onClick={handleEditProfile} className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'>
            Edit Profile
          </button>
          <button onClick={handleLogout} className='bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded'>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
