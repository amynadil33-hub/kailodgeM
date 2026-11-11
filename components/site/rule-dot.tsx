import { cn } from '@/lib/utils'

/** The thin rule with a centred dot, taken from the Kai Lodge logo. */
export function RuleDot({ className, align = 'center' }: { className?: string; align?: 'center' | 'start' }) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex items-center gap-3 text-gold', align === 'start' ? 'justify-start' : 'justify-center', className)}
    >
      {align === 'center' && <span className="h-px w-12 bg-current opacity-70" />}
      <span className="size-1.5 rounded-full bg-current" />
      <span className="h-px w-12 bg-current opacity-70" />
    </div>
  )
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-xs font-semibold uppercase tracking-[0.28em] text-gold', className)}>{children}</p>
  )
}
