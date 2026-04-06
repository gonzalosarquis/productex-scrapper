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
  avgRating: number
  avgReviews: number
  byStatus: Record<Brand['status'], number>
  byCity: Record<string, number>
  ratingDistribution: { label: string; count: number }[]
  topBrands: Brand[]
  contactRate: number
  conversionRate: number
}

export function calculateAnalytics(brands: Brand[]): AnalyticsResult {
  const totalBrands = brands.length

  const withRating = brands.filter((b) => b.rating != null)
  const avgRating =
    withRating.length > 0
      ? withRating.reduce((s, b) => s + (b.rating as number), 0) /
        withRating.length
      : 0

  const avgReviews =
    totalBrands > 0
      ? brands.reduce((s, b) => s + (b.reviews_count ?? 0), 0) /
        totalBrands
      : 0

  const byStatus = {} as Record<Brand['status'], number>
  for (const s of ALL_STATUSES) {
    byStatus[s] = 0
  }
  for (const b of brands) {
    byStatus[b.status] = (byStatus[b.status] ?? 0) + 1
  }

  const cityCounts: Record<string, number> = {}
  for (const b of brands) {
    const key = b.city?.trim() || 'Sin ciudad'
    cityCounts[key] = (cityCounts[key] ?? 0) + 1
  }
  const byCity = Object.fromEntries(
    Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  )

  let r0 = 0
  let r1 = 0
  let r2 = 0
  let r3 = 0
  for (const b of brands) {
    const r = b.rating ?? 0
    if (r < 2) r0++
    else if (r < 3.5) r1++
    else if (r < 4.5) r2++
    else r3++
  }
  const ratingDistribution = [
    { label: '0–2', count: r0 },
    { label: '2–3.5', count: r1 },
    { label: '3.5–4.5', count: r2 },
    { label: '4.5–5', count: r3 },
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
    avgRating,
    avgReviews,
    byStatus,
    byCity,
    ratingDistribution,
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
    'name',
    'city',
    'rating',
    'reviews_count',
    'phone',
    'instagram_url',
    'website',
    'google_maps_url',
    'category',
    'status',
    'score',
    'created_at',
  ]
  const lines = [headers.join(',')]
  for (const b of brands) {
    lines.push(
      [
        csvCell(b.name),
        csvCell(b.city),
        csvCell(b.rating),
        csvCell(b.reviews_count),
        csvCell(b.phone),
        csvCell(b.instagram_url),
        csvCell(b.website),
        csvCell(b.google_maps_url),
        csvCell(b.category),
        csvCell(b.status),
        csvCell(b.score),
        csvCell(b.created_at),
      ].join(',')
    )
  }
  return lines.join('\n')
}
