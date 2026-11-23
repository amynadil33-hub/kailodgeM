'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from 'lucide-react'
import { importKaiLodgeCatalogue } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { FormMessage } from './form-bits'

export function RoomCatalogueBootstrap({
  resource,
  canImport,
  loadError,
}: {
  resource: 'room_types' | 'rooms'
  canImport: boolean
  loadError?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message?: string; error?: string } | null>(null)
  const roomTypes = resource === 'room_types'

  return (
    <section className="mb-6 flex flex-col gap-3 rounded-lg border border-gold/40 bg-card p-5" aria-labelledby="catalogue-setup">
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <h2 id="catalogue-setup" className="font-serif text-xl">
            {loadError ? 'Room data could not be read' : roomTypes ? 'Load the Kai Lodge room catalogue' : 'Add the physical rooms'}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {loadError
              ? 'The public photos are separate from Supabase inventory. Apply the latest Data API grants migration, then reload this page.'
              : roomTypes
                ? 'The public website can display room photos before database inventory exists. Import the three Kai Lodge categories, their prices, amenities and photographs.'
                : 'Bookings need one physical room record for every real room. The importer adds safe, inactive placeholders for you to rename before activation.'}
          </p>
        </div>
      </div>
      {!loadError && canImport ? (
        <Button
          className="self-start"
          disabled={pending}
          onClick={() => {
            setResult(null)
            startTransition(async () => {
              const response = await importKaiLodgeCatalogue()
              setResult(response)
              if (response.ok) router.refresh()
            })
          }}
        >
          <Database aria-hidden="true" />
          {pending ? 'Loading catalogue…' : 'Load Kai Lodge catalogue'}
        </Button>
      ) : null}
      {!loadError && !canImport ? (
        <p className="text-sm text-muted-foreground">An owner with the Supabase server secret configured can run this import.</p>
      ) : null}
      <FormMessage result={result} />
    </section>
  )
}
