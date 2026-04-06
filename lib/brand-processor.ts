import type { Brand } from '@/lib/types'

function str(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

function extractInstagram(item: Record<string, unknown>): string | null {
  const direct = str(item.instagram ?? item.instagramUrl ?? item.instagram_url)
  if (direct) return direct

  if (Array.isArray(item.socialMedia)) {
    for (const s of item.socialMedia) {
      if (typeof s === 'object' && s !== null) {
        const obj = s as Record<string, unknown>
        const url = str(obj.url ?? obj.link)
        if (url?.includes('instagram.com')) return url
      }
    }
  }

  const website = str(item.website ?? item.url)
  if (website?.includes('instagram.com')) return website

  const fields = [item.phone, item.address, item.website]
  for (const f of fields) {
    const s = str(f)
    if (s?.includes('instagram.com')) return s
  }

  return null
}

function computeScore(
  rating: number,
  reviewsCount: number,
  hasInstagram: boolean
): number {
  const ratingPart = (rating / 5) * 40
  const reviewsPart = Math.min(reviewsCount / 100, 1) * 30
  const instagramPart = hasInstagram ? 30 : 0
  return Math.min(100, Math.round(ratingPart + reviewsPart + instagramPart))
}

export function processBrandData(
  rawData: unknown[],
  minRating = 0
): Partial<Brand>[] {
  const seen = new Set<string>()
  const results: Partial<Brand>[] = []

  for (const raw of rawData) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as Record<string, unknown>

    const name = str(item.title ?? item.name)
    if (!name) continue

    const rating = num(item.totalScore ?? item.rating, 0)
    if (rating < minRating) continue

    const googleMapsUrl = str(item.url ?? item.placeUrl ?? item.googleMapsUrl)
    const dedupeKey = googleMapsUrl ?? name.toLowerCase()
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    const phone = str(item.phone ?? item.phoneUnformatted)
    const address = str(item.address ?? item.street)
    const city = str(item.city ?? item.neighborhood)
    const reviewsCount = num(item.reviewsCount ?? item.userRatingsTotal, 0)
    const website = str(item.website)
    const rawCat =
      item.categoryName ??
      (Array.isArray(item.categories) ? item.categories[0] : null)
    const pc = item.primaryCategory
    const primaryName =
      pc && typeof pc === 'object' && pc !== null && 'name' in pc
        ? (pc as { name: unknown }).name
        : null
    const category = str(rawCat ?? primaryName)
    const instagram_url = extractInstagram(item)
    const score = computeScore(rating, reviewsCount, !!instagram_url)

    results.push({
      name,
      phone,
      address,
      city,
      rating: rating || null,
      reviews_count: reviewsCount,
      instagram_url,
      website,
      google_maps_url: googleMapsUrl,
      category,
      status: 'pending',
      score,
      notes: null,
      last_contacted_at: null,
    })
  }

  return results
}
