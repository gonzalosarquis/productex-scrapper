import type { Brand } from '@/lib/types'

const ALL_STATUSES: Brand['status'][] = [
  'pending',
  'contacted',
  'interested',
  'rejected',
  'client',
]

export type AnalyticsResult = {
  totalBrands: number
  avgEngagement: number
  avgFollowers: number
  byStatus: Record<Brand['status'], number>
  byCountry: Record<string, number>
  engagementDistribution: { label: string; count: number }[]
  topBrands: Brand[]
  contactRate: number
  conversionRate: number
}

export function calculateAnalytics(brands: Brand[]): AnalyticsResult {
  const totalBrands = brands.length

  const withEngagement = brands.filter((b) => b.engagement_rate != null)
  const avgEngagement =
    withEngagement.length > 0
      ? withEngagement.reduce(
          (s, b) => s + (b.engagement_rate as number),
          0
        ) / withEngagement.length
      : 0

  const avgFollowers =
    totalBrands > 0
      ? brands.reduce((s, b) => s + b.followers, 0) / totalBrands
      : 0

  const byStatus = {} as Record<Brand['status'], number>
  for (const s of ALL_STATUSES) {
    byStatus[s] = 0
  }
  for (const b of brands) {
    byStatus[b.status] = (byStatus[b.status] ?? 0) + 1
  }

  const countryCounts: Record<string, number> = {}
  for (const b of brands) {
    const key = b.country?.trim() || 'Sin país'
    countryCounts[key] = (countryCounts[key] ?? 0) + 1
  }
  const byCountry = Object.fromEntries(
    Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  )

  let b0 = 0
  let b1 = 0
  let b2 = 0
  let b3 = 0
  for (const b of brands) {
    const e = b.engagement_rate ?? 0
    if (e < 1) b0++
    else if (e < 3) b1++
    else if (e < 5) b2++
    else b3++
  }
  const engagementDistribution = [
    { label: '0-1%', count: b0 },
    { label: '1-3%', count: b1 },
    { label: '3-5%', count: b2 },
    { label: '5%+', count: b3 },
  ]

  const topBrands = [...brands]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  const contactedLike = brands.filter((b) =>
    ['contacted', 'interested', 'client'].includes(b.status)
  ).length
  const clients = brands.filter((b) => b.status === 'client').length
  const contactRate =
    totalBrands > 0 ? (contactedLike / totalBrands) * 100 : 0
  const conversionRate =
    totalBrands > 0 ? (clients / totalBrands) * 100 : 0

  return {
    totalBrands,
    avgEngagement,
    avgFollowers,
    byStatus,
    byCountry,
    engagementDistribution,
    topBrands,
    contactRate,
    conversionRate,
  }
}

function csvCell(v: string | number | null | undefined): string {
  const s =
    v === null || v === undefined
      ? ''
      : typeof v === 'number'
        ? String(v)
        : String(v)
  return `"${s.replace(/"/g, '""')}"`
}

export function generateCSVReport(brands: Brand[]): string {
  const headers = [
    'username',
    'full_name',
    'followers',
    'engagement_rate',
    'email',
    'phone',
    'country',
    'status',
    'score',
    'created_at',
  ]
  const lines = [headers.join(',')]
  for (const b of brands) {
    lines.push(
      [
        csvCell(b.username),
        csvCell(b.full_name),
        csvCell(b.followers),
        csvCell(
          b.engagement_rate != null ? b.engagement_rate.toFixed(4) : ''
        ),
        csvCell(b.email),
        csvCell(b.phone),
        csvCell(b.country),
        csvCell(b.status),
        csvCell(b.score),
        csvCell(b.created_at),
      ].join(',')
    )
  }
  return lines.join('\n')
}
