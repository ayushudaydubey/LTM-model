import { useEffect, useState, useRef } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { io } from 'socket.io-client'
import styles from './ChatRoom.module.css'

export default function ChatRoom() {
  const { chatId } = useParams()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const socketRef = useRef(null)
  const outlet = useOutletContext() || {}
  const { chats = [], setChats, saveChats } = outlet

  useEffect(() => {
    // load persisted messages for this chat
    try {
      const raw = localStorage.getItem(`messages_${chatId}`)
      if (raw) setMessages(JSON.parse(raw))
    } catch {
      /* ignore parse errors */
    }

    // remember last-opened chat so refresh restores it
    try { if (chatId) localStorage.setItem('lastChat', chatId) } catch {}

    // connect socket with cookie token, prefer polling
    const socket = io('http://localhost:3000', { withCredentials: true, transports: ['polling', 'websocket'] })
    socketRef.current = socket

    // register chat in local store if missing
    if (chatId && (!chats || !chats.find((c) => c.id === chatId))) {
      const title = 'Chat ' + (chats?.length + 1 || 1)
      const next = [...(chats || []), { id: chatId, title }]
      setChats?.(next)
      saveChats?.(next)
    }

    socket.on('ai-response', (data) => {
      if (data.chat === chatId) {
        setMessages((prev) => {
          const next = [...prev, { role: 'ai', text: data.content }]
          try { localStorage.setItem(`messages_${chatId}`, JSON.stringify(next)) } catch { /* ignore */ }
          return next
        })
      }
    })

    socket.on('connect_error', (err) => {
      console.error('socket connect error', err.message)
    })

    return () => socket.disconnect()
  }, [chatId, chats, setChats, saveChats])

  // auto-scroll messages to bottom whenever they change
  const messagesRef = useRef(null)
  useEffect(() => {
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const sendMessage = () => {
    const text = input.trim()
    if (!text || !socketRef.current) return
    setMessages((prev) => {
      const next = [...prev, { role: 'user', text }]
      try { localStorage.setItem(`messages_${chatId}`, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })

    socketRef.current.emit('ai-message', { chat: chatId, content: text })
    setInput('')
  }

  // persist messages on change (in case other code modifies them)
  useEffect(() => {
    try { localStorage.setItem(`messages_${chatId}`, JSON.stringify(messages)) } catch { /* ignore */ }
  }, [messages, chatId])

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Chat</h2>

      <div className={styles.messages} ref={messagesRef}>
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'ai' ? styles.ai : styles.user}>
            <b>{m.role}</b>: {m.text}
          </div>
        ))}
      </div>

      <div className={styles.inputArea}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
          className={styles.input}
        />

        <button onClick={sendMessage} className={styles.sendBtn}>Send</button>
      </div>
    </div>
  )
}
