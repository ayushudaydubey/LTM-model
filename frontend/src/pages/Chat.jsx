import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import styles from './Chat.module.css'

function loadChats() {
  try {
    const raw = localStorage.getItem('chats')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveChats(chats) {
  localStorage.setItem('chats', JSON.stringify(chats))
}

export default function Chat() {
  const [chats, setChats] = useState(() => loadChats())
  const navigate = useNavigate()
  const location = useLocation()

  const activeId = location.pathname.startsWith('/chat/') ? location.pathname.split('/')[2] : null

  useEffect(() => {
    // keep chats in sync if other tab modified them
    function onStorage(e) {
      if (e.key === 'chats') setChats(loadChats())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function handleNew() {
    // navigate to create chat (index of /chat)
    navigate('/chat')
  }

  function handleOpen(id) {
    localStorage.setItem('lastChat', id)
    navigate(`/chat/${id}`)
  }

  function handleDelete(id) {
    const next = chats.filter((c) => c.id !== id)
    setChats(next)
    saveChats(next)
    // if currently viewing this chat, navigate to /chat
    const last = localStorage.getItem('lastChat')
    if (last === id) localStorage.removeItem('lastChat')
    if (location.pathname === `/chat/${id}`) navigate('/chat')
  }

  // if user lands on /chat (no id), try to open last active chat or first chat
  useEffect(() => {
    if (location.pathname === '/chat') {
      const last = localStorage.getItem('lastChat')
      if (last && chats.find((c) => c.id === last)) {
        navigate(`/chat/${last}`)
      } else if (chats.length > 0) {
        // open first chat by default
        navigate(`/chat/${chats[0].id}`)
      }
    }
  }, [location.pathname, chats, navigate])

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.header}>
          <h3>Your Chats</h3>
          <button className={styles.newBtn} onClick={handleNew}>+ New</button>
        </div>

        <ul className={styles.list}>
          {chats.length === 0 && <li className={styles.empty}>No chats yet — create one.</li>}
          {chats.map((c) => (
            <li key={c.id} className={styles.item}>
              <button
                className={activeId === c.id ? `${styles.open} ${styles.openActive}` : styles.open}
                onClick={() => handleOpen(c.id)}
              >
                {c.title || 'Untitled'}
              </button>
              <button className={styles.delete} onClick={() => handleDelete(c.id)}>✕</button>
            </li>
          ))}
        </ul>
      </aside>

      <main className={styles.content}>
        <Outlet context={{ chats, setChats, saveChats }} />
      </main>
    </div>
  )
}
