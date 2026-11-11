import 'server-only'
import { headers } from 'next/headers'

const buckets = new Map<string, { count: number; reset: number }>()

/**
 * Best-effort per-instance limiter for public forms. Serverless instances do not share memory,
 * so pair this with a shared store (e.g. Upstash Redis) if abuse becomes a problem.
 */
export async function rateLimit(scope: string, limit: number, windowMs: number) {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
  const key = `${scope}:${ip}`
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  bucket.count += 1
  return bucket.count <= limit
}
