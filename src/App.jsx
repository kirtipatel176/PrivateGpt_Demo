import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Plus, MessageSquare, Menu, LogOut, Trash2, User, Upload, Database, Loader2, Sun, Moon, ArrowUp } from 'lucide-react'
import AuthPage from './AuthPage'

// Use Vite env vars so production can point to real APIs. Falls back to localhost for local dev.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const AUTH_API = import.meta.env.VITE_AUTH_API || 'http://localhost:8001'

// No mock responses are embedded in this file. Any dev-only bypass is implemented
// in `AuthPage.jsx` (guarded by `import.meta.env.DEV && VITE_USE_DEV_BYPASS`) so
// production builds remain clean.

/* ─── Agentic step definitions ─── */
const STEPS = [
  { id: 'understand', label: 'Understanding your question', icon: '🔍' },
  { id: 'route', label: 'Routing to the right tool', icon: '🔀' },
  { id: 'tool', label: 'Tool selected', icon: '⚙️' },
  { id: 'generate', label: 'Generating answer', icon: '✨' },
]

const QUICK_PROMPTS = [
  'Summarize the last private document I uploaded',
  'Draft a short client-ready answer from this context',
  'Compare the main points in the current conversation',
  'Turn this into a clean action plan',
]

/* ─── Agentic Loader ─── */
function AgenticLoader({ activeStep, toolDisplayName, toolIcon }) {
  return (
    <div className="agentic-loader">
      {STEPS.map((step, i) => {
        const isDone = i < activeStep
        const isActive = i === activeStep

        return (
          <div
            key={step.id}
            className={`agentic-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
          >
            <div className={`step-icon ${isActive ? 'spinning' : isDone ? 'completed' : 'pending'}`}>
              {isActive ? <span className="step-spinner" /> : isDone ? '✓' : <span style={{ opacity: 0.4 }}>{step.icon}</span>}
            </div>
            <span className="step-label">
              {step.id === 'tool' && (isDone || isActive) && toolDisplayName
                ? <>Tool selected: <span className="tool-chip">{toolIcon} {toolDisplayName}</span></>
                : step.label
              }
            </span>
            {isDone && <span className="step-check">✓</span>}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Single message ─── */
function Message({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="message-group">
        <div className="message-user"><div className="message-user-bubble">{msg.content}</div></div>
      </div>
    )
  }
  return (
    <div className="message-group">
      <div className="message-ai">
        <div className="ai-avatar">🤖</div>
        <div className="ai-content">
          {msg.isLoading ? (
            <AgenticLoader activeStep={msg.activeStep} toolDisplayName={msg.toolDisplayName} toolIcon={msg.toolIcon} />
          ) : (
            <div className="ai-bubble">
              <ReactMarkdown 
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        {...props}
                        children={String(children).replace(/\n$/, '')}
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                      />
                    ) : (
                      <code {...props} className={className}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {msg.content}
              </ReactMarkdown>
              {msg.toolDisplayName && (
                <div className="used-tool-badge">{msg.toolIcon} &nbsp;<span>{msg.toolDisplayName}</span> was used</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main App ─── */
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [username, setUsername] = useState(localStorage.getItem('username'))
  const [isSuperadmin, setIsSuperadmin] = useState(localStorage.getItem('isSuperadmin') === 'true')
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'))
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const idCounterRef = useRef(1)

  const activeChat = chats.find(c => c.id === activeChatId)
  const messages = useMemo(() => activeChat?.messages || [], [activeChat])

  const nextId = useCallback((prefix) => `${prefix}_${idCounterRef.current++}`, [])

  const handleLogout = useCallback(() => {
    localStorage.clear()
    setToken(null)
    setUsername(null)
    setIsSuperadmin(false)
    setChats([])
    setActiveChatId(null)
  }, [])

  const saveConversation = useCallback(async (chatId, title, messagesToSave) => {
    try {
      await fetch(`${AUTH_API}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: chatId, title, messages: messagesToSave })
      })
    } catch (error) {
      console.error(error)
    }
  }, [token])

  const newChat = useCallback(() => {
    const id = nextId('chat')
    const newC = { id, title: 'New Chat', messages: [] }
    setChats(prev => [newC, ...prev])
    setActiveChatId(id)
    setSidebarOpen(false)
    if (token) saveConversation(id, 'New Chat', [])
  }, [nextId, saveConversation, token])

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${AUTH_API}/conversations`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setChats(data)
        if (data.length > 0) setActiveChatId(data[0].id)
        else newChat()
      } else if (res.status === 401) handleLogout()
    } catch (error) {
      console.error(error)
    }
  }, [token, newChat, handleLogout])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) fetchConversations()
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [token, fetchConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark')
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add('dark')
      setIsDarkMode(true)
    }
  }

  const deleteConversation = async (e, chatId) => {
    e.stopPropagation()
    try {
      const res = await fetch(`${AUTH_API}/conversations/${chatId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const newChats = chats.filter(c => c.id !== chatId)
        setChats(newChats)
        if (activeChatId === chatId) {
          if (newChats.length > 0) setActiveChatId(newChats[0].id)
          else newChat()
        }
      }
    } catch (error) { console.error(error) }
  }

  const handleLogin = (newToken, newUsername, superadmin) => {
    setToken(newToken)
    setUsername(newUsername)
    setIsSuperadmin(superadmin)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      if (res.ok) {
        alert('File indexed successfully for Private GPT!')
      } else {
        const data = await res.json()
        alert('Upload failed: ' + (data.detail || 'Unknown error'))
      }
    } catch (error) {
      console.error(error)
      alert('Network error during upload')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const updateMessages = useCallback((chatId, updater) => {
    setChats(prev => {
      const updated = prev.map(c => c.id === chatId ? { ...c, messages: updater(c.messages) } : c)
      const chat = updated.find(c => c.id === chatId)
      if (chat) saveConversation(chatId, chat.title, chat.messages)
      return updated
    })
  }, [saveConversation])

  const setStep = useCallback((chatId, msgId, step, extra = {}) => {
    setChats(prev => prev.map(c => c.id !== chatId ? c : {
      ...c,
      messages: c.messages.map(m => m.id !== msgId ? m : { ...m, activeStep: step, ...extra })
    }))
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const query = input.trim()
    const chatId = activeChatId
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setSidebarOpen(false)

    // Add user message
    const userMsgId = nextId('msg')
    updateMessages(chatId, msgs => [...msgs, { id: userMsgId, role: 'user', content: query }])

    // Add AI loader message (ensure ID is different)
    const aiMsgId = nextId('msg')
    updateMessages(chatId, msgs => [...msgs, { id: aiMsgId, role: 'assistant', content: '', isLoading: true, activeStep: 0 }])
    setIsLoading(true)

    const t1 = setTimeout(() => setStep(chatId, aiMsgId, 1), 600)
    const t2 = setTimeout(() => setStep(chatId, aiMsgId, 2), 1300)

    try {
      const res = await fetch(`${API_BASE}/query?query=${encodeURIComponent(query)}`, { method: 'POST' })
      const data = await res.json()

      // Clean the response to remove any echoed prompt headers or repeated questions
      const cleanResponse = (text, userQuery) => {
        if (!text) return text;
        let cleaned = text.trim();

        // Remove "Question: ...", "Answer: ...", etc. at the start
        cleaned = cleaned.replace(/^(Question|Answer|User|Assistant):\s*/gi, '');

        // If the AI repeats the exact question at the start, strip it
        const q = userQuery.toLowerCase().trim();
        if (cleaned.toLowerCase().startsWith(q)) {
          cleaned = cleaned.substring(q.length).replace(/^[?:\s\n]*/, '');
        }

        return cleaned.trim();
      };

      clearTimeout(t2)
      setStep(chatId, aiMsgId, 2, { toolDisplayName: data.tool_display_name, toolIcon: data.tool_icon })
      await new Promise(r => setTimeout(r, 500))
      setStep(chatId, aiMsgId, 3, { toolDisplayName: data.tool_display_name, toolIcon: data.tool_icon })
      await new Promise(r => setTimeout(r, 500))

      setChats(prev => {
        const updated = prev.map(c => c.id !== chatId ? c : {
          ...c,
          title: c.title === 'New Chat' ? (query.slice(0, 32) + (query.length > 32 ? '…' : '')) : c.title,
          messages: c.messages.map(m => m.id !== aiMsgId ? m : {
            ...m,
            content: cleanResponse(data.response, query),
            isLoading: false,
            toolDisplayName: data.tool_display_name,
            toolIcon: data.tool_icon,
          })
        })
        const chat = updated.find(c => c.id === chatId)
        if (chat) saveConversation(chatId, chat.title, chat.messages)
        return updated
      })
    } catch (error) {
      console.error(error)
      clearTimeout(t1); clearTimeout(t2)
      setStep(chatId, aiMsgId, 3, { content: '⚠️ API Error', isLoading: false })
    } finally { setIsLoading(false) }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  const applyPrompt = (prompt) => {
    setInput(prompt)
    window.requestAnimationFrame(() => textareaRef.current?.focus())
  }

  if (!token) return <AuthPage onLogin={handleLogin} />

  return (
    <div className="app">
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon"><span style={{ fontWeight: 800, fontSize: 15, color: '#F3E4C9', letterSpacing: '-0.5px' }}>AG</span></div>
            <div><div className="logo-text">Agentic AI</div><span className="logo-sub">Intelligent Assistant</span></div>
          </div>
          <button className="new-chat-btn" onClick={newChat}><Plus size={15} /> New conversation</button>
        </div>

        {isSuperadmin && (
          <div className="admin-panel">
            <div className="sidebar-section-label">Superadmin Panel</div>
            <button className="admin-action-btn" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? <Loader2 size={14} className="spinning" /> : <Upload size={14} />}
              {isUploading ? 'Indexing...' : 'Upload Data for Private GPT'}
            </button>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept=".pdf,.txt,.docx" />
          </div>
        )}

        <div className="sidebar-section-label">Conversations</div>
        <div className="chat-history">
          {chats.map(chat => (
            <div key={chat.id} className={`history-item ${chat.id === activeChatId ? 'active' : ''}`} onClick={() => { setActiveChatId(chat.id); setSidebarOpen(false) }}>
              <MessageSquare size={13} style={{ flexShrink: 0, opacity: 0.6 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.title}</span>
              <button className="delete-chat-btn" onClick={(e) => deleteConversation(e, chat.id)}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>

        <div className="sidebar-user-footer">
          <div className="user-info">
            <User size={16} />
            <span>{username}</span>
            {isSuperadmin && <span className="admin-badge">Admin</span>}
          </div>
          <button className="logout-btn" onClick={handleLogout}><LogOut size={16} /> Logout</button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setSidebarOpen(s => !s)}><Menu size={20} /></button>
            <div className="topbar-title-wrap">
              <div className="topbar-kicker">PrivateGPT workspace</div>
              <div className="topbar-title">{activeChat?.title || 'New Chat'}</div>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="topbar-status"><Database size={14} /> API Connected</div>
          </div>
        </div>

        <div className="messages-container">
          <div className="messages-inner">
            {messages.length === 0 ? (
              <div className="welcome">
                <div className="welcome-card">
                  <div className="welcome-badge">Gemini-style assistant experience</div>
                  <div className="welcome-hero">
                    <div className="welcome-icon">🤖</div>
                    <div>
                      <h1>PrivateGPT Assistant</h1>
                      <p>
                        A clean, premium workspace for chatting with your private knowledge base,
                        organizing follow-ups, and keeping the whole experience focused.
                      </p>
                    </div>
                  </div>
                  <div className="welcome-grid">
                    <div className="welcome-metric"><span>Secure context</span><strong>Private</strong></div>
                    <div className="welcome-metric"><span>Response mode</span><strong>Gemini-like</strong></div>
                    <div className="welcome-metric"><span>Workspace</span><strong>Chat-first</strong></div>
                  </div>
                </div>

                <div className="prompt-section">
                  <div className="prompt-section-label">Try a prompt</div>
                  <div className="prompt-grid">
                    {QUICK_PROMPTS.map(prompt => (
                      <button key={prompt} className="prompt-chip" onClick={() => applyPrompt(prompt)}>
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (messages.map(msg => <Message key={msg.id} msg={msg} />))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="input-area">
          <div className="input-inner">
            <div className="input-box">
              <textarea ref={textareaRef} className="input-textarea" placeholder="Message ChatGPT" value={input} rows={1} onChange={e => { setInput(e.target.value); if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px' } }} onKeyDown={handleKeyDown} />
              <button className="send-btn" onClick={handleSend} disabled={!input.trim() || isLoading} title="Send"><ArrowUp size={20} strokeWidth={2.5} /></button>
            </div>
            <div className="input-footer">Press <span className="kbd">Enter</span> to send &nbsp;·&nbsp; <span className="kbd">Shift+Enter</span> for newline</div>
          </div>
        </div>
      </div>
    </div>
  )
}
