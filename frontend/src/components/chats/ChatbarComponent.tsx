import React from 'react';

function ChatbarComponent({ chatname }) {
  return (
    <div className='rounded-md bg-slate-50 w-full max-w-[1000px] space-y-2 p-3'>
      <div className='text-slate-800'>{chatname}</div>
      <div className="flex space-x-4">
      </div>
    </div>
  );
}

export default ChatbarComponent;