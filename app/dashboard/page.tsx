import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'

import { DashboardContent } from '@/components/DashboardContent'
import { createClient } from '@/lib/supabase/server'

const AnalyticsPanel = dynamic(
  () => import('@/components/AnalyticsPanel'),
  { loading: () => <div>Cargando...</div> }
)

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <DashboardContent
      user={user}
      analyticsPanel={<AnalyticsPanel />}
    />
  )
}
