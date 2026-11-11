'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addTeamMember, removeTeamMember } from '@/app/actions/admin-bookings'
import { FormMessage, selectClass } from './form-bits'

export function TeamManager({
  members,
  currentUserId,
  isOwner,
}: {
  members: { user_id: string; role: string; email: string }[]
  currentUserId: string
  isOwner: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message?: string; error?: string } | null>(null)
  const run = (fn: () => ReturnType<typeof addTeamMember>, onOk?: () => void) =>
    start(async () => {
      const res = await fn()
      setResult(res)
      if (res.ok) {
        onOk?.()
        router.refresh()
      }
    })

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-5">
      <ul className="flex flex-col divide-y text-sm">
        {members.map((m) => (
          <li key={m.user_id} className="flex items-center gap-3 py-2.5">
            <span className="flex-1 break-all">
              {m.email}
              {m.user_id === currentUserId ? <span className="text-muted-foreground"> (you)</span> : null}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{m.role}</span>
            {isOwner && m.user_id !== currentUserId ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                disabled={pending}
                onClick={() => confirm(`Remove access for ${m.email}?`) && run(() => removeTeamMember(m.user_id))}
              >
                Remove
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {isOwner ? (
        <form
          className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault()
            const form = e.currentTarget
            const f = new FormData(form)
            run(() => addTeamMember(String(f.get('email')), String(f.get('role'))), () => form.reset())
          }}
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="team-email">Team member email</Label>
            <Input id="team-email" name="email" type="email" required placeholder="They must create an account first" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="team-role">Role</Label>
            <select id="team-role" name="role" defaultValue="staff" className={selectClass}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <Button type="submit" disabled={pending}>
            Grant access
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">Only owners can add or remove team members.</p>
      )}
      <FormMessage result={result} />
    </div>
  )
}
