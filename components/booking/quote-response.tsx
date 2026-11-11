'use client'

import { useState, useTransition } from 'react'
import { respondToQuote } from '@/app/actions/guest'
import { Button } from '@/components/ui/button'

export function QuoteResponse({ token, requestId }: { token: string; requestId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function respond(accept: boolean) {
    start(async () => {
      const res = await respondToQuote(token, requestId, accept)
      if (!res.ok) setError(res.error ?? 'Something went wrong.')
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={() => respond(true)}>
          Accept
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => respond(false)}>
          Decline
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
