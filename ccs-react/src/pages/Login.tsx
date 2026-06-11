import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/lib/api'
import { useAuthStore, UserRole } from '@/store/auth'
import { Button, Input, Alert } from '@/components/ui'
import toast from 'react-hot-toast'

const ROLES: { role: UserRole; icon: string; label: string; color: string; selClass: string }[] = [
  { role: 'customer', icon: '🛍️', label: 'Customer',  color: '#3D1C52', selClass: 'border-plum bg-plum-light' },
  { role: 'chef',     icon: '👨‍🍳', label: 'Chef',      color: '#D97706', selClass: 'border-og bg-og-light' },
  { role: 'agent',    icon: '🚚', label: 'Delivery',  color: '#1A5FA8', selClass: 'border-ccs-blue bg-ccs-blue-lt' },
  { role: 'admin',    icon: '🔐', label: 'Admin',     color: '#1A7F5A', selClass: 'border-ccs-green bg-ccs-green-lt' },
]

const ROLE_VALID: Record<UserRole, string[]> = {
  customer: ['customer'],
  chef:     ['chef', 'admin'],
  agent:    ['agent', 'admin'],
  admin:    ['admin'],
}

const ROLE_ROUTE: Record<string, string> = {
  customer: '/',
  chef:     '/chef',
  agent:    '/delivery',
  admin:    '/admin',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore((s) => s.setAuth)

  const [selectedRole, setSelectedRole] = useState<UserRole>('customer')
  const [tab,          setTab]          = useState<'login' | 'register'>('login')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  // Login fields
  const [loginId,  setLoginId]  = useState('')
  const [loginPwd, setLoginPwd] = useState('')

  // Register fields
  const [regName,   setRegName]   = useState('')
  const [regEmail,  setRegEmail]  = useState('')
  const [regMobile, setRegMobile] = useState('')
  const [regPwd,    setRegPwd]    = useState('')

  const btnColor = ROLES.find((r) => r.role === selectedRole)?.color ?? '#3D1C52'

  async function handleLogin() {
    if (!loginId || !loginPwd) { setError('Please fill in all fields'); return }
    setLoading(true); setError('')
    try {
      const res  = await authApi.login(loginId, loginPwd)
      const data = res.data
      const user = data.user ?? data
      const tok  = data.token

      if (!ROLE_VALID[selectedRole].includes(user.role)) {
        throw new Error(`This is a ${user.role} account. Please select the correct role.`)
      }
      setAuth(tok, user)
      toast.success(`Welcome back, ${user.name}! 🎂`)
      navigate(ROLE_ROUTE[user.role] ?? '/')
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function handleRegister() {
    if (!regName || !regEmail || !regMobile || !regPwd) { setError('Please fill all fields'); return }
    setLoading(true); setError('')
    try {
      const res  = await authApi.register({ name: regName, email: regEmail, mobile: regMobile, password: regPwd })
      const data = res.data
      const user = data.user ?? data
      setAuth(data.token, user)
      toast.success(`Account created! Welcome, ${user.name}! 🎂`)
      navigate('/')
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5"
         style={{ background: 'linear-gradient(135deg,#1a1025 0%,#2A1239 60%,#0f2744 100%)' }}>
      <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-modal">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎂</div>
          <h1 className="font-display text-2xl text-plum">
            Celebration <span className="text-gold">Cake</span> Shop
          </h1>
          <p className="text-sm text-muted mt-1">Choose your role to continue</p>
        </div>

        {/* Role Pills */}
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {ROLES.map(({ role, icon, label, selClass }) => (
            <button
              key={role}
              onClick={() => { setSelectedRole(role); setError('') }}
              className={`border-2 rounded-2xl py-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-cake
                ${selectedRole === role ? selClass + ' shadow-cake' : 'border-border bg-surface'}`}
            >
              <div className="text-2xl mb-1">{icon}</div>
              <div className={`text-xs font-semibold ${selectedRole === role ? '' : 'text-muted'}`}>{label}</div>
            </button>
          ))}
        </div>

        {/* Auth Tabs — only show register for customer */}
        <div className="flex bg-surface rounded-xl p-1 mb-5">
          {(['login', ...(selectedRole === 'customer' ? ['register'] : [])] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t as any); setError('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize
                ${tab === t ? 'bg-white text-plum shadow-sm' : 'text-muted'}`}
            >
              {t === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <Alert message={error} type="error" />

        {/* Login Form */}
        {tab === 'login' && (
          <div className="flex flex-col gap-3 mt-3">
            <Input
              label={selectedRole === 'chef' || selectedRole === 'agent' ? 'Email or Mobile' : 'Email'}
              placeholder={selectedRole === 'chef' || selectedRole === 'agent' ? 'Email or mobile number' : 'you@example.com'}
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={loginPwd}
              onChange={(e) => setLoginPwd(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full mt-1 text-white py-3.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: btnColor }}
            >
              {loading ? '⏳ Signing in…' : 'Sign In'}
            </button>
          </div>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <div className="flex flex-col gap-3 mt-3">
            <Input label="Full Name"  placeholder="Your name" value={regName}   onChange={(e) => setRegName(e.target.value)} />
            <Input label="Email"      type="email" placeholder="you@example.com" value={regEmail}  onChange={(e) => setRegEmail(e.target.value)} />
            <Input label="Mobile"     placeholder="9876543210" value={regMobile} onChange={(e) => setRegMobile(e.target.value)} />
            <Input label="Password"   type="password" placeholder="Min 6 characters" value={regPwd} onChange={(e) => setRegPwd(e.target.value)} />
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full mt-1 bg-plum text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-plum-dark transition-colors disabled:opacity-50"
            >
              {loading ? '⏳ Creating…' : 'Create Account'}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-hint mt-4">🔒 Secure login · All roles in one place</p>
      </div>
    </div>
  )
}
