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

      // store locally for sidebar
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
      <h2>Create Chat</h2>
      <p className={styles.msg}>{msg}</p>

      <form onSubmit={handleCreate} className={styles.form}>
        <input
          type="text"
          placeholder="Chat title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={styles.input}
        />

        <button type="submit" className={styles.btn}>Create</button>
      </form>
    </div>
  )
}
