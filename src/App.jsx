import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Plus, MessageSquare, Menu, LogOut, Trash2, User, Upload, Loader2, Sun, Moon, ArrowUp, PanelLeftClose, PanelLeft, Sparkles, Search, Settings, Home, Book } from 'lucide-react'
import AuthPage from './AuthPage'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'
import * as Tooltip from '@radix-ui/react-tooltip'
import { cn } from './lib/utils'

// Use Vite env vars so production can point to real APIs. Falls back to localhost for local dev.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const AUTH_API = import.meta.env.VITE_AUTH_API || 'http://localhost:8001'

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

/* ─── AI & User Icons ─── */
const AiIcon = () => (
  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm shrink-0">
    <Sparkles size={14} />
  </div>
)

const UserIcon = () => (
  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm shrink-0">
    <User size={14} />
  </div>
)

/* ─── Agentic Loader ─── */
function AgenticLoader({ activeStep, toolDisplayName, toolIcon }) {
  return (
    <div className="flex flex-col space-y-4 my-2 w-full max-w-sm">
      <AnimatePresence mode="popLayout">
        {STEPS.map((step, i) => {
          const isDone = i < activeStep
          const isActive = i === activeStep
          if (!isActive && !isDone && i > activeStep + 1) return null

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn(
                "flex items-center gap-3 transition-all duration-300",
                isActive ? 'text-zinc-900 dark:text-zinc-100' :
                  isDone ? 'text-zinc-500 dark:text-zinc-400' :
                    'text-zinc-300 dark:text-zinc-700'
              )}
            >
              <div className="flex items-center justify-center w-5 h-5 shrink-0">
                {isActive ? (
                  <Loader2 size={16} className="animate-spin text-indigo-500" />
                ) : isDone ? (
                  <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400">
                    <span className="text-[10px]">✓</span>
                  </div>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                )}
              </div>
              <span className={cn("text-[13px] font-medium tracking-tight", isActive ? 'animate-pulse' : '')}>
                {step.id === 'tool' && (isDone || isActive) && toolDisplayName
                  ? <span className="flex items-center gap-1.5">Using <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">{toolIcon} {toolDisplayName}</span></span>
                  : step.label
                }
              </span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

/* ─── Single message ─── */
function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-8 group`}
    >
      <div className={`flex max-w-[95%] sm:max-w-[85%] md:max-w-[75%] gap-3 md:gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {isUser ? <UserIcon /> : <AiIcon />}

        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'} max-w-full overflow-hidden mt-1`}>
          {msg.isLoading ? (
            <AgenticLoader activeStep={msg.activeStep} toolDisplayName={msg.toolDisplayName} toolIcon={msg.toolIcon} />
          ) : (
            <div className={`max-w-full overflow-x-auto ${isUser ? 'bg-white border border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-transparent dark:bg-[#2f2f2f] px-5 py-3.5 rounded-3xl rounded-tr-[4px] text-slate-800 dark:text-zinc-100' : 'text-slate-800 dark:text-[#ececec] py-1'}`}>
              {isUser ? (
                <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</div>
              ) : (
                <div className="markdown-body max-w-full">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                          <div className="rounded-xl overflow-hidden border border-slate-200/60 dark:border-[#2f2f2f] my-4 bg-[#0d0d0d] shadow-sm">
                            <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-[#2f2f2f] border-b border-slate-200/60 dark:border-[#2f2f2f] text-xs font-mono text-slate-500 dark:text-zinc-400">
                              <span>{match[1]}</span>
                            </div>
                            <SyntaxHighlighter
                              {...props}
                              children={String(children).replace(/\n$/, '')}
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                            />
                          </div>
                        ) : (
                          <code {...props} className={`${className} bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md font-mono text-xs text-indigo-600 dark:text-indigo-400`}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
              {!isUser && msg.toolDisplayName && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-5 flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 inline-flex px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm"
                >
                  <span>{msg.toolIcon}</span>
                  <span>Used <strong>{msg.toolDisplayName}</strong></span>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
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

  // Track window width for responsive sidebar
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const isMobile = windowWidth < 1024

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const loadingMsgId = useRef(null)

  const activeChat = chats.find(c => c.id === activeChatId)
  const messages = activeChat?.messages || []

  useEffect(() => {
    if (token) fetchConversations()
  }, [token])


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

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${AUTH_API}/conversations`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setChats(data)
        if (data.length > 0) setActiveChatId(data[0].id)
        else newChat()
      } else if (res.status === 401) handleLogout()
    } catch (err) { console.error(err) }
  }

  const saveConversation = async (chatId, title, messages) => {
    try {
      await fetch(`${AUTH_API}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: chatId, title, messages })
      })
    } catch (err) { console.error(err) }
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
        toast.success('Conversation deleted')
      }
    } catch (err) { console.error(err); toast.error('Failed to delete conversation') }
  }

  const handleLogin = (newToken, newUsername, superadmin) => {
    setToken(newToken)
    setUsername(newUsername)
    setIsSuperadmin(superadmin)
    toast.success(`Welcome back, ${newUsername}!`)
  }

  const handleLogout = () => {
    localStorage.clear()
    setToken(null)
    setUsername(null)
    setIsSuperadmin(false)
    setChats([])
    setActiveChatId(null)
    toast.info('Logged out successfully')
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const toastId = toast.loading(`Uploading ${file.name}...`)

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      if (res.ok) {
        toast.success('File indexed successfully for Private GPT!', { id: toastId })
      } else {
        const data = await res.json()
        toast.error('Upload failed: ' + (data.detail || 'Unknown error'), { id: toastId })
      }
    } catch (err) {
      toast.error('Network error during upload', { id: toastId })
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
  }, [token])

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
    if (isMobile) setSidebarOpen(false)

    const userMsgId = Date.now();
    updateMessages(chatId, msgs => [...msgs, { id: userMsgId, role: 'user', content: query }])

    const aiMsgId = userMsgId + 1;
    loadingMsgId.current = aiMsgId
    updateMessages(chatId, msgs => [...msgs, { id: aiMsgId, role: 'assistant', content: '', isLoading: true, activeStep: 0 }])
    setIsLoading(true)

    const t1 = setTimeout(() => setStep(chatId, aiMsgId, 1), 600)
    const t2 = setTimeout(() => setStep(chatId, aiMsgId, 2), 1300)

    try {
      const res = await fetch(`${API_BASE}/query?query=${encodeURIComponent(query)}`, { method: 'POST' })
      const data = await res.json()

      const cleanResponse = (text, userQuery) => {
        if (!text) return text;
        let cleaned = text.trim();
        cleaned = cleaned.replace(/^(Question|Answer|User|Assistant):\s*/gi, '');
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
    } catch {
      clearTimeout(t1); clearTimeout(t2)
      setStep(chatId, aiMsgId, 3, { content: '⚠️ API Error', isLoading: false })
      toast.error("Failed to generate response")
    } finally { setIsLoading(false) }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  const applyPrompt = (prompt) => {
    setInput(prompt)
    window.requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const newChat = () => {
    const id = `chat_${Date.now()}`
    const newC = { id, title: 'New Chat', messages: [] }
    setChats(prev => [newC, ...prev])
    setActiveChatId(id)
    if (isMobile) setSidebarOpen(false)
    if (token) saveConversation(id, 'New Chat', [])
  }

  if (!token) return <AuthPage onLogin={handleLogin} />

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="flex h-[100dvh] w-full bg-[#FAFAFA] dark:bg-[#171717] text-slate-900 dark:text-[#ececec] overflow-hidden font-sans transition-colors duration-300 relative">
        <Toaster theme={isDarkMode ? 'dark' : 'light'} richColors position="top-right" />

        {/* Subtle premium ambient background glows */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-400/10 dark:bg-indigo-900/10 blur-[120px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen transition-opacity duration-700" />
        <div className="absolute top-[-100px] right-1/4 w-[500px] h-[500px] bg-purple-400/10 dark:bg-purple-900/10 blur-[100px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen transition-opacity duration-700" />


        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{
            width: sidebarOpen ? (isMobile ? windowWidth * 0.8 : 280) : 0,
            opacity: sidebarOpen ? 1 : 0
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            "relative z-50 h-full bg-white/80 backdrop-blur-xl dark:bg-[#1C1C1C]/90 border-r border-slate-200/60 dark:border-white/5 flex flex-col shrink-0 overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none",
            isMobile ? "fixed left-0 top-0 bottom-0" : "relative"
          )}
        >
          <div className="w-[280px] h-full flex flex-col min-w-[280px]">
            {/* Sidebar Header */}
            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-center gap-3 px-2 pt-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm tracking-tighter shadow-sm">
                  AG
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm leading-tight text-slate-900 dark:text-white">PrivateGPT</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Enterprise Assistant</span>
                </div>
              </div>

              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Search chats..." 
                  className="w-full bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-white/5 rounded-xl pl-9 pr-4 py-2 text-[13px] text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <button
                className="flex items-center justify-between px-3 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-all duration-300 shadow-sm shadow-indigo-500/20 active:scale-[0.98]"
                onClick={newChat}
              >
                <div className="flex items-center gap-2">
                  <Plus size={16} /> New conversation
                </div>
                <div className="flex items-center justify-center px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-semibold tracking-widest">⌘K</div>
              </button>
            </div>

            {/* Main Navigation */}
            <div className="px-3 pb-2 space-y-0.5">
              <button onClick={newChat} className="w-full flex items-center gap-3 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50 rounded-xl text-[13px] font-medium transition-colors">
                <Home size={16} className="text-slate-400" />
                Home
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50 rounded-xl text-[13px] font-medium transition-colors">
                <Book size={16} className="text-slate-400" />
                Knowledge Base
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50 rounded-xl text-[13px] font-medium transition-colors">
                <Settings size={16} className="text-slate-400" />
                Settings
              </button>
            </div>

            {/* Superadmin Panel */}
            {isSuperadmin && (
              <div className="px-4 pb-4">
                <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 px-2">Admin</div>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-zinc-800/30 hover:bg-indigo-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-[#ececec] rounded-xl text-sm transition-all duration-200 font-medium border border-transparent hover:border-indigo-100 dark:hover:border-white/5 group"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <Upload size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />}
                      <span className="truncate">{isUploading ? 'Indexing...' : 'Upload Knowledge Base'}</span>
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs px-2 py-1 rounded shadow-lg" sideOffset={5}>
                      Upload files to the private vector database
                      <Tooltip.Arrow className="fill-zinc-900 dark:fill-zinc-100" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.docx" />
              </div>
            )}

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
              <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 px-3 mt-4">Recent Chats</div>
              <div className="space-y-0.5">
                <AnimatePresence>
                  {chats.length === 0 ? (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="px-3 py-4 text-center text-xs text-slate-400 dark:text-zinc-500">
                      No recent conversations
                    </motion.div>
                  ) : chats.map(chat => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        "group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all duration-200 border",
                        chat.id === activeChatId ? 'bg-indigo-50/50 dark:bg-zinc-800/80 text-indigo-900 dark:text-[#ececec] font-medium shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] dark:shadow-none border-indigo-100/50 dark:border-white/5' :
                          'text-slate-600 dark:text-[#b4b4b4] hover:bg-slate-50 dark:hover:bg-zinc-800/40 border-transparent hover:border-slate-200/50 dark:hover:border-transparent'
                      )}
                      onClick={() => { setActiveChatId(chat.id); if (isMobile) setSidebarOpen(false); }}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <MessageSquare size={16} className={`shrink-0 transition-colors ${chat.id === activeChatId ? 'text-indigo-500 dark:text-zinc-100' : 'text-slate-400 group-hover:text-slate-500'}`} />
                        <span className="truncate">{chat.title}</span>
                      </div>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <button
                            className={`shrink-0 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 ${chat.id === activeChatId ? 'opacity-100' : ''}`}
                            onClick={(e) => deleteConversation(e, chat.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs px-2 py-1 rounded shadow-lg" sideOffset={5}>
                            Delete conversation
                            <Tooltip.Arrow className="fill-zinc-900 dark:fill-zinc-100" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* User Footer */}
            <div className="p-3 bg-white/50 dark:bg-[#1C1C1C]/50 backdrop-blur-xl border-t border-slate-200/60 dark:border-white/5">
              <button className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm font-medium text-xs">
                    {username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col overflow-hidden items-start">
                    <span className="text-[13px] font-semibold truncate text-slate-900 dark:text-zinc-100 leading-tight">{username?.split('@')[0]}</span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">{isSuperadmin ? 'Admin Account' : 'Free Plan'}</span>
                  </div>
                </div>
                <div 
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
                  onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                >
                  <LogOut size={16} />
                </div>
              </button>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-transparent relative">

          {/* Topbar */}
          <header className="shrink-0 h-14 flex items-center justify-between px-3 md:px-4 z-20">
            <div className="flex items-center gap-2 pointer-events-auto">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-zinc-800/50 backdrop-blur-md transition-all duration-200 active:scale-95"
                  >
                    {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs px-2 py-1 rounded shadow-lg" sideOffset={5}>
                    Toggle sidebar
                    <Tooltip.Arrow className="fill-zinc-900 dark:fill-zinc-100" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              {!sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-semibold text-sm text-slate-900 dark:text-[#ececec] tracking-tight ml-2"
                >
                  PrivateGPT
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-zinc-400 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-slate-200/60 dark:border-zinc-800/50 px-3 py-1.5 rounded-full shadow-sm cursor-default hover:shadow-md transition-shadow">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                    Connected
                  </div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs px-2 py-1 rounded shadow-lg" sideOffset={5}>
                    Backend server is reachable
                    <Tooltip.Arrow className="fill-zinc-900 dark:fill-zinc-100" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-800/50 backdrop-blur-md rounded-xl transition-all duration-200 shadow-sm bg-transparent active:scale-95"
                    onClick={toggleTheme}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={isDarkMode ? 'dark' : 'light'}
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                      </motion.div>
                    </AnimatePresence>
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs px-2 py-1 rounded shadow-lg" sideOffset={5}>
                    Toggle theme
                    <Tooltip.Arrow className="fill-zinc-900 dark:fill-zinc-100" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scroll-smooth pt-4 pb-40" id="scroll-container">
            <div className="max-w-3xl mx-auto w-full px-4">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                    className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20"
                  >
                    <Sparkles size={32} className="text-white" />
                  </motion.div>
                  <h1 className="text-3xl font-bold tracking-tight mb-3 text-slate-900 dark:text-zinc-50">Good morning, {username?.split('@')[0] || 'User'}</h1>
                  <p className="text-[15px] text-slate-500 dark:text-zinc-400 max-w-md mb-8 leading-relaxed">
                    Ask me anything about your private knowledge base, or have me summarize documents for you.
                  </p>

                  <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {QUICK_PROMPTS.map((prompt, i) => (
                      <motion.button
                        key={prompt}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + (i * 0.1), type: "spring", stiffness: 250, damping: 25 }}
                        whileHover={{ y: -2, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="text-left p-4 rounded-2xl border border-slate-200/60 dark:border-[#2f2f2f] bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl hover:bg-white dark:hover:bg-zinc-800 transition-all duration-300 text-[14px] text-slate-700 dark:text-[#ececec] font-medium shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:border-indigo-200/60 dark:hover:border-indigo-500/30"
                        onClick={() => applyPrompt(prompt)}
                      >
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col py-6">
                  {messages.map(msg => <Message key={msg.id} msg={msg} />)}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              )}
            </div>
          </div>

          {/* Floating Input Area */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA]/90 to-transparent dark:from-[#171717] dark:via-[#171717]/90 dark:to-transparent pt-12 pb-6 px-4 z-10 pointer-events-none">
            <div className="max-w-3xl mx-auto relative pointer-events-auto">
              <div className="relative flex items-end bg-white/80 dark:bg-[#1C1C1C]/80 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-none rounded-[24px] focus-within:shadow-[0_8px_32px_rgba(99,102,241,0.08)] focus-within:border-indigo-300/50 dark:focus-within:border-indigo-500/50 transition-all duration-300">
                <textarea
                  ref={textareaRef}
                  className="w-full max-h-[200px] bg-transparent border-none focus:ring-0 resize-none py-4 pl-5 pr-14 text-[15px] text-slate-900 dark:text-zinc-100 placeholder-slate-400 scrollbar-thin outline-none rounded-[24px]"
                  placeholder="Ask PrivateGPT anything..."
                  value={input}
                  rows={1}
                  onChange={e => {
                    setInput(e.target.value);
                    if (textareaRef.current) {
                      textareaRef.current.style.height = 'auto';
                      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
                    }
                  }}
                  onKeyDown={handleKeyDown}
                />
                <div className="absolute right-3 bottom-3">
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${!input.trim() || isLoading ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed' : 'bg-indigo-500 text-white shadow-[0_2px_10px_rgba(99,102,241,0.4)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.5)] hover:scale-105 active:scale-95 hover:bg-indigo-600'}`}
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                      >
                        <ArrowUp size={16} strokeWidth={2.5} />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs px-2 py-1 rounded shadow-lg" sideOffset={5}>
                        Send message
                        <Tooltip.Arrow className="fill-zinc-900 dark:fill-zinc-100" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </div>
              </div>
              <div className="text-center mt-3 text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                PrivateGPT can make mistakes. Consider verifying critical information.
              </div>
            </div>
          </div>
        </main>
      </div>
    </Tooltip.Provider>
  )
}
