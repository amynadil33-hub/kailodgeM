'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { saveSiteContent, saveSettings } from '@/app/actions/admin'
import type { ContentField } from '@/lib/content-schema'
import type { FieldDef } from '@/lib/admin/resources'
import { FieldControl, FormMessage, ImageInput, formValues } from './form-bits'

type Result = { ok: boolean; message?: string; error?: string } | null

export function ContentEditor({ fields, values }: { fields: ContentField[]; values: Record<string, string> }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [result, setResult] = useState<Result>(null)
  const pages = [...new Set(fields.map((f) => f.page))]

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const data = Object.fromEntries(fields.map((field) => [field.key, String(f.get(field.key) ?? '')]))
        start(async () => {
          const res = await saveSiteContent(data)
          setResult(res)
          if (res.ok) router.refresh()
        })
      }}
    >
      {pages.map((page) => (
        <fieldset key={page} className="flex flex-col gap-4 rounded-lg border bg-card p-5">
          <legend className="px-1 font-serif text-lg">{page}</legend>
          {fields
            .filter((f) => f.page === page)
            .map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <Label htmlFor={`c-${f.key}`}>{f.label}</Label>
                {f.type === 'textarea' ? (
                  <Textarea id={`c-${f.key}`} name={f.key} defaultValue={values[f.key] ?? f.default} rows={4} />
                ) : f.type === 'image' ? (
                  <ImageInput id={`c-${f.key}`} name={f.key} defaultValue={values[f.key] ?? f.default} />
                ) : (
                  <Input id={`c-${f.key}`} name={f.key} defaultValue={values[f.key] ?? f.default} />
                )}
              </div>
            ))}
        </fieldset>
      ))}
      <div className="sticky bottom-0 flex items-center gap-4 border-t bg-muted/90 py-4 backdrop-blur">
        <Button type="submit" disabled={pending}>
          {pending ? 'Publishing…' : 'Publish changes'}
        </Button>
        <FormMessage result={result} />
      </div>
    </form>
  )
}

export function SettingsForm({ fields, values }: { fields: FieldDef[]; values: Record<string, unknown> }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [result, setResult] = useState<Result>(null)

  return (
    <form
      className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        const data = formValues(e.currentTarget, fields)
        start(async () => {
          const res = await saveSettings(data)
          setResult(res)
          if (res.ok) router.refresh()
        })
      }}
    >
      {fields.map((f) => (
        <div key={f.name} className={f.wide || f.type === 'textarea' ? 'sm:col-span-2' : undefined}>
          <FieldControl field={f} value={values[f.name]} idPrefix="settings" />
        </div>
      ))}
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          Save settings
        </Button>
        <FormMessage result={result} />
      </div>
    </form>
  )
}
