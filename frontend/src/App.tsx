import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Friends from "./pages/Friends";
import ChatInterface from "./pages/ChatInterface";
import HomePage from "./pages/HomePage";
<<<<<<< HEAD
import CreateChat from "./pages/CreateChat";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";

=======
import Feed from "./pages/Feed";
import CreatePost from "./pages/CreatePost";
import SetupProfile from "./pages/SetupProfile";
>>>>>>> main


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
<<<<<<< HEAD
        <Route path="/:username/createChat" element={<CreateChat />} />
=======
        <Route path="/:username/feed" element={<Feed />} />
        <Route path="/:username/createPost" element={<CreatePost />} />
>>>>>>> main
      </Routes>
    </BrowserRouter>
  )
}

export default App
