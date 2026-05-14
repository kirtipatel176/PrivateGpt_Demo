import { useState, useEffect } from 'react'
import { Loader2, Sun, Moon, AlertCircle, ShieldCheck } from 'lucide-react'

// Auth API endpoint — configure via VITE_AUTH_API env var for production
const AUTH_API = import.meta.env.VITE_AUTH_API || 'http://localhost:8001'

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'))
  }, [])

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
        // FastAPI expects application/x-www-form-urlencoded for the /token endpoint
        const params = new URLSearchParams()
        params.append('username', username)
        params.append('password', password)

        const res = await fetch(`${AUTH_API}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params,
        })

        if (!res.ok) {
          try {
            const errData = await res.json()
            throw new Error(errData.detail || 'Invalid credentials. Please try again.')
          } catch {
            throw new Error('Invalid credentials. Please try again.')
          }
        }

        const data = await res.json()
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('username', username)
        localStorage.setItem('isSuperadmin', data.is_superadmin)
        onLogin(data.access_token, username, data.is_superadmin)
      } else {
        // Register new user
        const res = await fetch(`${AUTH_API}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.detail || 'Registration failed. Please try again.')
        }

        setIsLogin(true)
        setError('Registration successful! Please sign in.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDarkMode
          ? 'radial-gradient(ellipse at 60% 20%, #1e1b4b 0%, #09090b 60%, #0a0a0f 100%)'
          : 'radial-gradient(ellipse at 60% 20%, #eef2ff 0%, #f8fafc 60%, #ffffff 100%)',
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
        transition: 'background 0.4s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow blobs */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          zIndex: 50,
          padding: '10px',
          borderRadius: '50%',
          background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
          cursor: 'pointer',
          color: isDarkMode ? '#a1a1aa' : '#6b7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)',
        }}
      >
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '48px 44px',
          margin: '24px',
          borderRadius: '24px',
          background: isDarkMode
            ? 'rgba(18,18,20,0.85)'
            : 'rgba(255,255,255,0.90)',
          border: isDarkMode
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(0,0,0,0.07)',
          boxShadow: isDarkMode
            ? '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)'
            : '0 32px 80px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)',
          backdropFilter: 'blur(24px)',
          position: 'relative',
          zIndex: 10,
          transition: 'all 0.3s ease',
        }}
      >
        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: isDarkMode
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '13px',
              color: '#fff',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            }}
          >
            PG
          </div>
          <span
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: isDarkMode ? '#ffffff' : '#0f172a',
              letterSpacing: '-0.3px',
            }}
          >
            PrivateGPT
          </span>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: '700',
              color: isDarkMode ? '#f4f4f5' : '#0f172a',
              letterSpacing: '-0.5px',
              marginBottom: '8px',
              lineHeight: '1.2',
            }}
          >
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: isDarkMode ? '#71717a' : '#64748b',
              fontWeight: '400',
              lineHeight: '1.5',
            }}
          >
            {isLogin
              ? 'Enter your credentials to access your workspace.'
              : 'Set up your account to get started with PrivateGPT.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Username field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              htmlFor="auth-username"
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: isDarkMode ? '#a1a1aa' : '#374151',
                letterSpacing: '0.01em',
              }}
            >
              Username
            </label>
            <input
              type="text"
              id="auth-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              required
              style={{
                padding: '13px 16px',
                borderRadius: '12px',
                border: isDarkMode ? '1.5px solid rgba(255,255,255,0.08)' : '1.5px solid #e2e8f0',
                background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                color: isDarkMode ? '#f4f4f5' : '#0f172a',
                fontSize: '15px',
                fontWeight: '500',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                width: '100%',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1'
                e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Password field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              htmlFor="auth-password"
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: isDarkMode ? '#a1a1aa' : '#374151',
                letterSpacing: '0.01em',
              }}
            >
              Password
            </label>
            <input
              type="password"
              id="auth-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              style={{
                padding: '13px 16px',
                borderRadius: '12px',
                border: isDarkMode ? '1.5px solid rgba(255,255,255,0.08)' : '1.5px solid #e2e8f0',
                background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                color: isDarkMode ? '#f4f4f5' : '#0f172a',
                fontSize: '15px',
                fontWeight: '500',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                width: '100%',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1'
                e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Error / Success alert */}
          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                fontWeight: '600',
                ...(error.includes('successful')
                  ? {
                      background: isDarkMode ? 'rgba(16,185,129,0.08)' : '#f0fdf4',
                      border: '1px solid rgba(16,185,129,0.2)',
                      color: isDarkMode ? '#34d399' : '#065f46',
                    }
                  : {
                      background: isDarkMode ? 'rgba(239,68,68,0.08)' : '#fef2f2',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: isDarkMode ? '#f87171' : '#991b1b',
                    }),
              }}
            >
              {error.includes('successful')
                ? <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                : <AlertCircle size={16} style={{ flexShrink: 0 }} />
              }
              <span>{error}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '700',
              fontFamily: 'inherit',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.65 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
              transition: 'all 0.2s ease',
              letterSpacing: '0.01em',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.boxShadow = '0 6px 28px rgba(99,102,241,0.45)'
                e.target.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = '0 4px 20px rgba(99,102,241,0.3)'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            {loading
              ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              : (isLogin ? 'Sign In' : 'Create Account')
            }
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            margin: '28px 0 20px',
            borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid #f1f5f9',
          }}
        />

        {/* Switch mode */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '14px',
            color: isDarkMode ? '#52525b' : '#94a3b8',
            fontWeight: '500',
          }}
        >
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError('') }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '700',
              color: '#6366f1',
              fontFamily: 'inherit',
              padding: 0,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => { e.target.style.color = '#4f46e5' }}
            onMouseLeave={(e) => { e.target.style.color = '#6366f1' }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
