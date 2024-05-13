import React from 'react';

function InviteComponent({ inviterName, onAccept, onDecline }) {
  return (
    <div className='rounded-md bg-slate-50 w-full max-w-[1000px] space-y-2 p-3'>
      <div className='text-slate-800'>{inviterName} invited you to chat! Accept to begin chat!</div>
      <div className="flex space-x-4">
        <button className='px-4 py-2 rounded-md bg-green-500 text-white font-semibold' onClick={onAccept}>Accept</button>
        <button className='px-4 py-2 rounded-md bg-red-500 text-white font-semibold' onClick={onDecline}>Decline</button>
      </div>
    </div>
  );
}

export default InviteComponent;