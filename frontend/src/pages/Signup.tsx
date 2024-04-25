import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';

export default function Signup() {
  const navigate = useNavigate(); 
  
  const rootURL = config.serverRootURL;
  
  // State variables
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [birthday, setBirthday] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('firstname', firstname);
    formData.append('lastname', lastname);
    formData.append('email', email);
    formData.append('affiliation', affiliation);
    formData.append('birthday', birthday);
    
    if (photo) {
      formData.append('photo', photo);
    }

    try {
      const response = await axios.post(`${rootURL}/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        navigate(`/${username}/home`);
      } else {
        alert("Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed. Please try again later.");
    }
  };

  // Handle photo change
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setPhoto(event.target.files[0]);
    } else {
      setPhoto(null);
    }
  };

  // Navigate back to home
  const handleBackToHome = () => {
    navigate('/'); // Change '/' to the correct home route
  };

  return (
    <div className='w-screen h-screen flex items-center justify-center'>
      <form onSubmit={handleSubmit}>
        <div className='rounded-md bg-slate-50 p-6 space-y-4 w-full max-w-md'>
          <div className='font-bold text-2xl mb-4 text-center'>Make an Account</div>
          <input
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            id="firstname"
            type="text"
            placeholder="First Name"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
          />
          <input
            id="lastname"
            type="text"
            placeholder="Last Name"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
          />
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            id="affiliation"
            type="text"
            placeholder="Affiliation"
            value={affiliation}
          />
          <input
            id="birthday"
            type="date"
            placeholder="Birthday"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <input
            id="photo"
            type="file"
            onChange={handlePhotoChange}
          />
          <button type="submit" className='bg-indigo-500 text-white font-bold py-2 px-4 rounded'>Sign Up</button>
          <button
            type="button"
            className='bg-gray-300 text-black font-bold py-2 px-4 rounded'
            onClick={handleBackToHome}
          >
            Back to Home
          </button>
        </div>
      </form>
    </div>
  );
}
