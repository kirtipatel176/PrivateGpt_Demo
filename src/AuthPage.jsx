import { useState } from 'react'
import { Loader2, Sun, Moon, AlertCircle } from 'lucide-react'

// Use Vite env var for auth API; fallback to localhost for dev.
const AUTH_API = import.meta.env.VITE_AUTH_API || 'http://localhost:8001'

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'))

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark')
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add('dark')
      setIsDarkMode(true)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const params = new URLSearchParams()
        params.append('username', username)
        params.append('password', password)

        const res = await fetch(`${AUTH_API}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params,
        })

        if (!res.ok) {
          // Surface backend error message when available
          try { const errData = await res.json(); throw new Error(errData.detail || 'Invalid credentials. Please try again.') } catch { throw new Error('Invalid credentials. Please try again.') }
        }

        const data = await res.json()
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('username', username)
        localStorage.setItem('isSuperadmin', data.is_superadmin)
        onLogin(data.access_token, username, data.is_superadmin)
      } else {
        const res = await fetch(`${AUTH_API}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.detail || 'Registration failed')
        }

        setIsLogin(true)
        setError('Registration successful! Please login.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f4f9] dark:bg-[#131314] font-sans transition-colors duration-300">
      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all text-[#444746] dark:text-[#c4c7c5]"
        aria-label="Toggle theme"
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Google M3 Split Card Layout */}
      <div className="bg-white dark:bg-[#1e1f20] w-full min-h-screen md:min-h-[400px] md:h-auto md:w-[1040px] md:rounded-[28px] flex flex-col md:flex-row overflow-hidden md:shadow-sm">
        
        {/* Left Side: Branding and Headings */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col pt-16 md:pt-12 lg:pt-16">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-semibold text-[#1f1f1f] dark:text-[#e3e3e3]">PrivateGpt</span>
          </div>
          <h1 className="text-[36px] font-normal text-[#1f1f1f] dark:text-[#e3e3e3] leading-[44px] tracking-normal mb-4">
            {isLogin ? 'Sign in' : 'Create an account'}
          </h1>
          <p className="text-[16px] text-[#1f1f1f] dark:text-[#e3e3e3] leading-6 font-normal">
            to continue to PrivateGpt
          </p>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <form onSubmit={handleSubmit} className="w-full flex flex-col relative pb-16">
            
            {/* Inputs Container */}
            <div className="space-y-4">
              {/* Username Input with Floating Label */}
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder=" "
                  className="peer block w-full px-4 pt-6 pb-2 text-[16px] text-[#1f1f1f] dark:text-[#e3e3e3] bg-transparent border border-[#747775] dark:border-[#8e918f] rounded-[4px] appearance-none focus:outline-none focus:ring-2 focus:ring-[#0b57d0] dark:focus:ring-[#a8c7fa] focus:border-transparent transition-all"
                  required
                />
                <label
                  htmlFor="username"
                  className="absolute text-[16px] text-[#444746] dark:text-[#c4c7c5] duration-300 transform -translate-y-3 scale-[0.8] top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-3 peer-focus:text-[#0b57d0] dark:peer-focus:text-[#a8c7fa] pointer-events-none bg-white dark:bg-[#1e1f20] px-1"
                >
                  Email or username
                </label>
              </div>

              {/* Password Input with Floating Label */}
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=" "
                  className="peer block w-full px-4 pt-6 pb-2 text-[16px] text-[#1f1f1f] dark:text-[#e3e3e3] bg-transparent border border-[#747775] dark:border-[#8e918f] rounded-[4px] appearance-none focus:outline-none focus:ring-2 focus:ring-[#0b57d0] dark:focus:ring-[#a8c7fa] focus:border-transparent transition-all"
                  required
                />
                <label
                  htmlFor="password"
                  className="absolute text-[16px] text-[#444746] dark:text-[#c4c7c5] duration-300 transform -translate-y-3 scale-[0.8] top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-3 peer-focus:text-[#0b57d0] dark:peer-focus:text-[#a8c7fa] pointer-events-none bg-white dark:bg-[#1e1f20] px-1"
                >
                  Enter your password
                </label>
              </div>
            </div>

            {/* Spacing */}
            <div className="mt-2 mb-8"></div>

            {/* Error Message */}
            {error && (
              <div className={`mb-6 flex items-start gap-2 text-[14px] ${error.includes('successful') ? 'text-[#146c2e] dark:text-[#6dd58c]' : 'text-[#b3261e] dark:text-[#f2b8b5]'}`}>
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto absolute bottom-0 w-full">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError('') }}
                className="text-[14px] font-medium text-[#0b57d0] dark:text-[#a8c7fa] hover:bg-[#f0f4f9] dark:hover:bg-[#282a2c] px-4 py-2.5 rounded-full transition-colors inline-block text-left sm:text-center"
              >
                {isLogin ? 'Create account' : 'Sign in instead'}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center min-w-[100px] text-[14px] font-medium px-6 py-2.5 rounded-full bg-[#0b57d0] text-white hover:bg-[#084298] dark:bg-[#a8c7fa] dark:text-[#052e70] dark:hover:bg-[#d3e3fd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Sign up')}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Footer Links */}
      <div className="absolute bottom-4 flex gap-6 text-[12px] text-[#444746] dark:text-[#c4c7c5] bg-[#f0f4f9] dark:bg-[#131314] px-4 py-2">
        <button className="hover:bg-black/5 dark:hover:bg-white/5 px-2 py-1 rounded transition-colors">Help</button>
        <button className="hover:bg-black/5 dark:hover:bg-white/5 px-2 py-1 rounded transition-colors">Privacy</button>
        <button className="hover:bg-black/5 dark:hover:bg-white/5 px-2 py-1 rounded transition-colors">Terms</button>
      </div>
    </div>
  )
}
