'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  BarChart3,
  LayoutDashboard,
  Search,
  Users,
} from 'lucide-react'

import { BrandsList } from '@/components/BrandsList'
import { ConfigModal } from '@/components/ConfigModal'
import { DashboardHeader } from '@/components/DashboardHeader'
import { DashboardStats } from '@/components/DashboardStats'
import { SearchForm } from '@/components/SearchForm'
import { SearchResults } from '@/components/SearchResults'
import { createClient } from '@/lib/supabase/client'

type Tab = 'overview' | 'search' | 'results' | 'analytics'

type DashboardContentProps = {
  user: User
  analyticsPanel: ReactNode
}

export function DashboardContent({ user, analyticsPanel }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [configOpen, setConfigOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'search', label: 'Nueva Búsqueda', icon: Search },
    { id: 'results', label: 'Marcas Encontradas', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-950 md:flex-row">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform dark:border-zinc-800 dark:bg-zinc-950 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Productex Scrapper
          </p>
          <p className="truncate text-xs text-zinc-500">Panel</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveTab(id)
                setSidebarOpen(false)
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                activeTab === id
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <DashboardHeader
          user={user}
          onConfigClick={() => setConfigOpen(true)}
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-auto p-4 md:p-8">
          {activeTab === 'overview' && (
            <div className="mx-auto max-w-6xl space-y-10">
              <DashboardStats />
              <section>
                <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Últimas búsquedas
                </h2>
                <SearchResults />
              </section>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="mx-auto max-w-6xl">
              <SearchForm />
            </div>
          )}

          {activeTab === 'results' && (
            <div className="mx-auto max-w-7xl">
              <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Marcas encontradas
              </h1>
              <BrandsList />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="mx-auto w-full max-w-6xl">{analyticsPanel}</div>
          )}
        </main>
      </div>

      <ConfigModal isOpen={configOpen} onClose={() => setConfigOpen(false)} />
    </div>
  )
}
