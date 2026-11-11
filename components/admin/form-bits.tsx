'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImageUp, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { FieldDef } from '@/lib/admin/resources'

export const selectClass =
  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50'

export function FormMessage({ result }: { result: { ok: boolean; message?: string; error?: string } | null }) {
  if (!result) return <p role="status" aria-live="polite" className="sr-only" />
  const text = result.ok ? result.message : result.error
  if (!text) return null
  return (
    <p role="status" aria-live="polite" className={cn('text-sm', result.ok ? 'text-emerald-700' : 'text-destructive')}>
      {text}
    </p>
  )
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export function ImageInput({ id, name, defaultValue }: { id: string; name: string; defaultValue: string }) {
  const [url, setUrl] = useState(defaultValue)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setError(null)
    if (!ACCEPTED.includes(file.type)) return setError('Use a JPG, PNG, WebP or AVIF image.')
    if (file.size > 8 * 1024 * 1024) return setError('Images must be under 8 MB.')
    setBusy(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      const path = `uploads/${crypto.randomUUID()}.${ext}`
      const { error: upError } = await supabase.storage.from('media').upload(path, file, { contentType: file.type })
      if (upError) throw upError
      setUrl(supabase.storage.from('media').getPublicUrl(path).data.publicUrl)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-md border bg-muted">
          {url ? (
            <Image src={url || '/placeholder.svg'} alt="" fill sizes="80px" className="object-cover" unoptimized={url.startsWith('http')} />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Input id={id} name={name} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… or upload" />
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED.join(',')}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void upload(f)
                e.target.value = ''
              }}
            />
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ImageUp aria-hidden="true" />}
              {busy ? 'Uploading…' : 'Upload photo'}
            </Button>
            {error ? <span className="text-xs text-destructive">{error}</span> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export function FieldControl({
  field,
  value,
  refOptions,
  idPrefix,
}: {
  field: FieldDef
  value: unknown
  refOptions?: { value: string; label: string }[]
  idPrefix: string
}) {
  const id = `${idPrefix}-${field.name}`
  const str = value === null || value === undefined ? '' : String(value)

  if (field.type === 'boolean') {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="flex h-9 items-center gap-2 text-sm font-medium">
          <input id={id} name={field.name} type="checkbox" defaultChecked={value !== false} className="size-4 accent-[var(--gold)]" />
          {field.label}
        </label>
        {field.help ? <p className="text-xs text-muted-foreground">{field.help}</p> : null}
      </div>
    )
  }

  let control: React.ReactNode
  if (field.type === 'textarea') {
    control = <Textarea id={id} name={field.name} defaultValue={str} rows={4} required={field.required} />
  } else if (field.type === 'select') {
    const options = field.ref ? (refOptions ?? []) : (field.options ?? [])
    control = (
      <select id={id} name={field.name} defaultValue={str} required={field.required} className={selectClass}>
        {!field.required || !str ? <option value="">{field.required ? 'Choose…' : 'None'}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  } else if (field.type === 'image') {
    control = <ImageInput id={id} name={field.name} defaultValue={str} />
  } else {
    control = (
      <Input
        id={id}
        name={field.name}
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
        defaultValue={str}
        required={field.required}
        min={field.min}
        max={field.max}
        step={field.step}
        placeholder={field.placeholder}
        className={field.type === 'code' ? 'font-mono uppercase' : undefined}
      />
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {field.label}
        {field.required ? <span className="text-destructive" aria-hidden="true">*</span> : null}
      </Label>
      {control}
      {field.help ? <p className="text-xs text-muted-foreground">{field.help}</p> : null}
    </div>
  )
}

export function formValues(form: HTMLFormElement, fields: FieldDef[]) {
  const data = new FormData(form)
  const values: Record<string, unknown> = {}
  for (const f of fields) {
    values[f.name] = f.type === 'boolean' ? data.get(f.name) === 'on' : (data.get(f.name) ?? '')
  }
  return values
}
