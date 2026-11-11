'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { setRoomTypeAmenities } from '@/app/actions/admin'
import { FormMessage } from './form-bits'

export function AmenityAssigner({
  roomTypeId,
  amenities,
  selected,
}: {
  roomTypeId: string
  amenities: { id: string; name: string }[]
  selected: string[]
}) {
  const router = useRouter()
  const [chosen, setChosen] = useState(new Set(selected))
  const [pending, start] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message?: string; error?: string } | null>(null)

  if (amenities.length === 0) return null
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Room amenities ({chosen.size})</summary>
      <fieldset className="mt-3 flex flex-col gap-3">
        <legend className="sr-only">Amenities in this room type</legend>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {amenities.map((a) => (
            <label key={a.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4 accent-[var(--gold)]"
                checked={chosen.has(a.id)}
                onChange={(e) => {
                  const next = new Set(chosen)
                  if (e.target.checked) next.add(a.id)
                  else next.delete(a.id)
                  setChosen(next)
                }}
              />
              {a.name}
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await setRoomTypeAmenities(roomTypeId, [...chosen])
                setResult(res)
                if (res.ok) router.refresh()
              })
            }
          >
            Save amenities
          </Button>
          <FormMessage result={result} />
        </div>
      </fieldset>
    </details>
  )
}
