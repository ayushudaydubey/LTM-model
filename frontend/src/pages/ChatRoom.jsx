import { useEffect, useState, useRef } from 'react'
import { useParams, useOutletContext, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import styles from './ChatRoom.module.css'
import api from '../axios'

export default function ChatRoom() {
  const { chatId } = useParams()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const socketRef = useRef(null)
  const messagesRef = useRef(null)
  const outlet = useOutletContext() || {}
  const { chats = [], setChats } = outlet
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    if (chatId) {
      api.get(`chatv2/${chatId}/messages`)
        .then((res) => {
          if (!mounted) return
          setMessages(res.data?.messages || [])
        })
        .catch((err) => {
          console.error(err?.response?.data || err.message)
        })
    }

    try { if (chatId) localStorage.setItem('lastChat', chatId) } catch { /* ignore */ }

    const socket = io('http://localhost:3000', { withCredentials: true, transports: ['polling', 'websocket'] })
    socketRef.current = socket

    if (chatId && (!chats || !chats.find((c) => c.id === chatId))) {
      const title = 'Chat ' + (chats?.length + 1 || 1)
      const next = [...(chats || []), { id: chatId, title }]
      setChats?.(next)
    }

    socket.on('ai-response', (data) => {
      if (data.chat === chatId) {
        setIsTyping(false)
        setMessages((prev) => [...prev, { role: 'ai', text: data.content }])
      }
    })

    socket.on('connect_error', (err) => {
      console.error(err.message)
    })

    return () => {
      mounted = false
      socket.disconnect()
    }
  }, [chatId, chats, setChats])

  useEffect(() => {
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])


  // mobile: pull-down on messages list (when at top) to create new chat
  useEffect(() => {
    const el = messagesRef.current
    if (!el) return

    let startY = 0
    let startX = 0
    let moved = false

    function onTouchStart(e) {
      if (e.touches && e.touches.length === 1) {
        startY = e.touches[0].clientY
        startX = e.touches[0].clientX
        moved = false
      }
    }

    function onTouchMove() {
      moved = true
    }

    function onTouchEnd(e) {
      if (!moved) return
      const endY = (e.changedTouches && e.changedTouches[0].clientY) || startY
      const endX = (e.changedTouches && e.changedTouches[0].clientX) || startX
      const deltaY = endY - startY
      const deltaX = Math.abs(endX - startX)

      // require a downward pull and mostly vertical movement, and only when scrolled to top
      if (deltaY > 120 && deltaX < 80 && el.scrollTop <= 0) {
        navigate('/chat', { state: { creating: true } })
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [navigate])

  const sendMessage = () => {
    const text = input.trim()
    if (!text || !socketRef.current) return

    setMessages((prev) => [...prev, { role: 'user', text }])
    setIsTyping(true)
    socketRef.current.emit('ai-message', { chat: chatId, content: text })
    setInput('')
  }

  const handleOpenSidebar = () => {
    window.dispatchEvent(new Event('openChats'))
  }

  return (
    <div className={styles.container}>
      <div className={styles.titleBar}>
        <button className={styles.menuBtn} onClick={handleOpenSidebar} title="Open chats">
          ☰
        </button>
        <h2 className={styles.title}>Chat with Lylli 🤖</h2>
      </div>

      <div className={styles.messages} ref={messagesRef}>
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'ai' ? styles.ai : styles.user}>
            <div className={styles.meta}><b>{m.role === 'ai' ? 'Lylii' : 'You'}</b></div>
            <div className={styles.messageText}>{m.text}</div>
          </div>
        ))}

        {isTyping && (
          <div className={styles.typing}>
            <div className={styles.meta}><b>Lylii</b></div>
            <div className={styles.typingText}>Lylii is typing<span className={styles.dots}>...</span></div>
          </div>
        )}
      </div>

      <div className={styles.inputArea}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
          className={styles.input}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className={styles.sendBtn}>Send</button>
      </div>
    </div>
  )
}
