import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'


import CreateChat from './pages/CreateChat'
import ChatRoom from './pages/ChatRoom'

const App = () => {
  return (
    <BrowserRouter>
      {/* <header style={{ padding: 16, borderBottom: '1px solid #eee' }}>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </nav>
      </header> */}

      <main style={{ padding: 0 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/chat/*"
            element={
          
                <Chat />
             
            }
          >
            <Route index element={<CreateChat />} />
            <Route path=":chatId" element={<ChatRoom />} />
          </Route>

          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
