import { cn } from '@/lib/utils'
import { humanize } from '@/lib/format'
import type { Tone } from '@/lib/admin/labels'

const TONES: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  gold: 'bg-gold/15 text-foreground ring-1 ring-gold/40',
  good: 'bg-emerald-600/10 text-emerald-800',
  warn: 'bg-amber-500/15 text-amber-900',
  bad: 'bg-destructive/10 text-destructive',
}

export function StatusPill({ value, tones }: { value: string; tones: Record<string, Tone> }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONES[tones[value] ?? 'neutral'],
      )}
    >
      {humanize(value)}
    </span>
  )
}
