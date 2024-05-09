import React from 'react';
import ChatbarComponent from './ChatbarComponent';

function ChatBar({ chatbars, setCurrChat, handleChatClick }) {
    // const handleChatClick = (chatId) => {
    //   console.log('changing to chat with the id', chatId);
    //     // setCurrChat(chatId);
    // };

    return (
        <div className="overflow-auto bg-slate-200 p-4 rounded-md">
            {chatbars.map((chatbar, index) => (
                <div key={index} className="mb-4">
                    <button
                        className="w-full text-left px-4 py-2 rounded-md bg-white shadow-md hover:bg-gray-100 focus:outline-none"
                        onClick={() => handleChatClick(chatbar)} // Assuming chatbar has an 'id' property
                    >
                        <ChatbarComponent chatname={chatbar.chatname} />
                    </button>
                </div>
            ))}
        </div>
    );
}

export default ChatBar;
