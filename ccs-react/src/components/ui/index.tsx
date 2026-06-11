import React from 'react'
import { cn } from '@/lib/utils'
import { X, Loader2 } from 'lucide-react'

// ─── Button ──────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary', size = 'md', loading, children, className, disabled, ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-plum text-white hover:bg-plum-dark',
    gold:    'bg-gold text-plum-dark rounded-full hover:opacity-90',
    outline: 'border border-border text-muted hover:border-plum-mid hover:text-plum bg-white',
    ghost:   'text-muted hover:bg-surface hover:text-plum',
    danger:  'bg-ccs-red text-white hover:opacity-90',
  }
  const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-4 py-2.5', lg: 'text-base px-6 py-3' }
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}

// ─── Input ───────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-muted uppercase tracking-wide">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'w-full border rounded-xl px-4 py-3 text-sm text-ink bg-white outline-none transition-colors',
          'placeholder:text-hint',
          error ? 'border-ccs-red focus:border-ccs-red' : 'border-border focus:border-plum-mid',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-ccs-red">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

// ─── Modal ───────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn('bg-white rounded-3xl w-full shadow-modal overflow-y-auto max-h-[92vh] modal-content', maxWidth)}>
        {title && (
          <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
            <h3 className="font-display text-xl text-plum">{title}</h3>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-muted hover:bg-ccs-red-lt hover:text-ccs-red transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ─── Badge ───────────────────────────────────────────
interface BadgeProps { label: string; className?: string; dot?: boolean }
export function Badge({ label, className, dot }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {label}
    </span>
  )
}

// ─── Spinner ─────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <Loader2 className="w-8 h-8 text-plum animate-spin" />
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────
interface EmptyProps { icon?: string; title: string; subtitle?: string; action?: React.ReactNode }
export function Empty({ icon = '📭', title, subtitle, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <span className="text-5xl">{icon}</span>
      <h3 className="font-medium text-ink">{title}</h3>
      {subtitle && <p className="text-sm text-muted max-w-xs">{subtitle}</p>}
      {action}
    </div>
  )
}

// ─── Alert ───────────────────────────────────────────
interface AlertProps { type?: 'error' | 'success' | 'warn'; message: string }
export function Alert({ type = 'error', message }: AlertProps) {
  const styles = {
    error:   'bg-ccs-red-lt text-ccs-red border border-red-200',
    success: 'bg-ccs-green-lt text-ccs-green border border-green-200',
    warn:    'bg-og-light text-og-dark border border-amber-200',
  }
  if (!message) return null
  return <div className={cn('rounded-xl px-4 py-3 text-sm', styles[type])}>{message}</div>
}

// ─── Toggle Switch ───────────────────────────────────
interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; label?: string; color?: string }
export function Toggle({ checked, onChange, label, color = 'bg-ccs-green' }: ToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        className={cn('relative w-12 h-6 rounded-full transition-colors', checked ? color : 'bg-hint')}
        onClick={() => onChange(!checked)}
      >
        <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', checked ? 'translate-x-7' : 'translate-x-1')} />
      </div>
      {label && <span className="text-sm font-medium text-ink">{label}</span>}
    </label>
  )
}

// ─── Stat Card ───────────────────────────────────────
interface StatCardProps { value: number | string; label: string; color?: string; onClick?: () => void }
export function StatCard({ value, label, color = 'text-plum', onClick }: StatCardProps) {
  return (
    <div
      className={cn('bg-white border border-border rounded-2xl p-6 text-center', onClick && 'cursor-pointer hover:shadow-cake transition-shadow')}
      onClick={onClick}
    >
      <div className={cn('text-4xl font-bold font-display', color)}>{value}</div>
      <div className="text-sm text-muted mt-1">{label}</div>
    </div>
  )
}
