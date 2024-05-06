import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Friends from "./pages/Friends";
import ChatInterface from "./pages/ChatInterface";
import HomePage from "./pages/HomePage";
import CreateChat from "./pages/CreateChat";
import InviteFriend from "./pages/InviteFriend";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path='/register' element={<Signup />} />
        <Route path='/:username/home' element={<Home />} />
        <Route path='/:username/friends' element={<Friends />} />
        <Route path="/:username/chat" element={<ChatInterface />} />
        <Route path="/:username/createChat" element={<CreateChat />} />
        <Route path="/:username/createChat/:chat_id/inviteFriend" element={<InviteFriend />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
