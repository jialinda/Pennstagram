import React, { useState } from 'react';
import axios from 'axios';
import config from '../../../config.json';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import $ from 'jquery';
import NavBar from '../Navbar';


const rootURL = config.serverRootURL;

const GroupComponent = ({ group, handleJoinGroup }: { name: string }) => {
    return (
        <div className='rounded-md bg-blue-100 p-3 flex space-x-2 items-center flex-auto justify-between'>
            <div className='font-semibold text-base'>
                { group.cName }
            </div>
            <button type="button" className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => handleJoinGroup(group)}>Join group</button>
        </div>
    )
}

const AlreadyMemberComponent = ({ group }: { name: string }) => {
    return (
        <div className='rounded-md bg-green-100 p-3 flex space-x-2 items-center flex-auto justify-between'>
            <div className='font-semibold text-base'>
                {group.communities_name} (Already a member)
            </div>
        </div>
    )
}

function FindGroupComponent({ groups }) {

    const [searchQuery, setSearchQuery] = useState(''); // State to store search query
    const [searchResults, setSearchResults] = useState([]); // State to store search results
    // const { username } = useParams();

    const { username } = useParams();
    console.log('groups', groups);
    const g_usernames = groups.map(g => g.communities_name);
    console.log('groupnames', g_usernames)
    // const group_names = friends.map(friend => friend.username);
    console.log('Username:', username);
    const navigate = useNavigate(); 

    const handleJoinGroup = async (g) => {
        // Add the user to the invitees list
        console.log('joining group ', g);
        // e.preventDefault();
        try {
          const response = await axios.post(`${rootURL}/joinGroup`, {
            groupId: g.cId,
            group_name: g.cName
          }
        );
          if (response.status == 201) {
            console.log('successfully joined: ', g.cName);   
            alert('Joined group successfully!');     
          } else {
            alert("Could not join group");
        }
        } catch (error) {
              // For other errors, log the error to the console
              console.error('Error sending invite:', error);
      };
    }

    const handleSearch = async () => {
        console.log('handle search is called');
        try {
        console.log('finding ANYONE with username: ', searchQuery);
        const response = await axios.get(`${rootURL}/getGroupByName`, {
            params: {
                communities_name: searchQuery // check
            }
        });
        const allUsers = response.data.results;
        console.log('all friends with username', allUsers);
        if (allUsers.length === 0) {
            setSearchResults([]);
        } else {
            setSearchResults(allUsers);
        }
        } catch (error) {
            if (error.response && error.response.status === 409) {
                alert('No user exists with that username!');
            } else {
                console.error('Error fetching users:', error);
                alert('An error occurred while searching.');
            }
            setSearchResults([]);
        }
        
    };
    
      const handleSubmit = async (e) => {
        navigate("/"+ username+"/chat");
      };

  return (
    <form>
      <div className='rounded-md bg-blue-50 p-6 space-y-2 w-full'>
        <div className='font-bold flex w-full justify-center text-2xl mb-4'>
          Search & Add Friends
        </div>
        <div className='flex space-x-4 items-center justify-between'>
            <input id="search" type="text" className='outline-none bg-white rounded-md border border-slate-100 p-2'
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <button type="button" className='px-4 py-2 rounded-md bg-blue-500 outline-none font-bold text-white' onClick={handleSearch}>Search</button>
        </div>
        <div>
          {searchResults.map(group => (
            <div key={group.cId} className="flex items-center space-x-2">
                {/* add a join button later */}
                {g_usernames.includes(group.cName) ?
                    <AlreadyMemberComponent group={group} /> :
                    <GroupComponent group={group} handleJoinGroup={handleJoinGroup}/>
                }
            </div>
            ))}
        </div>
        <div className='w-full flex justify-center'>
          <button type="button" className='px-4 py-2 rounded-md bg-blue-500 outline-none font-bold text-white'
            onClick={handleSubmit}>Done</button>
        </div>
      </div>
    </form>
  );
}

export default FindGroupComponent;
