import React from 'react';
import InviteComponent from './InviteComponent';
import axios from 'axios';
import config from '../../../config.json';

const rootURL = config.serverRootURL;

function Invites({ invites }) {
    const handleAcceptInvite = async (invite) => {
        // Function to handle accept invitation action
        const inviteId = invite.inviteId;
        const adminId = invite.inviterId;
        console.log("Invite accepted for invite_id", inviteId);
        try {
          console.log('entered invite');
          const response = await axios.post(`${rootURL}/confirmInvite`, {
            params: {
              inviteId: inviteId,
              user_id: 2, // CHANGE HERE
              adminId: adminId
            }
          });
          console.log('delete response', response);
        } catch (err) {
          console.log('error', err);
        }
      };
    
    /*const handleAcceptInvite = async (invite) => {
      // Function to handle accept invitation action
      const inviteId = invite.inviteId;
      const adminId = invite.inviterId;
      console.log("Invite accepted for invite_id", inviteId);
      const handleAcceptInvite = async (invite) => {
        // Function to handle accept invitation action
        const inviteId = invite.inviteId;
        const adminId = invite.inviterId;
        console.log("Invite accepted for invite_id", inviteId);
        
        try {
            const response = await fetch(`${rootURL}/confirmInvite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inviteId: inviteId,
                    adminId: adminId
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const responseData = await response.json();
            console.log('delete response', responseData);
        } catch (error) {
            console.error('Error:', error);
        }
    };
  }*/
      const handleDeclineInvite = async (inviteId) => {
        // Function to handle decline invitation action
         // you delete the invite from your database
        //  and don't create groupchat
        console.log("Invite declined here", inviteId);
        try {
          console.log('entered');
          console.log('this is rootURL', rootURL);
          const response = await axios.post(`${rootURL}/deleteInvite`, {
            params: {
              inviteId: inviteId,
              user_id: 2 // CHANGE HERE
            }
          });
          console.log('delete response', response);
        } catch (err) {
          console.log('error', err);
        }
      };

  return (
    <div className="overflow-auto bg-slate-200 p-4 rounded-md">
        {invites
        .filter(invite => invite.confirmed !== 1) 
        .map((invite, index) => (
            <div key={index} className="mb-4">
                <InviteComponent 
                    inviterName={invite.inviterName} 
                    onAccept={() => handleAcceptInvite(invite)} 
                    onDecline={() => handleDeclineInvite(invite.inviteId)} 
                />
            </div>
        ))}
    </div>
    // <div>
    //   <InviteComponent 
    //     inviteeName={'Joanna'} 
    //     chatroomName={'NETS2120'} 
    //     onAccept={handleAcceptInvite} 
    //     onDecline={handleDeclineInvite} 
    //   />
    // </div>
  );
}

export default Invites;