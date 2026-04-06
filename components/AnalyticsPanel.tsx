'use client'

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { Download, Loader2, PieChart as PieChartIcon, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useBrands } from '@/hooks/useBrands'
import { calculateAnalytics, generateCSVReport } from '@/lib/analytics'
import type { Brand } from '@/lib/types'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
const BAR_FILL = '#27272a'

type Period = '7d' | '30d' | 'all'

function filterByPeriod(brands: Brand[], period: Period): Brand[] {
  if (period === 'all') return brands
  const days = period === '7d' ? 7 : 30
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return brands.filter((b) => {
    const t = new Date(b.created_at).getTime()
    return Number.isFinite(t) && t >= cutoff
  })
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AnalyticsPanel() {
  const { brands, loading } = useBrands()
  const [period, setPeriod] = useState<Period>('all')

  const filtered = useMemo(
    () => filterByPeriod(brands, period),
    [brands, period]
  )

  const metrics = useMemo(
    () => calculateAnalytics(filtered),
    [filtered]
  )

  const statusChartData = useMemo(
    () =>
      (['pending', 'contacted', 'interested', 'rejected', 'client'] as const).map(
        (s) => ({
          name: s,
          value: metrics.byStatus[s],
        })
      ),
    [metrics.byStatus]
  )

  const pieData = useMemo(() => {
    return Object.entries(metrics.byCity)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }))
  }, [metrics.byCity])

  const hasAnyBrand = filtered.length > 0
  const hasStatusData = statusChartData.some((d) => d.value > 0)
  const hasPieData = pieData.some((d) => d.value > 0)

  function handleExportCsv() {
    try {
      const csv = generateCSVReport(filtered)
      downloadCsv(csv, `productex-analytics-${Date.now()}.csv`)
      toast.success('CSV descargado')
    } catch {
      toast.error('No se pudo exportar')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Analytics
          </h1>
          <p className="text-sm text-zinc-500">
            Métricas basadas en marcas importadas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="all">Todo</option>
          </select>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!hasAnyBrand}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total Marcas"
              value={metrics.totalBrands}
            />
            <KpiCard
              label="Rating promedio"
              value={metrics.avgRating.toFixed(2)}
            />
            <KpiCard
              label="Tasa de contacto"
              value={`${metrics.contactRate.toFixed(1)}%`}
            />
            <KpiCard
              label="Tasa de conversión"
              value={`${metrics.conversionRate.toFixed(1)}%`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Distribución por estado" icon={BarChart3}>
              {!hasStatusData ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e4e4e7',
                      }}
                    />
                    <Bar
                      dataKey="value"
                      name="Tiendas"
                      fill={BAR_FILL}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Top ciudades" icon={PieChartIcon}>
              {!hasPieData ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                    >
                      {pieData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Top 10 marcas por score
            </h2>
            {!hasAnyBrand ? (
              <p className="py-8 text-center text-sm text-zinc-500">Sin datos</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="pb-2 pr-4 font-medium">#</th>
                      <th className="pb-2 pr-4 font-medium">Usuario</th>
                      <th className="pb-2 pr-4 font-medium">Score</th>
                      <th className="pb-2 pr-4 font-medium">Seguidores</th>
                      <th className="pb-2 font-medium">Engagement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {metrics.topBrands.map((b, i) => (
                      <tr key={b.id}>
                        <td className="py-2 pr-4 tabular-nums text-zinc-500">
                          {i + 1}
                        </td>
                        <td className="py-2 pr-4 font-medium">{b.name}</td>
                        <td className="py-2 pr-4 tabular-nums">{b.score}</td>
                        <td className="py-2 pr-4 tabular-nums">
                          {b.rating != null ? b.rating.toFixed(1) : '—'}
                        </td>
                        <td className="py-2 tabular-nums">
                          {b.reviews_count != null ? b.reviews_count : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  )
}

function ChartCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof BarChart3
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-zinc-500" />
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-zinc-500">
      Sin datos
    </div>
  )
}
