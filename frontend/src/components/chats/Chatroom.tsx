import React from 'react';

const Chatroom = ({ messages, input, setInput, sendMessage, inviteToChat, leaveChat }) => {
    return (
        <div className='font-bold text-2xl'>{currChat.chatname}</div>
        <div className='h-100% w-[30rem] bg-slate-100 p-3'>
            <div className='h-[90%] overflow-scroll'>
                <div className='space-y-2'>
                    {messages.map(msg => {
                        return (
                            <MessageComponent sender={msg.sender} message={msg.message} />
                        )
                    })}
                </div>
            </div>
            <div className='w-full flex space-x-2'>
                <input className='w-full outline-none border-none px-3 py-1 rounded-md'
                    placeholder='Ask something!'
                    onChange={e => setInput(e.target.value)}
                    value={input}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            sendMessage();
                            setInput('');
                        }
                    }} />
                <button className='outline-none px-3 py-1 rounded-md text-bold bg-indigo-600 text-white'
                    onClick={() => {
                        sendMessage();
                    }}>Send</button>
                <button className='outline-none px-3 py-1 rounded-md text-bold bg-green-600 text-white'
                    onClick={inviteToChat}>Invite</button>
                <button className='outline-none px-3 py-1 rounded-md text-bold bg-red-600 text-white'
                    onClick={leaveChat}>Leave</button>
            </div>
        </div>
    );
}

export default Chatroom;