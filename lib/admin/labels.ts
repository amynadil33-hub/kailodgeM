export type Tone = 'neutral' | 'gold' | 'good' | 'warn' | 'bad'

export const RESERVATION_TONE: Record<string, Tone> = {
  pending: 'warn',
  confirmed: 'gold',
  checked_in: 'good',
  checked_out: 'neutral',
  cancelled: 'bad',
  expired: 'bad',
  no_show: 'bad',
}

export const PAYMENT_TONE: Record<string, Tone> = {
  unpaid: 'bad',
  awaiting_verification: 'warn',
  partially_paid: 'warn',
  advance_paid: 'gold',
  paid: 'good',
  refunded: 'neutral',
  pending: 'warn',
  verified: 'good',
  rejected: 'bad',
}

export const REQUEST_TONE: Record<string, Tone> = {
  included: 'good',
  quote_pending: 'warn',
  quoted: 'gold',
  accepted: 'good',
  declined: 'bad',
  fulfilled: 'neutral',
  cancelled: 'bad',
}

export const RESERVATION_ACTIONS: Record<string, { to: string; label: string; danger?: boolean }[]> = {
  pending: [
    { to: 'confirmed', label: 'Confirm booking' },
    { to: 'cancelled', label: 'Cancel', danger: true },
  ],
  confirmed: [
    { to: 'checked_in', label: 'Check in' },
    { to: 'no_show', label: 'Mark no-show', danger: true },
    { to: 'cancelled', label: 'Cancel', danger: true },
  ],
  checked_in: [{ to: 'checked_out', label: 'Check out' }],
  checked_out: [{ to: 'checked_in', label: 'Undo check-out' }],
  cancelled: [{ to: 'pending', label: 'Restore booking' }],
  expired: [{ to: 'pending', label: 'Restore booking' }],
  no_show: [{ to: 'confirmed', label: 'Restore as confirmed' }],
}
