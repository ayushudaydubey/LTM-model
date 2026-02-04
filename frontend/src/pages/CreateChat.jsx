import { useState } from 'react'
import api from '../api/axios'
import { useNavigate, useOutletContext } from 'react-router-dom'
import styles from './CreateChat.module.css'

export default function CreateChat() {
  const [title, setTitle] = useState('')
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()
  const outlet = useOutletContext() || {}
  const { chats = [], setChats, saveChats } = outlet

  const handleCreate = async (e) => {
    e.preventDefault()
    setMsg('')

    try {
      const res = await api.post('chat', { title })
      const id = res.data.chat._id

      const newChat = { id, title }
      const next = [...(chats || []), newChat]
      setChats?.(next)
      saveChats?.(next)

      setMsg('Chat created')
      navigate(`/chat/${id}`)
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error')
    }
  }

  return (
    <div className={styles.container}>
      {/* Title */}
      <h2>Start a New Chat</h2>

      {/* Intro text */}
      <p style={{ fontSize: '0.85rem', color: '#9aa0ab', fontWeight:"400", marginBottom: '14px' }}>
        Create a dedicated conversation space with <strong>Lilly AI</strong>.
        Give your chat a meaningful title so Lilly can assist you better with
        context, memory, and focus.
      </p>

      {/* Message */}
      <p className={styles.msg}>{msg}</p>

      {/* Form */}
      <form onSubmit={handleCreate} className={styles.form}>
        <input
          type="text"
          placeholder="e.g. Daily Planning, Project Ideas, Study Help"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={styles.input}
        />

        <button type="submit" className={styles.btn}>
          Create Chat
        </button>
      </form>

      {/* Helper / footer text */}
      <p
        style={{
          marginTop: '18px',
          fontSize: '0.8rem',
          color: '#9aa0ab',
          lineHeight: '1.5'
        }}
      >
        💡 <strong>Tip:</strong> Clear chat titles help Lilly remember the purpose
        of the conversation and provide more accurate, personalized responses
        using STM and LTM.
      </p>
    </div>
  )
}
