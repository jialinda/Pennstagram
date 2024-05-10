import { useState, useEffect } from 'react'
import axios from 'axios';
import config from '../../config.json';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
// import InviteComponent from '../components/InviteComponent'
import Invites from '../components/invites/Invites'
import ChatBar from '../components/chats/ChatBar'
import Chatroom from '../components/chats/Chatroom'
import $ from 'jquery';
// import io from 'socket.io-client';

// const socket = io('http://localhost:8080'); // Make sure this matches the server address and port

// // Listening for messages
// socket.on('receiveMessage', (message) => {
//   console.log('New message:', message);
// });

// // Sending a message
// socket.emit('sendMessage', { message: 'Hello, world!' });


const rootURL = config.serverRootURL;


const MessageComponent = ({ sender, message, timestamp }: { sender: string, message: string, timestamp: string }) => {
    const { username } = useParams(); // check this
    const messageStyle = sender === username ? 'justify-end bg-blue-100' : 'bg-slate-200'
    return (
        <div className={`w-full flex ${messageStyle}`}>
            <div className={`text-left max-w-[70%] p-3 rounded-md break-words ${messageStyle}`}>
                {sender}:
            </div>
            <div className={`text-left max-w-[70%] p-3 rounded-md break-words ${messageStyle}`}>
                {message}
            </div>
            <div className="text-xs text-gray-500">{timestamp}</div>
        </div>
    )
}

// TODO: in ChatInterface, let's also add another section for invites
// decline invite option -> create a delete invites route

export default function ChatInterface() {
    // const [messages, setMessages] = useState([{ sender: 'chatbot', message: 'Hi there! What movie review questions do you have?' }]);
    const [messages, setMessages] = useState([]);
    const [currChat, setCurrChat] = useState({});
    const [input, setInput] = useState<string>('');
    const { username } = useParams();
    const [invites, setInvites] = useState([]);
    const [chats, setChats] = useState([]);
    const navigate = useNavigate(); 

    let userId; // check
    // I have to change that
    userId = 2;
    console.log('this is currChat', currChat);

    const feed = () => {
        navigate('/' + username + '/feed'); // changed from home to feed
    };
    const friends = () => {
        navigate("/"+ username+"/friends");
    };

    const createChatroom = () => {
        // consider doing to invite friends instead..?
        navigate('/' + username + '/createChat');
    };

    const testChats = [
        { chatname: 'CIS tutoring' },
        { chatname: 'every now & then'}
    ];

    const testCurrChat = { chat_id: 1,
        chatname: 'every now & then',
        admin: 1};


    useEffect(() => {
        fetchInvites(userId);
        console.log('invites', invites);
        // check with user 2 for no
        // const userId = 2;
        fetchChats(userId);
        console.log('chats', chats);
        // fetchCurrChat();
        // console.log('chats', chats);
    }, []);
    // }); // CHECK
    // check how I can change this part

    // ajax
    const fetchInvites = async (userId) => {
        $.ajax({
            url: `${rootURL}/getInviteAll`,
            method: 'GET',
            data: {
                user_id: userId
            },
            success: function(response) {
                setInvites(response.results);
            },
            error: function(error) {
                console.error('Error fetching invites:', error);
            }
        });
    };

    // ajax getTextByChatId
    const handleChatClick = async (chat) => {
        console.log('handle chat click called with chat obj', chat);
        setCurrChat(chat);
        console.log('this is now curr chat', chat);
        // Try to get the texts from the chats
        $.ajax({
            url: `${rootURL}/getTextByChatId`,
            method: 'GET',
            data: {
                chat_id: chat.chat_id
            },
            success: function(response) {
                const { results } = response;
                setMessages(results);
            },
            error: function(error) {
                console.error('Error fetching messages:', error);
            }
        });
    };

    // ajax fetchchats
    const fetchChats = async (userId) => {
        $.ajax({
            url: `${rootURL}/getChatAll`,
            method: 'GET',
            data: {
                user_id: userId
            },
            success: function(response) {
                const allChats = response.results;
                console.log('all chats', allChats);
                setChats(allChats);
            },
            error: function(error) {
                console.error('Error fetching chats:', error);
            }
        });
    };

    const sendMessage = async () => {
        const timestamp = new Date(); // Get the current timestamp
        const year = timestamp.getFullYear();
        const month = String(timestamp.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed, so add 1
        const day = String(timestamp.getDate()).padStart(2, '0');
        const hours = String(timestamp.getHours()).padStart(2, '0');
        const minutes = String(timestamp.getMinutes()).padStart(2, '0');

        const formattedTimestamp = `${year}-${month}-${day} ${hours}:${minutes}`;
        const newMessage = {
            sender: username,
            message: input,
            timestamp: formattedTimestamp
        };
        console.log('adding new message', newMessage);
        setMessages([...messages, newMessage]);
        console.log('input: ', input);
        console.log('messages: ', messages);
    
        $.ajax({
            url: `${rootURL}/postText`, // Adjust 'rootURL' as necessary
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                content: input, // Ensure 'input' is defined in your scope
                chat_id: currChat.chat_id, // Ensure 'currChat.chat_id' is defined in your scope
                timestamp: formattedTimestamp
            }),
            success: function(response) {
                console.log('Message sent successfully:', response);
                // Optionally, update the UI or state to reflect new changes
            },
            error: function(xhr, status, error) {
                console.error('Error sending message:', error);
            }
        });

        setInput(''); // Reset input field or handle state update as needed
    };


    const inviteToChat = async (chat) => {
        console.log('this is chatname', chat.chatname);
        navigate('/' + username  +'/' + chat.chatname + '/' + chat.chat_id + '/inviteIntoChat');
    }

    const leaveChat = (chatId) => {
        console.log('leaving chat');
        $.ajax({
            url: `${rootURL}/leaveChatroom`, // Replace `rootURL` with your actual server URL
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                user_id: userId, // Ensure `userId` is defined in your scope or passed to the function
                chatId: chatId
            }),
            success: function(response) {
                console.log('Successfully left the chat');
                // Optionally, update the UI or state to reflect leaving the chat
            },
            error: function(xhr, status, error) {
                console.error('Error leaving chat:', error);
            }
        });
    }

    return (
        <div className='w-screen h-screen flex flex-col items-center'>
        <div className='w-full h-16 bg-slate-50 flex justify-center mb-2'>
            <div className='font-bold text-2xl max-w-[1800px] w-full flex items-center'>
                Chat with your PennstaFriends, {username} ! &nbsp;
            <button type="button" className='px-2 py-2 rounded-md bg-blue-500 outline-none text-white'
              onClick={feed}>Feed</button>&nbsp;
            <button type="button" className='px-2 py-2 rounded-md bg-blue-500 outline-none text-white'
              onClick={friends}>Friends</button>
            </div>
        </div>
            <div className='font-bold text-3xl'>Chatroom</div>
            <div className="p-4 w-full flex items-center justify-between bg-blue-200">
            <button className='px-2 py-2 rounded-md bg-blue-500 outline-none text-white' onClick = {createChatroom}>Create Chatroom</button>
            {/* You can add toolbar content here */}
            </div>
            <div className='flex'> {/* Add a container div */}
            <div className='w-1/3'> {/* First div */}
                    <div className='font-bold text-2xl'>Your Invites</div>
                    <Invites  invites={invites} ></Invites>
                    {/* <InviteComponent onClick={handleAcceptInvite} inviteeName={'Joanna'} chatroomName={'NETS2120'}/> */}
                </div>
                <div className='w-1/3'> {/* First div */}
                    <div className='font-bold text-2xl'>Your Chats</div>
                    <ChatBar chatbars={chats} setCurrChat={setCurrChat} handleChatClick={handleChatClick} ></ChatBar>
                    {/* <div className='h-[40rem] w-100% bg-blue-100 p-3'></div> */}
                </div>
                {currChat && currChat.chatname && (
                <div className='w-1/3'> {/* Second div */}
                    <div className='font-bold text-2xl'>{currChat.chatname}</div>
                    <div className='h-100% w-[30rem] bg-slate-100 p-3'>
                    <div className='h-[90%] overflow-scroll'>
                        <div className='space-y-2'>
                            {messages.map(msg => {
                                return (
                                    <MessageComponent sender={msg.sender} message={msg.message} timestamp={msg.timestamp} />
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
                            onClick={() => inviteToChat(currChat)}>Invite</button>
                        <button className='outline-none px-3 py-1 rounded-md text-bold bg-red-600 text-white'
                            onClick={() => leaveChat(currChat.chat_id)}>Leave</button>
                    </div>
                </div>
                </div>
                )}
            </div>
            
        </div>
    )
}
