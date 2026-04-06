import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-zinc-600">
        Panel principal — contenido en fases siguientes.
      </p>
      <p className="mt-4 text-sm text-zinc-500">
        Sesión: {user.email ?? user.id}
      </p>
    </main>
  )
}
