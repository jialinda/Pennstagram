import React, { useState } from 'react';
import axios from 'axios';
import config from '../../../config.json';
import { useParams } from 'react-router-dom';

function CreateGroupComponent() {
  const [groupName, setGroupName] = useState('');
  const { username } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${config.serverRootURL}/postGroup`, {
        group_name: groupName,
      }, { withCredentials: true });
      console.log(response);
      if (response.status === 201 || response.status === 200) {
        // Clear input fields
        setGroupName('');
        // Optionally, update groups list
        // updateGroups();
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  return (
    <div className='w-screen h-screen flex justify-center'>
      <form>
        <div className='rounded-md bg-slate-50 p-6 space-y-2 w-full max-w-md'>
          <div className='font-bold flex w-full justify-center text-2xl mb-4'>
            Create Group
          </div>
          <div className='flex space-x-4 items-center justify-between'>
            <label htmlFor="groupName" className='font-semibold'>Group Name</label>
            <input id="groupName" type="text" className='outline-none bg-white rounded-md border border-slate-100 p-2'
              value={groupName} onChange={(e) => setGroupName(e.target.value)} />
          </div>
          <div className='w-full flex justify-center'>
            <button type="button" className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
              onClick={handleSubmit}>Create Group</button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CreateGroupComponent;
