import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import ChatRoom from './pages/ChatRoom'

const App = () => {
  return (
    <BrowserRouter>
      <main style={{ padding: 0 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/chat" element={<Chat />}>
            <Route index element={<ChatRoom isNew={true} />} />
            <Route path=":chatId" element={<ChatRoom />} />
          </Route>

          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
