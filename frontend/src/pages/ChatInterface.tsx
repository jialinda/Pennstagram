import { useState, useEffect } from 'react'
import axios from 'axios';
import config from '../../config.json';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
// import InviteComponent from '../components/InviteComponent'
import Invites from '../components/invites/Invites'
import ChatBar from '../components/chats/ChatBar'
import Chatroom from '../components/chats/Chatroom'

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
    userId = 2;

    const feed = () => {
        navigate('/' + username + '/home');
    };
    const friends = () => {
        navigate("/"+ username+"/friends");
    };

    const createChatroom = () => {
        // consider doing to invite friends instead..?
        navigate('/' + username + '/createChat');
    };

    const testInvites = [
        { inviteeName: 'Joanna', chatroomName: 'NETS2120' },
        { inviteeName: 'Iain', chatroomName: 'NETS2121' },
        { inviteeName: 'Linda', chatroomName: 'NETS2122' }
    ];

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
    // check how I can change this part

    const fetchInvites = async (userId) => {
        try {
            console.log('fetching invites');
            const response = await axios.get(`${rootURL}/getInviteAll`, {
                params: {
                    user_id: userId
                }
            });
            const allInvites = response.data.results;
            console.log('all invites frontend', allInvites);
            setInvites(allInvites);
            // setChats(testChats);
        } catch (error) {
            console.error('Error fetching invites:', error);
        }
    };

    const handleChatClick = async (chat) => {
        console.log('handle chat clikc called with chat obj', chat);
        setCurrChat(chat);
        console.log('this is now curr chat', chat);
        // try to get the texts from the chats
        try {
            const response = await axios.get(`${rootURL}/getTextByChatId`, {
                params: {
                    chat_id: chat.chat_id // Pass the chat_id to the backend
                }
            });
            const { results } = response.data;
            setMessages(results);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const fetchCurrChat = async () => {
        try {// edit this later
            // change later
        setCurrChat(testCurrChat);
        console.log('currChat', currChat);
        } catch (error) {
            console.error('Error fetching invites:', error);
        }
    };

    const fetchChats = async (userId) => {
        try {
            console.log('fetching chats');
            const response = await axios.get(`${rootURL}/getChatAll`, {
                params: {
                    user_id: userId
                }
            });
            const allChats = response.data.results;
            console.log('all chats', allChats);
            setChats(allChats);
            // setChats(testChats);
        } catch (error) {
            console.error('Error fetching invites:', error);
        }
    };

    // create a function called getChats or something here

    const sendMessage = async () => {
        // TODO: add the user's message to the messages state 
        const timestamp = new Date(); // Get the current timestamp
        const newMessage = {
            sender: username,
            message: input,
            timestamp: timestamp.toISOString() // Convert timestamp to ISO string format
        };
        console.log('adding new message', newMessage);
        setMessages([...messages, newMessage]);
        console.log('input: ', input);
        console.log('messages: ', messages);
        
        // TODO: make a call to postText route in backend
        try {
            console.log('trying post text');
            await axios.post('/postText', {
                content: input,
                chat_id: currChat.chat_id,
                timestamp: timestamp.toISOString()
                // senderId:
                // inviteeId
                // chatId:
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
        setInput('');
    }

    const inviteToChat = async () => {
        // Implement invite functionality here
        // Example:
        // await axios.post('/inviteToChat', {
        //     chatId: currChat.chat_id,
        //     userId: userId
        // });
        navigate('/' + username + '/createChat');
    }

    const leaveChat = async (chatId) => {
        try {
            // Make a request to leave the chat using the chatId
            await axios.post('/leaveChatroom', {
                user_id: userId,
                chatId: chatId // Assuming you need to send the userId as well
            });
            // Optionally, update the UI or state to reflect leaving the chat
        } catch (error) {
            console.error('Error leaving chat:', error);
        }
    }

    // accepting invite
    const handleAcceptInvite = async () => {
        try {
          // Make a request to update the confirmed status in the invites table
        //   await axios.post('/api/acceptInvite', { inviteId: 'your_invite_id' });
          // Optionally, update the UI or state to reflect the acceptance
        } catch (error) {
        //   console.error('Error accepting invite:', error);
        }
      };

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
                        onClick={inviteToChat}>Invite</button>
                    <button className='outline-none px-3 py-1 rounded-md text-bold bg-red-600 text-white'
                        onClick={() => leaveChat(currChat.chat_id)}>Leave</button>
                </div>
            </div>
                </div>
            </div>
            
        </div>
    )
}
