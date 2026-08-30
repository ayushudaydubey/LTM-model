import { useEffect, useState, useRef } from 'react'
import { useParams, useOutletContext, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { 
  Bot, 
  Send, 
  Sparkles, 
  Menu, 
  Copy, 
  Check, 
  Plus, 
  Lightbulb, 
  Code2, 
  Brain, 
  Compass
} from 'lucide-react'
import styles from './ChatRoom.module.css'
import api, { getSocketUrl } from '../api/axios'

// Helper to derive smart subject title from first prompt
function generateChatTitle(prompt) {
  if (!prompt) return 'New Chat'
  let clean = prompt.replace(/^[\s\n\r\t]+/, '').replace(/^(\/|#|\*|>)/, '').trim()
  clean = clean.replace(/^(hey|hi|hello|please|can you|could you|help me with|tell me about|what is|how to)\s+/i, '')
  if (!clean) clean = prompt.trim()
  clean = clean.charAt(0).toUpperCase() + clean.slice(1)
  if (clean.length > 35) {
    clean = clean.slice(0, 32).trim() + '...'
  }
  return clean || 'New Chat'
}

export default function ChatRoom({ isNew = false }) {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const outlet = useOutletContext() || {}
  const { chats = [], setChats } = outlet

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [currentTitle, setCurrentTitle] = useState('New Chat')

  const socketRef = useRef(null)
  const messagesRef = useRef(null)
  const isCreatingChatRef = useRef(false)

  const currentChatId = !isNew && chatId ? chatId : null

  // Socket Connection setup
  useEffect(() => {
    const socketUrl = getSocketUrl()
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ['polling', 'websocket']
    })
    socketRef.current = socket

    socket.on('ai-response', (data) => {
      if (!currentChatId || data.chat === currentChatId) {
        setIsTyping(false)
        setMessages((prev) => [...prev, { role: 'ai', text: data.content }])
      }
    })

    socket.on('chat-updated', (data) => {
      if (data?.chatId && data?.title) {
        setCurrentTitle(data.title)
        setChats?.((prev) =>
          prev.map((c) => (c.id === data.chatId ? { ...c, title: data.title } : c))
        )
      }
    })

    socket.on('connect_error', (err) => {
      console.warn('Socket connect notice:', err.message)
    })

    return () => {
      socket.disconnect()
    }
  }, [currentChatId, setChats])

  // Load messages when chatId changes
  useEffect(() => {
    if (!currentChatId) {
      setMessages([])
      setCurrentTitle('New Chat')
      return
    }

    let mounted = true
    try {
      localStorage.setItem('lastChat', currentChatId)
    } catch {
      /* ignore */
    }

    api.get(`chatv2/${currentChatId}/messages`)
      .then((res) => {
        if (!mounted) return
        setMessages(res.data?.messages || [])
        if (res.data?.chat?.title) {
          setCurrentTitle(res.data.chat.title)
        } else {
          const match = (chats || []).find((c) => c.id === currentChatId)
          if (match?.title) setCurrentTitle(match.title)
        }
      })
      .catch((err) => {
        console.error('Failed to load chat messages:', err?.response?.data || err.message)
      })

    return () => {
      mounted = false
    }
  }, [currentChatId, chats])

  // Auto scroll messages to bottom
  useEffect(() => {
    const el = messagesRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, isTyping])

  // Copy message text
  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1800)
  }

  // Send message
  const handleSendMessage = async (customText = null) => {
    const textToSend = typeof customText === 'string' ? customText : input
    const trimmed = textToSend.trim()
    if (!trimmed || isTyping) return

    setInput('')

    // 1. If we are already in an existing chat
    if (currentChatId) {
      setMessages((prev) => [...prev, { role: 'user', text: trimmed }])
      setIsTyping(true)
      socketRef.current?.emit('ai-message', {
        chat: currentChatId,
        content: trimmed
      })
      return
    }

    // 2. If this is a NEW CHAT, auto-create chat in backend and immediately route
    if (isCreatingChatRef.current) return
    isCreatingChatRef.current = true

    try {
      const autoTitle = generateChatTitle(trimmed)
      const res = await api.post('chatv2', { title: autoTitle })
      const newId = res.data?.chat?._id || res.data?.chat?.id

      if (newId) {
        // Optimistically add to chats list
        const newChatItem = {
          id: newId,
          title: autoTitle,
          isPinned: false,
          lastActivity: new Date()
        }
        setChats?.((prev) => [newChatItem, ...(prev || [])])

        // Add user message to UI
        setMessages([{ role: 'user', text: trimmed }])
        setIsTyping(true)

        // Send to socket with new chat id
        socketRef.current?.emit('ai-message', {
          chat: newId,
          content: trimmed
        })

        // Route to the new chat room
        navigate(`/chat/${newId}`, { replace: true })
      }
    } catch (err) {
      console.error('Failed to auto-create chat:', err)
      // Fallback: show error message
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Sorry, could not connect to server. Please check your connection.' }
      ])
    } finally {
      isCreatingChatRef.current = false
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleOpenMobileSidebar = () => {
    window.dispatchEvent(new Event('openChats'))
  }

  // Quick Prompt Starters for New Chat
  const promptStarters = [
    {
      icon: <Brain size={18} className={styles.starterIcon} />,
      title: 'Explain a Concept',
      prompt: 'Explain how neural networks and long-term memory work in simple terms.'
    },
    {
      icon: <Code2 size={18} className={styles.starterIcon} />,
      title: 'Write & Debug Code',
      prompt: 'Write a clean React custom hook for handling API calls with caching.'
    },
    {
      icon: <Sparkles size={18} className={styles.starterIcon} />,
      title: 'Brainstorm Ideas',
      prompt: 'Give me 5 creative ideas for an AI-powered SaaS product in 2026.'
    },
    {
      icon: <Compass size={18} className={styles.starterIcon} />,
      title: 'Plan & Optimize',
      prompt: 'Help me plan a step-by-step roadmap to learn full-stack web development.'
    }
  ]

  return (
    <div className={styles.chatRoom}>
      {/* Top Header Bar */}
      <header className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <button
            className={styles.menuBtn}
            onClick={handleOpenMobileSidebar}
            title="Open chats"
          >
            <Menu size={20} />
          </button>
          <div className={styles.chatTitleWrap}>
            <span className={styles.chatStatusDot} />
            <h2 className={styles.chatTitleText}>{currentTitle}</h2>
          </div>
        </div>

        <div className={styles.headerRight}>
          <button
            onClick={() => navigate('/chat')}
            className={styles.newChatHeaderBtn}
            title="Start new conversation"
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>
      </header>

      {/* Messages Container / Welcome View */}
      <div className={styles.messagesContainer} ref={messagesRef}>
        {!currentChatId && messages.length === 0 ? (
          /* Empty New Chat Hero View */
          <div className={styles.welcomeHero}>
            <div className={styles.heroLogoWrap}>
              <div className={styles.heroLogoGlow}>
                <Bot size={36} className={styles.heroBotIcon} />
              </div>
            </div>

            <h1 className={styles.heroTitle}>
              How can <span className={styles.heroGradient}>Lilly AI</span> assist you today?
            </h1>
            <p className={styles.heroSubtitle}>
              Ask anything, generate code, explore ideas, or start a new task.
            </p>

            {/* Quick Starters Grid */}
            <div className={styles.startersGrid}>
              {promptStarters.map((item, idx) => (
                <button
                  key={idx}
                  className={styles.starterCard}
                  onClick={() => handleSendMessage(item.prompt)}
                >
                  <div className={styles.starterHeader}>
                    {item.icon}
                    <span className={styles.starterTitle}>{item.title}</span>
                  </div>
                  <p className={styles.starterText}>{item.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Active Chat Messages */
          <div className={styles.messageList}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`${styles.messageRow} ${
                  m.role === 'ai' ? styles.aiRow : styles.userRow
                }`}
              >
                {m.role === 'ai' && (
                  <div className={styles.aiAvatar}>
                    <Bot size={18} />
                  </div>
                )}

                <div className={styles.bubbleWrapper}>
                  <div
                    className={`${styles.bubble} ${
                      m.role === 'ai' ? styles.aiBubble : styles.userBubble
                    }`}
                  >
                    <div className={styles.bubbleHeader}>
                      {m.role === 'ai' ? 'Lilly AI' : 'You'}
                    </div>
                    <div className={styles.bubbleContent}>{m.text}</div>
                  </div>

                  {m.role === 'ai' && (
                    <div className={styles.messageActions}>
                      <button
                        className={styles.copyBtn}
                        onClick={() => handleCopy(m.text, i)}
                        title="Copy text"
                      >
                        {copiedIndex === i ? (
                          <>
                            <Check size={13} className={styles.copiedIcon} />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className={`${styles.messageRow} ${styles.aiRow}`}>
                <div className={styles.aiAvatar}>
                  <Bot size={18} />
                </div>
                <div className={`${styles.bubble} ${styles.aiBubble} ${styles.typingBubble}`}>
                  <div className={styles.typingWave}>
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                  </div>
                  <span className={styles.typingLabel}>Lilly is thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Composer Bar */}
      <div className={styles.composerWrapper}>
        <div className={styles.composerBox}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Lilly AI... (Press Enter to send)"
            rows={1}
            className={styles.textarea}
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isTyping}
            className={styles.sendBtn}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>

        <div className={styles.composerFootnote}>
          <span>Lilly AI can make mistakes. Verify important information.</span>
        </div>
      </div>
    </div>
  )
}
