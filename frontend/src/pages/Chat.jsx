import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { 
  Bot, 
  Plus, 
  Pin, 
  PinOff, 
  Pencil, 
  Check, 
  X, 
  Trash2, 
  Search, 
  MessageSquare, 
  Home
} from 'lucide-react'
import styles from './Chat.module.css'
import api from '../api/axios'

export default function Chat() {
  const [chats, setChats] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [editingChatId, setEditingChatId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null
    } catch {
      return null
    }
  })
  
  const navigate = useNavigate()
  const location = useLocation()
  const activeId = location.pathname.startsWith('/chat/') ? location.pathname.split('/')[2] : null

  // Fetch current user and chats from API
  const fetchChats = async () => {
    try {
      const res = await api.get('chatv2')
      const list = (res.data?.chats || []).map((c) => ({
        id: c.id,
        title: c.title || 'Untitled Chat',
        isPinned: !!c.isPinned,
        lastActivity: c.lastActivity,
        preview: c.preview
      }))
      setChats(list)
    } catch (err) {
      console.error('Failed to load chats:', err?.response?.data || err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchUser = async () => {
    try {
      const res = await api.get('auth/me')
      if (res.data?.user) {
        setCurrentUser(res.data.user)
        localStorage.setItem('user', JSON.stringify(res.data.user))
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchChats()
    fetchUser()
  }, [])

  // Listen to openChats mobile custom event
  useEffect(() => {
    const onOpenChats = () => setShowSidebar(true)
    window.addEventListener('openChats', onOpenChats)
    return () => window.removeEventListener('openChats', onOpenChats)
  }, [])

  // Handle New Chat button click
  const handleNewChat = () => {
    navigate('/chat', { state: { isNew: true } })
    setShowSidebar(false)
  }

  // Handle open specific chat
  const handleOpenChat = (id) => {
    localStorage.setItem('lastChat', id)
    navigate(`/chat/${id}`)
    setShowSidebar(false)
  }

  // Start inline rename
  const handleStartRename = (e, chat) => {
    e.stopPropagation()
    setEditingChatId(chat.id)
    setEditTitle(chat.title)
  }

  // Save renamed title
  const handleSaveRename = async (e, chatId) => {
    e.stopPropagation()
    if (!editTitle.trim()) {
      setEditingChatId(null)
      return
    }

    try {
      await api.put(`chatv2/${chatId}/rename`, { title: editTitle.trim() })
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, title: editTitle.trim() } : c))
      )
    } catch (err) {
      console.error('Failed to rename chat:', err)
    } finally {
      setEditingChatId(null)
    }
  }

  // Cancel rename
  const handleCancelRename = (e) => {
    e.stopPropagation()
    setEditingChatId(null)
    setEditTitle('')
  }

  // Toggle Pin/Unpin
  const handleTogglePin = async (e, chat) => {
    e.stopPropagation()
    const nextPinned = !chat.isPinned
    try {
      await api.put(`chatv2/${chat.id}/pin`, { isPinned: nextPinned })
      setChats((prev) => {
        const updated = prev.map((c) => (c.id === chat.id ? { ...c, isPinned: nextPinned } : c))
        return [...updated].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
      })
    } catch (err) {
      console.error('Failed to toggle pin:', err)
    }
  }

  // Delete chat
  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation()
    if (!window.confirm('Delete this conversation?')) return

    try {
      await api.delete(`chatv2/${chatId}`)
      setChats((prev) => prev.filter((c) => c.id !== chatId))
      if (activeId === chatId) {
        navigate('/chat')
      }
    } catch (err) {
      console.error('Failed to delete chat:', err)
    }
  }

  // Handle Logout
  const handleLogout = async () => {
    try {
      await api.post('auth/logout')
    } catch {
      // ignore
    }
    localStorage.removeItem('user')
    navigate('/login')
  }

  // Get user display name and initials
  const getDisplayName = () => {
    if (currentUser?.fullName?.firstName) {
      const first = currentUser.fullName.firstName
      const last = currentUser.fullName.lastName || ''
      return `${first} ${last}`.trim()
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0]
    }
    return 'Active User'
  }

  const getInitials = () => {
    if (currentUser?.fullName?.firstName) {
      const f = currentUser.fullName.firstName[0] || ''
      const l = currentUser.fullName.lastName?.[0] || ''
      return (f + l).toUpperCase() || 'U'
    }
    if (currentUser?.email) {
      return currentUser.email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  // Filtered chats based on search query
  const filteredChats = chats.filter((c) =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pinnedChats = filteredChats.filter((c) => c.isPinned)
  const otherChats = filteredChats.filter((c) => !c.isPinned)

  return (
    <div className={styles.layout}>
      {/* Mobile Backdrop */}
      {showSidebar && (
        <div 
          className={styles.backdrop} 
          onClick={() => setShowSidebar(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${showSidebar ? styles.sidebarOpen : ''}`}>
        {/* Brand Header */}
        <div className={styles.sidebarHeader}>
          <Link to="/" className={styles.brand}>
            <div className={styles.brandIconWrap}>
              <Bot size={20} className={styles.brandIcon} />
            </div>
            <span className={styles.brandName}>Lilly AI</span>
          </Link>

          <button 
            className={styles.closeMobileBtn} 
            onClick={() => setShowSidebar(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className={styles.actionSection}>
          <button className={styles.newChatBtn} onClick={handleNewChat}>
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        {chats.length > 3 && (
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        )}

        {/* Chats List */}
        <div className={styles.chatListScroll}>
          {loading ? (
            <div className={styles.loadingList}>Loading conversations...</div>
          ) : chats.length === 0 ? (
            <div className={styles.emptyState}>
              <MessageSquare size={24} className={styles.emptyIcon} />
              <p>No chats yet</p>
              <span>Start chatting to create your first session</span>
            </div>
          ) : (
            <>
              {/* PINNED CHATS */}
              {pinnedChats.length > 0 && (
                <div className={styles.sectionGroup}>
                  <div className={styles.sectionLabel}>
                    <Pin size={12} />
                    <span>PINNED</span>
                  </div>

                  <ul className={styles.chatList}>
                    {pinnedChats.map((chat) => (
                      <li
                        key={chat.id}
                        className={`${styles.chatItem} ${activeId === chat.id ? styles.itemActive : ''}`}
                        onClick={() => handleOpenChat(chat.id)}
                      >
                        {editingChatId === chat.id ? (
                          <div className={styles.editRow} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(e, chat.id)
                                if (e.key === 'Escape') handleCancelRename(e)
                              }}
                              autoFocus
                              className={styles.editInput}
                            />
                            <button
                              onClick={(e) => handleSaveRename(e, chat.id)}
                              className={styles.editActionBtn}
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={handleCancelRename}
                              className={styles.editActionBtn}
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className={styles.chatInfo}>
                              <Pin size={14} className={styles.pinnedIconActive} />
                              <span className={styles.chatTitle}>{chat.title}</span>
                            </div>

                            <div className={styles.itemActions}>
                              <button
                                onClick={(e) => handleTogglePin(e, chat)}
                                className={styles.actionBtn}
                                title="Unpin"
                              >
                                <PinOff size={14} />
                              </button>
                              <button
                                onClick={(e) => handleStartRename(e, chat)}
                                className={styles.actionBtn}
                                title="Rename"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteChat(e, chat.id)}
                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* RECENT CHATS */}
              <div className={styles.sectionGroup}>
                {pinnedChats.length > 0 && otherChats.length > 0 && (
                  <div className={styles.sectionLabel}>
                    <MessageSquare size={12} />
                    <span>RECENT CHATS</span>
                  </div>
                )}

                <ul className={styles.chatList}>
                  {otherChats.map((chat) => (
                    <li
                      key={chat.id}
                      className={`${styles.chatItem} ${activeId === chat.id ? styles.itemActive : ''}`}
                      onClick={() => handleOpenChat(chat.id)}
                    >
                      {editingChatId === chat.id ? (
                        <div className={styles.editRow} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(e, chat.id)
                              if (e.key === 'Escape') handleCancelRename(e)
                            }}
                            autoFocus
                            className={styles.editInput}
                          />
                          <button
                            onClick={(e) => handleSaveRename(e, chat.id)}
                            className={styles.editActionBtn}
                            title="Save"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className={styles.editActionBtn}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className={styles.chatInfo}>
                            <MessageSquare size={14} className={styles.chatIcon} />
                            <span className={styles.chatTitle}>{chat.title}</span>
                          </div>

                          <div className={styles.itemActions}>
                            <button
                              onClick={(e) => handleTogglePin(e, chat)}
                              className={styles.actionBtn}
                              title="Pin to top"
                            >
                              <Pin size={14} />
                            </button>
                            <button
                              onClick={(e) => handleStartRename(e, chat)}
                              className={styles.actionBtn}
                              title="Rename"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteChat(e, chat.id)}
                              className={`${styles.actionBtn} ${styles.deleteBtn}`}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* User Profile & Footer Section */}
        <div className={styles.userProfileFooter}>
          <div className={styles.userInfoWrap}>
            <div className={styles.userAvatar}>
              <span>{getInitials()}</span>
            </div>
            <div className={styles.userMeta}>
              <span className={styles.userName}>{getDisplayName()}</span>
              <span className={styles.userStatusText}>Online</span>
            </div>
          </div>

          <div className={styles.userFooterActions}>
            <Link to="/" className={styles.footerActionBtn} title="Return to Home">
              <Home size={15} />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <Outlet context={{ chats, setChats, fetchChats, handleNewChat }} />
      </main>
    </div>
  )
}
