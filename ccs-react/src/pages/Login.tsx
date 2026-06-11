import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/lib/api'
import { useAuthStore, UserRole } from '@/store/auth'
import { Alert } from '@/components/ui'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES = [
  { role: 'customer' as UserRole, icon: '🛍️', label: 'Customer',  desc: 'Order & track',   active: 'border-plum bg-plum-light',     dot: 'bg-plum' },
  { role: 'chef'     as UserRole, icon: '👨‍🍳', label: 'Chef',      desc: 'Kitchen orders',  active: 'border-og bg-og-light',         dot: 'bg-og' },
  { role: 'agent'    as UserRole, icon: '🚚', label: 'Delivery',  desc: 'Deliver orders',  active: 'border-ccs-blue bg-ccs-blue-lt', dot: 'bg-ccs-blue' },
  { role: 'admin'    as UserRole, icon: '🔐', label: 'Admin',     desc: 'Manage all',      active: 'border-ccs-green bg-ccs-green-lt',dot: 'bg-ccs-green' },
]

const ROLE_VALID: Record<UserRole, string[]> = {
  customer: ['customer'],
  chef:     ['chef', 'admin'],
  agent:    ['agent', 'admin'],
  admin:    ['admin'],
}

const ROLE_ROUTE: Record<string, string> = {
  customer: '/home',
  chef:     '/chef',
  agent:    '/delivery',
  admin:    '/admin',
}

const BTN_COLOR: Record<UserRole, string> = {
  customer: '#3D1C52',
  chef:     '#D97706',
  agent:    '#1A5FA8',
  admin:    '#1A7F5A',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore((s) => s.setAuth)

  const [selectedRole, setSelectedRole] = useState<UserRole>('customer')
  const [tab,          setTab]          = useState<'login' | 'register'>('login')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [showPwd,      setShowPwd]      = useState(false)

  const [loginId,  setLoginId]  = useState('')
  const [loginPwd, setLoginPwd] = useState('')
  const [regName,   setRegName]   = useState('')
  const [regEmail,  setRegEmail]  = useState('')
  const [regMobile, setRegMobile] = useState('')
  const [regPwd,    setRegPwd]    = useState('')

  const isStaff = selectedRole === 'chef' || selectedRole === 'agent'

  async function handleLogin() {
    if (!loginId.trim() || !loginPwd) { setError('Please fill in all fields'); return }
    setLoading(true); setError('')
    try {
      const res  = await authApi.login(loginId.trim(), loginPwd)
      const data = res.data as any
      const user = data.user ?? data
      const tok  = data.token
      if (!ROLE_VALID[selectedRole].includes(user.role)) {
        throw new Error(`This is a ${user.role} account. Please select the correct role above.`)
      }
      setAuth(tok, user)
      toast.success(`Welcome back, ${user.name}! 🎂`)
      navigate(ROLE_ROUTE[user.role] ?? '/home')
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  async function handleRegister() {
    if (!regName || !regEmail || !regMobile || !regPwd) { setError('Please fill all fields'); return }
    if (regPwd.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    try {
      const res  = await authApi.register({ name: regName, email: regEmail, mobile: regMobile, password: regPwd })
      const data = res.data as any
      const user = data.user ?? data
      setAuth(data.token, user)
      toast.success(`Welcome, ${user.name}! 🎂`)
      navigate('/home')
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a1025 0%, #2A1239 50%, #0f2744 100%)' }}
    >
      {/* Ambient blobs */}
      <div className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: '#C9973A' }} />
      <div className="absolute bottom-20 right-20 w-56 h-56 rounded-full opacity-15 blur-3xl" style={{ background: '#B84265' }} />

      <div className="relative w-full max-w-md animate-slideUp">
        <div className="bg-white rounded-3xl shadow-[0_32px_90px_rgba(0,0,0,.5)] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-plum to-plum-dark px-8 pt-8 pb-6 text-center text-white">
            <div className="text-5xl mb-3">🎂</div>
            <h1 className="font-display text-2xl mb-1">Celebration <span className="text-gold">Cake</span> Shop</h1>
            <p className="text-white/60 text-sm">Sign in to continue</p>
          </div>

          <div className="p-6">
            {/* Role Pills */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {ROLES.map(({ role, icon, label, desc, active, dot }) => (
                <button
                  key={role}
                  onClick={() => { setSelectedRole(role); setError(''); if (role !== 'customer') setTab('login') }}
                  className={`border-2 rounded-2xl p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cake ${selectedRole === role ? active : 'border-border bg-surface hover:border-muted'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{icon}</span>
                    {selectedRole === role && <span className={`w-1.5 h-1.5 rounded-full ml-auto ${dot}`} />}
                  </div>
                  <p className={`text-xs font-bold ${selectedRole === role ? 'text-ink' : 'text-muted'}`}>{label}</p>
                  <p className="text-[10px] text-muted mt-0.5">{desc}</p>
                </button>
              ))}
            </div>

            {/* Auth Tabs */}
            {selectedRole === 'customer' && (
              <div className="flex bg-surface rounded-xl p-1 mb-4">
                {(['login', 'register'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError('') }}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-white text-plum shadow-sm' : 'text-muted hover:text-ink'}`}
                  >
                    {t === 'login' ? 'Log In' : 'Sign Up'}
                  </button>
                ))}
              </div>
            )}

            {/* Error */}
            {error && <Alert message={error} type="error" className="mb-4" />}

            {/* Login Form */}
            {tab === 'login' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1.5">
                    {isStaff ? 'Email or Mobile' : 'Email'}
                  </label>
                  <input
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder={isStaff ? 'Email or mobile number' : 'you@example.com'}
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-plum-mid focus:ring-2 focus:ring-plum/10 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={loginPwd}
                      onChange={(e) => setLoginPwd(e.target.value)}
                      placeholder="••••••••"
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-plum-mid focus:ring-2 focus:ring-plum/10 transition-all pr-11"
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-hint hover:text-muted">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full text-white py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-1 shadow-sm"
                  style={{ background: BTN_COLOR[selectedRole] }}
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : `Sign In as ${ROLES.find(r => r.role === selectedRole)?.label}`}
                </button>
              </div>
            )}

            {/* Register Form */}
            {tab === 'register' && (
              <div className="space-y-3">
                {[
                  { label: 'Full Name', value: regName, onChange: setRegName, placeholder: 'Your full name', type: 'text' },
                  { label: 'Email',     value: regEmail, onChange: setRegEmail, placeholder: 'you@example.com', type: 'email' },
                  { label: 'Mobile',    value: regMobile, onChange: setRegMobile, placeholder: '9876543210', type: 'tel' },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1.5">{f.label}</label>
                    <input type={f.type} value={f.value} onChange={(e) => f.onChange(e.target.value)} placeholder={f.placeholder}
                      className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-plum-mid focus:ring-2 focus:ring-plum/10 transition-all" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1.5">Password</label>
                  <input type="password" value={regPwd} onChange={(e) => setRegPwd(e.target.value)} placeholder="Min 6 characters"
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-plum-mid focus:ring-2 focus:ring-plum/10 transition-all" />
                </div>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full bg-plum text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-plum-dark transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create Account'}
                </button>
              </div>
            )}

            <p className="text-center text-[11px] text-hint mt-5">🔒 Secured with 256-bit encryption · Your data is safe</p>
          </div>
        </div>
      </div>
    </div>
  )
}
