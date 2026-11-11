'use server'

import { revalidatePath } from 'next/cache'
import { adminForAction, AdminActionError } from '@/lib/admin/auth'
import { isResourceKey, RESOURCES, type FieldDef } from '@/lib/admin/resources'
import { isISODate } from '@/lib/format'
import { CONTENT_FIELDS } from '@/lib/content-schema'

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string }

function fail(error: unknown): ActionResult {
  if (error instanceof AdminActionError) return { ok: false, error: error.message }
  const e = error as { code?: string; message?: string }
  if (e?.code === '23505') return { ok: false, error: 'That value is already in use. Please choose another.' }
  if (e?.code === '23503') return { ok: false, error: 'This record is still referenced elsewhere and cannot be removed.' }
  if (e?.code === '23514') return { ok: false, error: 'One of the values is outside the allowed range.' }
  console.error('[admin] action failed', e?.code, e?.message)
  return { ok: false, error: 'Something went wrong. Please try again.' }
}

function refreshSite() {
  revalidatePath('/', 'layout')
}

function coerce(field: FieldDef, raw: unknown): { value: unknown } | { error: string } {
  const str = typeof raw === 'string' ? raw.trim() : raw
  const empty = str === '' || str === null || str === undefined

  if (field.type === 'boolean') return { value: str === true || str === 'true' || str === 'on' }
  if (empty) return field.required ? { error: `${field.label} is required.` } : { value: null }
  if (typeof str !== 'string') return { error: `${field.label} is invalid.` }

  switch (field.type) {
    case 'number': {
      const n = Number(str)
      if (!Number.isFinite(n)) return { error: `${field.label} must be a number.` }
      if (field.min !== undefined && n < field.min) return { error: `${field.label} must be at least ${field.min}.` }
      if (field.max !== undefined && n > field.max) return { error: `${field.label} must be at most ${field.max}.` }
      if (field.step === '1' && !Number.isInteger(n)) return { error: `${field.label} must be a whole number.` }
      return { value: n }
    }
    case 'date':
      return isISODate(str) ? { value: str } : { error: `${field.label} must be a valid date.` }
    case 'slug':
      return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(str) && str.length <= 80
        ? { value: str }
        : { error: `${field.label} may only contain lowercase letters, numbers and dashes.` }
    case 'code': {
      const code = str.toUpperCase()
      return /^[A-Z0-9-]{3,32}$/.test(code) ? { value: code } : { error: `${field.label} must be 3–32 letters, numbers or dashes.` }
    }
    case 'select':
      if (field.options && !field.options.some((o) => o.value === str)) return { error: `${field.label} is invalid.` }
      if (field.ref && !/^[0-9a-f-]{36}$/i.test(str)) return { error: `${field.label} is invalid.` }
      return { value: str }
    case 'image':
      if (str.length > 2048 || !(str.startsWith('/') || /^https:\/\//.test(str))) {
        return { error: `${field.label} must be an uploaded image or an https:// link.` }
      }
      return { value: str }
    default:
      return str.length > (field.type === 'textarea' ? 5000 : 300)
        ? { error: `${field.label} is too long.` }
        : { value: str }
  }
}

export async function saveRecord(resource: string, id: string | null, values: Record<string, unknown>): Promise<ActionResult> {
  try {
    if (!isResourceKey(resource)) return { ok: false, error: 'Unknown record type.' }
    const { supabase } = await adminForAction()
    const def = RESOURCES[resource]
    const row: Record<string, unknown> = {}
    for (const field of def.fields as FieldDef[]) {
      const result = coerce(field, values[field.name])
      if ('error' in result) return { ok: false, error: result.error }
      row[field.name] = result.value
    }
    if (resource === 'rate_periods' && String(row.ends_on) < String(row.starts_on)) {
      return { ok: false, error: 'The last night must be on or after the first night.' }
    }
    if (resource === 'discounts' && row.kind === 'percent' && Number(row.value) > 100) {
      return { ok: false, error: 'A percentage discount cannot exceed 100.' }
    }
    if (resource === 'discounts' && row.valid_from && row.valid_to && String(row.valid_to) < String(row.valid_from)) {
      return { ok: false, error: '"Valid to" must be on or after "Valid from".' }
    }

    const query = id
      ? supabase.from(def.table).update(row).eq('id', id)
      : supabase.from(def.table).insert(row)
    const { error } = await query
    if (error) return fail(error)
    refreshSite()
    return { ok: true, message: `${def.singular[0].toUpperCase()}${def.singular.slice(1)} saved.` }
  } catch (e) {
    return fail(e)
  }
}

export async function deleteRecord(resource: string, id: string): Promise<ActionResult> {
  try {
    if (!isResourceKey(resource) || resource === 'customers') return { ok: false, error: 'This record cannot be deleted here.' }
    const { supabase } = await adminForAction()
    const { error } = await supabase.from(RESOURCES[resource].table).delete().eq('id', id)
    if (error) return fail(error)
    refreshSite()
    return { ok: true, message: 'Deleted.' }
  } catch (e) {
    return fail(e)
  }
}

export async function setRoomTypeAmenities(roomTypeId: string, amenityIds: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await adminForAction()
    const ids = [...new Set(amenityIds)].filter((v) => /^[0-9a-f-]{36}$/i.test(v)).slice(0, 100)
    const { error: delError } = await supabase.from('room_type_amenities').delete().eq('room_type_id', roomTypeId)
    if (delError) return fail(delError)
    if (ids.length) {
      const { error } = await supabase
        .from('room_type_amenities')
        .insert(ids.map((amenity_id) => ({ room_type_id: roomTypeId, amenity_id })))
      if (error) return fail(error)
    }
    refreshSite()
    return { ok: true, message: 'Amenities updated.' }
  } catch (e) {
    return fail(e)
  }
}

export async function saveSiteContent(values: Record<string, string>): Promise<ActionResult> {
  try {
    const { supabase } = await adminForAction()
    const rows = CONTENT_FIELDS.map((f) => ({
      key: f.key,
      value: String(values[f.key] ?? '').slice(0, f.type === 'textarea' ? 5000 : 500),
    }))
    const { error } = await supabase.from('site_content').upsert(rows, { onConflict: 'key' })
    if (error) return fail(error)
    refreshSite()
    return { ok: true, message: 'Website content published.' }
  } catch (e) {
    return fail(e)
  }
}

const SETTINGS_FIELDS: FieldDef[] = [
  { name: 'property_name', label: 'Property name', type: 'text', required: true },
  { name: 'address', label: 'Address', type: 'text', required: true },
  { name: 'phone', label: 'Phone', type: 'text', required: true },
  { name: 'whatsapp', label: 'WhatsApp number', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'text' },
  { name: 'check_in_time', label: 'Check-in time', type: 'text' },
  { name: 'check_out_time', label: 'Check-out time', type: 'text' },
  { name: 'base_currency', label: 'Currency', type: 'select', required: true, options: [{ value: 'MVR', label: 'MVR' }, { value: 'USD', label: 'USD' }] },
  { name: 'usd_to_mvr_rate', label: 'USD → MVR rate', type: 'number', min: 0.0001, max: 1000, step: '0.0001' },
  { name: 'advance_percent', label: 'Advance payment %', type: 'number', required: true, min: 0, max: 100, step: '0.01' },
  { name: 'payment_deadline_hours', label: 'Hold unpaid bookings for (hours)', type: 'number', required: true, min: 1, max: 720, step: '1' },
  { name: 'map_embed_url', label: 'Google Maps embed URL', type: 'image' },
  { name: 'policies', label: 'House rules & policies', type: 'textarea' },
  { name: 'cancellation_policy', label: 'Cancellation policy', type: 'textarea' },
  { name: 'early_late_policy', label: 'Early check-in / late check-out policy', type: 'textarea' },
]

export async function getSettingsFields() {
  return SETTINGS_FIELDS
}

export async function saveSettings(values: Record<string, unknown>): Promise<ActionResult> {
  try {
    const { supabase } = await adminForAction()
    const row: Record<string, unknown> = {}
    for (const field of SETTINGS_FIELDS) {
      const r = coerce(field, values[field.name])
      if ('error' in r) return { ok: false, error: r.error }
      row[field.name] = r.value
    }
    if (!/^\+?[0-9 ]{7,20}$/.test(String(row.whatsapp))) {
      return { ok: false, error: 'WhatsApp number should contain digits only, with the country code.' }
    }
    const { error } = await supabase.from('site_settings').update(row).eq('id', 1)
    if (error) return fail(error)
    refreshSite()
    return { ok: true, message: 'Settings saved.' }
  } catch (e) {
    return fail(e)
  }
}

export async function updateEnquiryStatus(id: string, status: string): Promise<ActionResult> {
  try {
    if (!['new', 'replied', 'closed'].includes(status)) return { ok: false, error: 'Invalid status.' }
    const { supabase } = await adminForAction()
    const { error } = await supabase.from('enquiries').update({ status }).eq('id', id)
    if (error) return fail(error)
    revalidatePath('/admin', 'layout')
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function signOutAdmin() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  await supabase.auth.signOut()
}
