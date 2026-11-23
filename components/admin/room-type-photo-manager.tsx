'use client'

import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import { ImagePlus, Loader2, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { addRoomTypePhoto, deleteRoomTypePhoto } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { FormMessage } from './form-bits'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export interface AdminRoomPhoto {
  id: string
  url: string
  alt: string
  sort: number
  room_type_id: string
}

export function RoomTypePhotoManager({
  roomTypeId,
  roomName,
  photos,
}: {
  roomTypeId: string
  roomName: string
  photos: AdminRoomPhoto[]
}) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [alt, setAlt] = useState(`${roomName} photo`)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message?: string; error?: string } | null>(null)

  async function upload(file: File) {
    setResult(null)
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setResult({ ok: false, error: 'Use a JPG, PNG, WebP or AVIF image.' })
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setResult({ ok: false, error: 'Images must be under 8 MB.' })
      return
    }

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const storagePath = `rooms/${roomTypeId}/${crypto.randomUUID()}.${ext}`
    try {
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(storagePath, file, { contentType: file.type })
      if (uploadError) throw uploadError

      const url = supabase.storage.from('media').getPublicUrl(storagePath).data.publicUrl
      const response = await addRoomTypePhoto({ roomTypeId, url, storagePath, alt })
      if (!response.ok) {
        await supabase.storage.from('media').remove([storagePath])
        setResult(response)
        return
      }
      setResult(response)
      setAlt(`${roomName} photo`)
      router.refresh()
    } catch (error) {
      console.error('[admin] room photo upload failed', error)
      setResult({ ok: false, error: 'Upload failed. Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  function remove(photoId: string) {
    if (!confirm('Remove this room photo? This cannot be undone.')) return
    setResult(null)
    startTransition(async () => {
      const response = await deleteRoomTypePhoto(photoId)
      setResult(response)
      if (response.ok) router.refresh()
    })
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => dialogRef.current?.showModal()}>
        <ImagePlus aria-hidden="true" />
        Photos ({photos.length})
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`photos-${roomTypeId}`}
        className="m-auto w-[min(92vw,48rem)] rounded-xl border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-ink/70"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close()
        }}
      >
        <div className="flex max-h-[85vh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-border p-5">
            <div>
              <h2 id={`photos-${roomTypeId}`} className="font-serif text-2xl">{roomName} photos</h2>
              <p className="mt-1 text-sm text-muted-foreground">The first photo is used as the main room image.</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => dialogRef.current?.close()} aria-label="Close photos">
              <X aria-hidden="true" />
            </Button>
          </header>

          <div className="overflow-y-auto p-5">
            <div className="mb-5 grid gap-3 rounded-lg border border-border bg-muted/40 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`photo-alt-${roomTypeId}`}>Photo description</Label>
                <Input
                  id={`photo-alt-${roomTypeId}`}
                  value={alt}
                  maxLength={300}
                  onChange={(event) => setAlt(event.target.value)}
                  placeholder={`${roomName} interior`}
                />
              </div>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void upload(file)
                  event.target.value = ''
                }}
              />
              <Button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
                {uploading ? 'Uploading…' : 'Upload photo'}
              </Button>
              <div className="sm:col-span-2"><FormMessage result={result} /></div>
            </div>

            {photos.length === 0 ? (
              <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No photos uploaded yet.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((photo, index) => (
                  <li key={photo.id} className="overflow-hidden rounded-lg border border-border bg-background">
                    <div className="relative aspect-square bg-muted">
                      <Image src={photo.url} alt={photo.alt} fill sizes="240px" className="object-cover" />
                      {index === 0 ? (
                        <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2 py-1 text-xs font-medium text-ink-foreground">Main photo</span>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2">
                      <p className="min-w-0 truncate text-xs text-muted-foreground" title={photo.alt}>{photo.alt}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={pending || uploading}
                        onClick={() => remove(photo.id)}
                        aria-label={`Remove ${photo.alt}`}
                      >
                        <Trash2 className="text-destructive" aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </dialog>
    </>
  )
}
