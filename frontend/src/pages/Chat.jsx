import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import styles from './Chat.module.css'
import api from '../axios'

export default function Chat() {
  const [chats, setChats] = useState([])
  const [showSidebar, setShowSidebar] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const activeId = location.pathname.startsWith('/chat/') ? location.pathname.split('/')[2] : null

  useEffect(() => {
    // fetch chats for logged in user
    let mounted = true
    api.get('chatv2')
      .then((res) => {
        if (!mounted) return
        const list = (res.data?.chats || []).map((c) => ({ id: c.id, title: c.title }))
        setChats(list)
      })
      .catch((err) => {
        console.error('failed to load chats', err?.response?.data || err.message)
      })

    return () => { mounted = false }
  }, [])

  // listen to global event (dispatched by ChatRoom mobile 'All' button)
  useEffect(() => {
    function onOpenChats() {
      setShowSidebar(true)
    }
    window.addEventListener('openChats', onOpenChats)
    return () => window.removeEventListener('openChats', onOpenChats)
  }, [])

  function handleNew() {
    // navigate to create chat (index of /chat)
    // mark navigation as "creating" so the auto-redirect doesn't immediately jump
    navigate('/chat', { state: { creating: true } })
  }

  function handleOpen(id) {
    localStorage.setItem('lastChat', id)
    navigate(`/chat/${id}`)
    // on mobile, hide the sidebar after choosing a chat
    setShowSidebar(false)
  }


  // if user lands on /chat (no id), try to open last active chat or first chat
  useEffect(() => {
    if (location.pathname === '/chat') {
      // Close sidebar when viewing CreateChat on mobile
      setShowSidebar(false)

      // if navigation included a creating flag, do not auto-redirect to an existing chat
      const creating = location.state && location.state.creating
      if (creating) return

      const last = localStorage.getItem('lastChat')
      if (last && chats.find((c) => c.id === last)) {
        navigate(`/chat/${last}`)
      } else if (chats.length > 0) {
        // open first chat by default
        navigate(`/chat/${chats[0].id}`)
      }
    }
  }, [location.pathname, location.state, chats, navigate])

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${showSidebar ? styles.sidebarOpen : ''}`}>
        <div className={styles.header}>
          <h3>Your Chats</h3>
          <div className={styles.headerActions}>
            <button className={styles.newBtn} onClick={handleNew}>+ New</button>
            <button className={styles.toggleBtn} onClick={() => setShowSidebar((s) => !s)}>Chats </button>
          </div>
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
            </li>
          ))}
        </ul>
      </aside>
      
      <main className={styles.content}>
        <Outlet context={{ chats, setChats }} />
      </main>
    </div>
  )
}
