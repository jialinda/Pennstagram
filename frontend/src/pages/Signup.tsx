import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';

export default function Signup() {
    const navigate = useNavigate(); 
    
    // TODO: set appropriate state variables 

    const rootURL = config.serverRootURL;
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // const [linked_nconst, setLinkedNconst] = useState('');
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [email, setEmail] = useState('');
    const [affiliation, setAffiliation] = useState('');
    const [birthday, setBirthday] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
 
    const handleSubmit = async () => {

        // TODO: make sure passwords match

        if (password !== confirmPassword) {
            alert("Passwords do not match");
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
            console.log('username: ', username);
            console.log('password: ', password);
            // console.log('linked_nconst: ', linked_nconst);
            const response = await axios.post(`${rootURL}/register`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            console.log('response:', response);

            if (response.status === 200) {
                navigate('/${username}/home');
            } else {
                alert("Registration failed.");
            }
        } catch (error) {
            console.error("Registration error:", error);
            alert("Registration failed. Please try again later.");
        }
        
    };

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setPhoto(event.target.files[0]);
        } else {
            setPhoto(null); // Clear the photo state if no files are selected
        }
    };
    
      return (
        <div className='w-screen h-screen flex items-center justify-center'>
            <form onSubmit={handleSubmit}>
                <div className='rounded-md bg-slate-50 p-6 space-y-4 w-full max-w-md'>
                    <div className='font-bold text-2xl mb-4 text-center'>Sign Up to Pennstagram</div>
                    <input id="username" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    <input id="firstname" type="text" placeholder="First Name" value={firstname} onChange={(e) => setFirstname(e.target.value)} />
                    <input id="lastname" type="text" placeholder="Last Name" value={lastname} onChange={(e) => setLastname(e.target.value)} />
                    <input id="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input id="affiliation" type="text" placeholder="Affiliation" value={affiliation} onChange={(e) => setAffiliation(e.target.value)} />
                    <input id="birthday" type="date" placeholder="Birthday" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                    <input id="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <input id="confirmPassword" type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    <input id="photo" type="file" onChange={handlePhotoChange} />
                    <button type="submit" className='bg-indigo-500 text-white font-bold py-2 px-4 rounded'>Sign up</button>
                </div>
            </form>
        </div>
    );
}
