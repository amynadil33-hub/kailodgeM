'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createAdminBooking } from '@/app/actions/admin-bookings'
import { FormMessage, selectClass } from './form-bits'

interface RoomType {
  id: string
  name: string
  rooms: { id: string; name: string }[]
}

export function NewBookingForm({ roomTypes, today }: { roomTypes: RoomType[]; today: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message?: string; error?: string } | null>(null)
  const [typeId, setTypeId] = useState(roomTypes[0]?.id ?? '')
  const rooms = roomTypes.find((t) => t.id === typeId)?.rooms ?? []

  return (
    <form
      className="flex max-w-3xl flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const s = (k: string) => String(f.get(k) ?? '')
        start(async () => {
          const res = await createAdminBooking({
            roomTypeId: typeId,
            roomId: s('room') || undefined,
            checkIn: s('check_in'),
            checkOut: s('check_out'),
            adults: Number(s('adults')),
            children: Number(s('children')),
            fullName: s('full_name'),
            email: s('email'),
            phone: s('phone'),
            country: s('country'),
            source: s('source'),
            confirm: f.get('confirm') === 'on',
            discountCode: s('discount'),
            specialRequests: s('special_requests'),
            adminNotes: s('admin_notes'),
          })
          setResult(res)
          if (res.ok && res.id) router.push(`/admin/reservations/${res.id}`)
        })
      }}
    >
      <fieldset className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-2">
        <legend className="px-1 font-serif text-lg">Stay</legend>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nb-type">Room type</Label>
          <select id="nb-type" value={typeId} onChange={(e) => setTypeId(e.target.value)} className={selectClass} required>
            {roomTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nb-room">Room</Label>
          <select id="nb-room" name="room" className={selectClass} key={typeId}>
            <option value="">Assign automatically</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nb-in">Check-in</Label>
          <Input id="nb-in" name="check_in" type="date" min={today} defaultValue={today} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nb-out">Check-out</Label>
          <Input id="nb-out" name="check_out" type="date" min={today} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nb-adults">Adults</Label>
          <Input id="nb-adults" name="adults" type="number" min={1} max={10} defaultValue={2} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nb-children">Children</Label>
          <Input id="nb-children" name="children" type="number" min={0} max={10} defaultValue={0} required />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-2">
        <legend className="px-1 font-serif text-lg">Guest</legend>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="nb-name">Full name</Label>
          <Input id="nb-name" name="full_name" required autoComplete="off" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nb-phone">Phone / WhatsApp</Label>
          <Input id="nb-phone" name="phone" type="tel" placeholder="+960…" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nb-email">Email</Label>
          <Input id="nb-email" name="email" type="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nb-country">Country</Label>
          <Input id="nb-country" name="country" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nb-source">Booked via</Label>
          <select id="nb-source" name="source" defaultValue="whatsapp" className={selectClass}>
            <option value="whatsapp">WhatsApp</option>
            <option value="walk_in">Walk-in</option>
            <option value="phone">Phone</option>
            <option value="admin">Other</option>
          </select>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-2">
        <legend className="px-1 font-serif text-lg">Details</legend>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nb-discount">Offer code</Label>
          <Input id="nb-discount" name="discount" placeholder="Optional" />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" name="confirm" defaultChecked className="size-4 accent-[var(--gold)]" />
          Confirm immediately (skip the payment hold)
        </label>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="nb-requests">Guest requests</Label>
          <Textarea id="nb-requests" name="special_requests" rows={2} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="nb-notes">Internal notes</Label>
          <Textarea id="nb-notes" name="admin_notes" rows={2} />
        </div>
      </fieldset>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create booking'}
        </Button>
        <FormMessage result={result} />
      </div>
    </form>
  )
}
