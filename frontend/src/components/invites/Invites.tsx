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
        if (!invite.is_groupchat) {
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
        } else {
          try {
            console.log('accepted groupchat invite for chat', invite.chatId);
            const response = await axios.post(`${rootURL}/confirmInviteChat`, {
              params: {
                inviteId: inviteId,
                adminId: adminId,
                chatId: invite.chatId
              }
            });
            console.log('delete response', response);
          } catch (err) {
            console.log('error', err);
          }
          
        }
      };
      const handleDeclineInvite = async (inviteId) => {
        // Function to handle decline invitation action
         // you delete the invite from your database
        //  and don't create groupchat
        console.log("Invite declined here", inviteId);
        try {
          console.log('deleting user invite')
          const response = await axios.post(`${rootURL}/deleteUInvite`, {
            params: {
              inviteId: inviteId,
              user_id: 2 // CHANGE HERE
            }
          });
          console.log('delete response', response);
        } catch (err) {
          console.log('error', err);
        }
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