'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addRoomBlock } from '@/app/actions/admin-bookings'
import { FormMessage, selectClass } from './form-bits'

export function RoomBlockForm({ rooms }: { rooms: { id: string; name: string }[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message?: string; error?: string } | null>(null)

  return (
    <form
      className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_1fr_1.5fr_auto] lg:items-end"
      onSubmit={(e) => {
        e.preventDefault()
        const form = e.currentTarget
        const f = new FormData(form)
        start(async () => {
          const res = await addRoomBlock({
            roomId: String(f.get('room')),
            start: String(f.get('start')),
            end: String(f.get('end')),
            kind: String(f.get('kind')),
            note: String(f.get('note') ?? ''),
          })
          setResult(res)
          if (res.ok) {
            form.reset()
            router.refresh()
          }
        })
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="blk-room">Room</Label>
        <select id="blk-room" name="room" required className={selectClass}>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="blk-start">From</Label>
        <Input id="blk-start" name="start" type="date" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="blk-end">Until (exclusive)</Label>
        <Input id="blk-end" name="end" type="date" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="blk-kind">Reason</Label>
        <select id="blk-kind" name="kind" className={selectClass} defaultValue="maintenance">
          <option value="maintenance">Maintenance</option>
          <option value="block">Owner / other block</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="blk-note">Note</Label>
        <Input id="blk-note" name="note" placeholder="e.g. AC service" />
      </div>
      <Button type="submit" disabled={pending}>
        Block dates
      </Button>
      <div className="sm:col-span-2 lg:col-span-6">
        <FormMessage result={result} />
      </div>
    </form>
  )
}
