import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Friends from "./pages/Friends";
import ChatInterface from "./pages/ChatInterface";
import HomePage from "./pages/HomePage";
import CreateChat from "./pages/CreateChat";
import InviteFriend from "./pages/InviteFriend";
import InviteIntoChat from "./pages/InviteIntoChat";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Feed from "./pages/Feed";
import CreatePost from "./pages/CreatePost";
import SetupProfile from "./pages/SetupProfile";
import Search from "./pages/Search";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path='/register' element={<Signup />} />
        <Route path='/:username/setupprofile' element={<SetupProfile />} />
        <Route path='/:username/home' element={<Home />} />
        <Route path="/:username/profile" element={<Profile />} />
        <Route path="/:username/editprofile" element={<EditProfile />} />
        <Route path='/:username/friends' element={<Friends />} />
        <Route path="/:username/chat" element={<ChatInterface />} />
        <Route path="/:username/createChat" element={<CreateChat />} />
        <Route path="/:username/createChat/:chat_id/inviteFriend" element={<InviteFriend />} />
        <Route path="/:username/:chatname/:chat_id/inviteIntoChat" element={<InviteIntoChat />} />
        <Route path="/:username/feed" element={<Feed />} />
        <Route path="/:username/createPost" element={<CreatePost />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
