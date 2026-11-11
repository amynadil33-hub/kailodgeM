'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteRecord, saveRecord } from '@/app/actions/admin'
import { FieldControl, FormMessage, formValues } from './form-bits'
import { cn } from '@/lib/utils'
import type { FieldDef } from '@/lib/admin/resources'

type Row = Record<string, unknown> & { id: string }

export interface Column {
  key: string
  label: string
  format?: 'money' | 'bool' | 'date' | 'image'
}

export function RecordManager({
  resource,
  singular,
  fields,
  rows,
  columns,
  refOptions,
  canDelete = true,
  currency,
  extra,
}: {
  resource: string
  singular: string
  fields: FieldDef[]
  rows: Row[]
  columns: Column[]
  refOptions?: { value: string; label: string }[]
  canDelete?: boolean
  currency?: string
  extra?: (row: Row) => React.ReactNode
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [result, setResult] = useState<{ ok: boolean; message?: string; error?: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const refLabel = (v: unknown) => refOptions?.find((o) => o.value === v)?.label ?? '—'

  function display(row: Row, col: Column) {
    const v = row[col.key]
    if (col.format === 'bool') return v ? 'Yes' : 'No'
    if (v === null || v === undefined || v === '') return '—'
    if (col.format === 'money') return `${currency ?? ''} ${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`.trim()
    if (fields.find((f) => f.name === col.key)?.ref) return refLabel(v)
    return String(v)
  }

  function submit(form: HTMLFormElement, id: string | null) {
    const values = formValues(form, fields)
    startTransition(async () => {
      const res = await saveRecord(resource, id, values)
      setResult(res)
      if (res.ok) {
        setEditing(null)
        router.refresh()
      }
    })
  }

  function remove(id: string) {
    if (!confirm(`Delete this ${singular}? This cannot be undone.`)) return
    startTransition(async () => {
      const res = await deleteRecord(resource, id)
      setResult(res)
      if (res.ok) router.refresh()
    })
  }

  const editor = (row: Row | null) => (
    <form
      className="grid gap-4 rounded-lg border border-gold/40 bg-card p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        submit(e.currentTarget, row?.id ?? null)
      }}
    >
      <div className="flex items-center justify-between sm:col-span-2">
        <h3 className="font-serif text-lg">{row ? `Edit ${singular}` : `New ${singular}`}</h3>
        <Button type="button" variant="ghost" size="icon" onClick={() => setEditing(null)} aria-label="Close editor">
          <X aria-hidden="true" />
        </Button>
      </div>
      {fields.map((f) => (
        <div key={f.name} className={cn(f.wide || f.type === 'textarea' || f.type === 'image' ? 'sm:col-span-2' : undefined)}>
          <FieldControl field={f} value={row ? row[f.name] : f.type === 'boolean' ? true : ''} refOptions={refOptions} idPrefix={row?.id ?? 'new'} />
        </div>
      ))}
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" onClick={() => setEditing(null)}>
          Cancel
        </Button>
      </div>
    </form>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FormMessage result={result} />
        <Button
          className="ml-auto"
          onClick={() => {
            setResult(null)
            setEditing('new')
          }}
        >
          <Plus aria-hidden="true" />
          Add {singular}
        </Button>
      </div>

      {editing === 'new' ? editor(null) : null}

      {rows.length === 0 && editing !== 'new' ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nothing here yet.</p>
      ) : null}

      <ul className="flex flex-col divide-y rounded-lg border bg-card">
        {rows.map((row) =>
          editing === row.id ? (
            <li key={row.id} className="p-2">
              {editor(row)}
            </li>
          ) : (
            <li key={row.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
              <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4">
                {columns.map((col, i) => (
                  <div key={col.key} className={cn('min-w-0', i === 0 && 'col-span-2 md:col-span-1')}>
                    <dt className="text-xs text-muted-foreground">{col.label}</dt>
                    <dd className={cn('truncate', i === 0 && 'font-medium')}>{display(row, col)}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex items-center gap-2">
                {extra?.(row)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResult(null)
                    setEditing(row.id)
                  }}
                >
                  <Pencil aria-hidden="true" />
                  Edit
                </Button>
                {canDelete ? (
                  <Button variant="ghost" size="icon" onClick={() => remove(row.id)} disabled={pending} aria-label={`Delete ${singular}`}>
                    <Trash2 className="text-destructive" aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  )
}
