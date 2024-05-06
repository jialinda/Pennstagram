import React from 'react';
import InviteComponent from './InviteComponent';


function Invites({ invites }) {
    const handleAcceptInvite = () => {
        // Function to handle accept invitation action
        console.log("Invite accepted");
      };
    
      const handleDeclineInvite = () => {
        // Function to handle decline invitation action
        console.log("Invite declined");
      };

  return (
    <div className="overflow-auto bg-slate-200 p-4 rounded-md">
        {invites.map((invite, index) => (
            <div key={index} className="mb-4">
                <InviteComponent 
                    inviteeName={invite.inviteeName} 
                    chatroomName={invite.chatroomName} 
                    onAccept={handleAcceptInvite} 
                    onDecline={handleDeclineInvite} 
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