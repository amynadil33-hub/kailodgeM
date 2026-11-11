'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOutAdmin } from '@/app/actions/admin'

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Button
      variant={compact ? 'ghost' : 'outline'}
      size={compact ? 'sm' : 'default'}
      disabled={pending}
      className={compact ? 'justify-start text-inherit hover:bg-ink-foreground/10 hover:text-inherit' : undefined}
      onClick={() =>
        start(async () => {
          await signOutAdmin()
          router.replace('/admin/login')
          router.refresh()
        })
      }
    >
      <LogOut aria-hidden="true" />
      Sign out
    </Button>
  )
}
