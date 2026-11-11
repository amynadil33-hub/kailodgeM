'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { updateEnquiryStatus } from '@/app/actions/admin'
import { removeRoomBlock, setPaymentStatus } from '@/app/actions/admin-bookings'

function useRun() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const res = await fn()
      setError(res.ok ? null : (res.error ?? 'Something went wrong.'))
      if (res.ok) router.refresh()
    })
  return { pending, error, run }
}

export function PaymentQuickActions({ paymentId }: { paymentId: string }) {
  const { pending, error, run } = useRun()
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={() => run(() => setPaymentStatus(paymentId, 'verified'))}>
          Verify
        </Button>
        <Button size="sm" variant="outline" className="text-destructive" disabled={pending} onClick={() => run(() => setPaymentStatus(paymentId, 'rejected'))}>
          Reject
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

export function EnquiryStatusButtons({ id, status }: { id: string; status: string }) {
  const { pending, error, run } = useRun()
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        {(['new', 'replied', 'closed'] as const)
          .filter((s) => s !== status)
          .map((s) => (
            <Button key={s} size="sm" variant="outline" disabled={pending} onClick={() => run(() => updateEnquiryStatus(id, s))}>
              Mark {s}
            </Button>
          ))}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

export function RemoveBlockButton({ allocationId }: { allocationId: string }) {
  const { pending, error, run } = useRun()
  return (
    <span className="inline-flex flex-col">
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => removeRoomBlock(allocationId))}>
        Remove
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </span>
  )
}
