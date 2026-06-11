import React from 'react'
import { cn } from '@/lib/utils'
import { X, Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react'

// ─── Button ──────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}
export function Button({ variant = 'primary', size = 'md', loading, children, className, disabled, icon, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
  const variants = {
    primary: 'bg-plum text-white hover:bg-plum-dark shadow-sm hover:shadow-md',
    gold:    'bg-gold text-plum-dark rounded-full hover:opacity-90 shadow-sm',
    outline: 'border-2 border-border text-muted hover:border-plum-mid hover:text-plum bg-white hover:bg-plum-light',
    ghost:   'text-muted hover:bg-surface hover:text-plum',
    danger:  'bg-ccs-red text-white hover:opacity-90 shadow-sm',
    success: 'bg-ccs-green text-white hover:opacity-90 shadow-sm',
  }
  const sizes = {
    xs: 'text-xs px-2.5 py-1.5',
    sm: 'text-xs px-3 py-2',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-6 py-3',
  }
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}

// ─── Input ───────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, icon, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-semibold text-muted uppercase tracking-wide">{label}</label>}
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-hint">{icon}</div>}
      <input
        ref={ref}
        className={cn(
          'w-full border rounded-xl py-3 text-sm text-ink bg-white outline-none transition-all',
          'placeholder:text-hint focus:ring-2',
          icon ? 'pl-10 pr-4' : 'px-4',
          error
            ? 'border-ccs-red focus:border-ccs-red focus:ring-ccs-red/10'
            : 'border-border focus:border-plum-mid focus:ring-plum/10',
          className
        )}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-ccs-red flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    {hint && !error && <p className="text-xs text-muted">{hint}</p>}
  </div>
))
Input.displayName = 'Input'

// ─── Modal ───────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
  maxWidth?: string
  footer?: React.ReactNode
}
export function Modal({ open, onClose, title, subtitle, children, maxWidth = 'max-w-lg', footer }: ModalProps) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    if (open) { document.body.style.overflow = 'hidden'; window.addEventListener('keydown', handler) }
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handler) }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cn('bg-white rounded-3xl w-full shadow-modal overflow-hidden max-h-[92vh] flex flex-col modal-content', maxWidth)}>
        {title && (
          <div className="flex items-start justify-between p-6 pb-4 border-b border-border flex-shrink-0">
            <div>
              <h3 className="font-display text-xl text-plum">{title}</h3>
              {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-muted hover:bg-ccs-red-lt hover:text-ccs-red transition-colors ml-4 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="p-6 pt-0 border-t border-border flex-shrink-0">{footer}</div>}
      </div>
    </div>
  )
}

// ─── Alert ───────────────────────────────────────────
interface AlertProps { type?: 'error' | 'success' | 'warn' | 'info'; message: string; className?: string }
export function Alert({ type = 'error', message, className }: AlertProps) {
  if (!message) return null
  const styles = {
    error:   { bg: 'bg-ccs-red-lt border-red-200',     text: 'text-ccs-red',   icon: <AlertCircle className="w-4 h-4 flex-shrink-0" /> },
    success: { bg: 'bg-ccs-green-lt border-green-200', text: 'text-ccs-green', icon: <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> },
    warn:    { bg: 'bg-og-light border-amber-200',     text: 'text-og-dark',   icon: <AlertCircle className="w-4 h-4 flex-shrink-0" /> },
    info:    { bg: 'bg-ccs-blue-lt border-blue-200',   text: 'text-ccs-blue',  icon: <Info className="w-4 h-4 flex-shrink-0" /> },
  }
  const s = styles[type]
  return (
    <div className={cn('flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm border', s.bg, s.text, className)}>
      {s.icon}<span>{message}</span>
    </div>
  )
}

// ─── Spinner ─────────────────────────────────────────
export function Spinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <div className={cn('border-3 border-border border-t-plum rounded-full animate-spin', sizes[size])} style={{ borderWidth: 3 }} />
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}
export function ProductSkeleton() {
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between items-center pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-7 w-12 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────
interface EmptyProps { icon?: string; title: string; subtitle?: string; action?: React.ReactNode }
export function Empty({ icon = '📭', title, subtitle, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3 animate-fadeIn">
      <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center text-4xl mb-1">{icon}</div>
      <h3 className="font-semibold text-ink text-base">{title}</h3>
      {subtitle && <p className="text-sm text-muted max-w-xs leading-relaxed">{subtitle}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ─── Toggle ──────────────────────────────────────────
interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; label?: string; color?: string; size?: 'sm' | 'md' }
export function Toggle({ checked, onChange, label, color = 'bg-ccs-green', size = 'md' }: ToggleProps) {
  const track = size === 'sm' ? 'w-9 h-5' : 'w-12 h-6'
  const thumb = size === 'sm' ? 'w-3.5 h-3.5 top-0.75' : 'w-4 h-4 top-1'
  const translate = size === 'sm' ? 'translate-x-4' : 'translate-x-7'
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <div className={cn('relative rounded-full transition-colors duration-200', track, checked ? color : 'bg-hint')} onClick={() => onChange(!checked)}>
        <span className={cn('absolute left-1 bg-white rounded-full shadow transition-transform duration-200', thumb, checked ? translate : 'translate-x-0')} />
      </div>
      {label && <span className="text-sm font-medium text-ink">{label}</span>}
    </label>
  )
}

// ─── Stat Card ───────────────────────────────────────
interface StatCardProps { value: number | string; label: string; color?: string; icon?: string; trend?: string; onClick?: () => void }
export function StatCard({ value, label, color = 'text-plum', icon, trend, onClick }: StatCardProps) {
  return (
    <div className={cn('bg-white border border-border rounded-2xl p-5 transition-all duration-200', onClick && 'cursor-pointer hover:shadow-cake hover:-translate-y-0.5')} onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        {icon && <span className="text-2xl">{icon}</span>}
        {trend && <span className="text-xs font-medium text-ccs-green bg-ccs-green-lt px-2 py-0.5 rounded-full">{trend}</span>}
      </div>
      <div className={cn('text-3xl font-bold font-display', color)}>{value}</div>
      <div className="text-xs text-muted mt-1.5 font-medium">{label}</div>
    </div>
  )
}

// ─── Tab Bar ─────────────────────────────────────────
interface TabBarProps<T extends string> {
  tabs: { id: T; label: string; icon?: string; count?: number }[]
  active: T
  onChange: (id: T) => void
  className?: string
}
export function TabBar<T extends string>({ tabs, active, onChange, className }: TabBarProps<T>) {
  return (
    <div className={cn('flex bg-surface rounded-2xl p-1.5 gap-1', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200',
            active === t.id ? 'bg-white text-plum shadow-sm' : 'text-muted hover:text-ink'
          )}
        >
          {t.icon && <span>{t.icon}</span>}
          <span>{t.label}</span>
          {t.count !== undefined && t.count > 0 && (
            <span className={cn('text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1', active === t.id ? 'bg-plum text-white' : 'bg-border text-muted')}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Page Header ─────────────────────────────────────
interface PageHeaderProps { title: string; subtitle?: string; breadcrumb?: { label: string; onClick: () => void }[]; action?: React.ReactNode }
export function PageHeader({ title, subtitle, breadcrumb, action }: PageHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-plum-light to-cream border-b border-border px-4 sm:px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {breadcrumb && (
          <div className="flex items-center gap-1.5 text-xs text-muted mb-3">
            {breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                <button onClick={b.onClick} className="hover:text-plum transition-colors">{b.label}</button>
                {i < breadcrumb.length - 1 && <span>/</span>}
              </React.Fragment>
            ))}
          </div>
        )}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-plum">{title}</h1>
            {subtitle && <p className="text-muted text-sm mt-1">{subtitle}</p>}
          </div>
          {action}
        </div>
      </div>
    </div>
  )
}
