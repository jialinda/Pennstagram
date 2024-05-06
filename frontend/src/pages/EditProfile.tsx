import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';

export default function EditProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const rootURL = config.serverRootURL;

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
        const response = await axios.get(`${rootURL}/user/${username}`);
        setUserDetails(response.data);
      } catch (err) {
        console.error('Error fetching user details:', err);
      }
    };
    fetchUserDetails();
  }, [username]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUserDetails({ ...userDetails, [name]: value });
  };

  const handlePhotoChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setUserDetails({ ...userDetails, photo: event.target.files[0] });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    Object.keys(userDetails).forEach(key => {
      formData.append(key, userDetails[key]);
    });

    try {
      await axios.put(`${rootURL}/user/update/${username}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again later.');
    }
  };

  const handleLogout = () => {
    console.log('Logging out...');
    navigate('/');
  };

  return (
    <div className='w-screen h-screen flex items-center justify-center'>
      <div className='bg-white shadow-xl rounded-lg p-8 max-w-2xl w-full'>
        <h1 className='text-3xl font-bold mb-6 text-center'>Edit Profile</h1>
        <form onSubmit={handleSubmit}>
          <div className='grid grid-cols-2 gap-6'>
            {/* Username */}
            <div>
              <label htmlFor="username" className='font-semibold'>Username</label>
              <input id="username" name="username" type="text" value={userDetails.username} onChange={handleInputChange} className='mt-1 p-2 w-full border rounded' readOnly/>
            </div>
            {/* First Name */}
            <div>
              <label htmlFor="firstname" className='font-semibold'>First Name</label>
              <input id="firstname" name="firstname" type="text" value={userDetails.firstname} onChange={handleInputChange} className='mt-1 p-2 w-full border rounded'/>
            </div>
            {/* Last Name */}
            <div>
              <label htmlFor="lastname" className='font-semibold'>Last Name</label>
              <input id="lastname" name="lastname" type="text" value={userDetails.lastname} onChange={handleInputChange} className='mt-1 p-2 w-full border rounded'/>
            </div>
            {/* Email */}
            <div>
              <label htmlFor="email" className='font-semibold'>Email</label>
              <input id="email" name="email" type="email" value={userDetails.email} onChange={handleInputChange} className='mt-1 p-2 w-full border rounded'/>
            </div>
            {/* Affiliation */}
            <div>
              <label htmlFor="affiliation" className='font-semibold'>Affiliation</label>
              <input id="affiliation" name="affiliation" type="text" value={userDetails.affiliation} onChange={handleInputChange} className='mt-1 p-2 w-full border rounded'/>
            </div>
            {/* Birthday */}
            <div>
              <label htmlFor="birthday" className='font-semibold'>Birthday</label>
              <input id="birthday" name="birthday" type="date" value={userDetails.birthday} onChange={handleInputChange} className='mt-1 p-2 w-full border rounded'/>
            </div>
            {/* Profile Photo */}
            <div className='col-span-2'>
              <label htmlFor="photo" className='font-semibold'>Profile Photo</label>
              <input id="photo" name="photo" type="file" onChange={handlePhotoChange} className='mt-1 p-2 w-full border rounded'/>
              {userDetails.photo && <img src={URL.createObjectURL(userDetails.photo)} alt="Profile" className='mt-4 w-32 h-32 rounded-full mx-auto'/>}
            </div>
          </div>
          <div className='mt-6 text-center'>
            <button type="submit" className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg mr-4'>Save Changes</button>
            <button type="button" onClick={handleLogout} className='bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg'>Log Out</button>
          </div>
        </form>
      </div>
    </div>
  );
}
