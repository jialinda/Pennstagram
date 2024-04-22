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
    const [linked_nconst, setLinkedNconst] = useState('');
 
    const handleSubmit = async () => {

        // TODO: make sure passwords match

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {
            console.log('username: ', username);
            console.log('password: ', password);
            console.log('linked_nconst: ', linked_nconst);
            const response = await axios.post(`/${rootURL}/register`, {
                username,
                password,
                linked_id : linked_nconst,
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
     return (
        <div className='w-screen h-screen flex items-center justify-center'>
            <form onSubmit={handleSubmit}>
                <div className='rounded-md bg-slate-50 p-6 space-y-2 w-full'>
                    <div className='font-bold flex w-full justify-center text-2xl mb-4'>
                        Sign Up to Pennstagram
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="username" className='font-semibold'>Username</label>
                        <input
                            id="username"
                            type="text"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="linked_nconst" className='font-semibold'>Linked nconst</label>
                        <input
                            id="linked_nconst"
                            type="text"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={linked_nconst}
                            onChange={(e) => setLinkedNconst(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="password" className='font-semibold'>Password</label>
                        <input
                            id="password"
                            type="password"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className='flex space-x-4 items-center justify-between'>
                        <label htmlFor="confirmPassword" className='font-semibold'>Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            className='outline-none bg-white rounded-md border border-slate-100 p-2'
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    <div className='w-full flex justify-center'>
                        <button
                            type="submit"
                            className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
                        >
                            Sign up
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}