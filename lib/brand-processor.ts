import type { Brand } from '@/lib/types'

const EMAIL_REGEX =
  /\b[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}\b/

/** AR +54, 11, espacios, guiones; también formatos genéricos internacionales */
const PHONE_REGEXES: RegExp[] = [
  /\+?54\s*(?:0?\d{1,4}\s*)?(?:15\s*)?\d{3}[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g,
  /\+?\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,6}/g,
  /\b\d{3}[\s.-]?\d{3,4}[\s.-]?\d{4}\b/g,
]

function extractEmail(text: string | null | undefined): string | null {
  if (!text) return null
  const m = text.match(EMAIL_REGEX)
  return m ? m[0] : null
}

function extractPhone(text: string | null | undefined): string | null {
  if (!text) return null
  for (const re of PHONE_REGEXES) {
    re.lastIndex = 0
    const m = text.match(re)
    if (m && m[0].replace(/\D/g, '').length >= 8) {
      return m[0].trim()
    }
  }
  return null
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

function str(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

type PostLike = {
  likesCount?: unknown
  commentsCount?: unknown
  timestamp?: unknown
  taken_at?: unknown
  date?: unknown
}

function collectPosts(item: Record<string, unknown>): PostLike[] {
  const raw = item.posts
  if (Array.isArray(raw)) {
    return raw as PostLike[]
  }
  if (
    item.likesCount != null ||
    item.commentsCount != null ||
    item.timestamp != null
  ) {
    return [
      {
        likesCount: item.likesCount,
        commentsCount: item.commentsCount,
        timestamp: item.timestamp,
      },
    ]
  }
  return []
}

function parsePostDate(p: PostLike): Date | null {
  const t = p.timestamp ?? p.taken_at ?? p.date
  if (t == null) return null
  if (typeof t === 'number') {
    const d = new Date(t > 1e12 ? t : t * 1000)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof t === 'string') {
    const d = new Date(t)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function computePostsPerWeek(posts: PostLike[]): number | null {
  const dates = posts.map(parsePostDate).filter((d): d is Date => d !== null)
  if (dates.length < 2) {
    if (dates.length === 1) return 1
    return null
  }
  const min = Math.min(...dates.map((d) => d.getTime()))
  const max = Math.max(...dates.map((d) => d.getTime()))
  const weeks = Math.max((max - min) / (7 * 24 * 60 * 60 * 1000), 1 / 7)
  return posts.length / weeks
}

function computeAverages(posts: PostLike[]): {
  avgLikes: number
  avgComments: number
} {
  if (posts.length === 0) return { avgLikes: 0, avgComments: 0 }
  let likes = 0
  let comments = 0
  for (const p of posts) {
    likes += num(p.likesCount, 0)
    comments += num(p.commentsCount, 0)
  }
  return {
    avgLikes: likes / posts.length,
    avgComments: comments / posts.length,
  }
}

const FASHION_CATEGORIES = [
  'clothing',
  'boutique',
  'fashion',
  'moda',
  'ropa',
  'indumentaria',
  'tienda de ropa',
  'clothing store',
  'clothing brand',
  'apparel',
  'brand',
  'marca de ropa',
  'tienda de moda',
  'shopping',
  'retail',
  'wear',
  'diseñador',
  'designer',
  'textile',
  'textil',
  'lencería',
  'underwear',
  'sportswear',
  'swimwear',
  'calzado',
  'footwear',
  'accesorios de moda',
  'fashion accessories',
]

function isFashionBusiness(
  item: Record<string, unknown>,
  userCategories: string[]
): boolean {
  const isBusiness = Boolean(
    item.isBusinessAccount ?? item.is_business_account
  )
  if (!isBusiness) return false

  const profileCategory = str(
    item.businessCategoryName ??
      item.category ??
      item.businessCategory ??
      item.igCategory ??
      item.categoryName
  )

  if (!profileCategory) return false

  const lower = profileCategory.toLowerCase()

  if (userCategories.length > 0) {
    return userCategories.some(
      (uc) =>
        lower.includes(uc.toLowerCase()) ||
        uc.toLowerCase().includes(lower)
    )
  }

  return FASHION_CATEGORIES.some((fc) => lower.includes(fc))
}

function computeScore(params: {
  followers: number
  engagementRate: number
  hasEmail: boolean
  isBusiness: boolean
}): number {
  const followerPart = (params.followers / 10000) * 20
  const engagementPart = params.engagementRate * 10
  const emailPart = params.hasEmail ? 20 : 0
  const bizPart = params.isBusiness ? 10 : 0
  const raw = followerPart + engagementPart + emailPart + bizPart
  return Math.min(100, Math.max(0, Math.round(raw)))
}

function nestedCount(obj: unknown): number | undefined {
  if (obj && typeof obj === 'object' && 'count' in obj) {
    return num((obj as { count: unknown }).count, 0)
  }
  return undefined
}

function normalizeRow(item: Record<string, unknown>): Partial<Brand> | null {
  const owner =
    item.owner && typeof item.owner === 'object'
      ? (item.owner as Record<string, unknown>)
      : undefined

  const username = str(
    item.username ?? item.ownerUsername ?? owner?.username
  )
  if (!username) return null

  const full_name = str(
    item.fullName ?? item.full_name ?? item.ownerFullName ?? owner?.fullName
  )
  const bio = str(item.biography ?? item.bio)

  const followers = num(
    item.followersCount ?? item.followers ?? nestedCount(item.edge_followed_by),
    0
  )
  const following = num(
    item.followingCount ?? item.following ?? nestedCount(item.edge_follow),
    0
  )
  const posts_count = num(
    item.postsCount ??
      item.posts_count ??
      nestedCount(item.edge_owner_to_timeline_media),
    0
  )

  const profile_image = str(item.profilePicUrl ?? item.profile_pic_url_hd)
  const website = str(item.externalUrl ?? item.external_url)
  const verified = Boolean(item.isVerified ?? item.is_verified)
  const is_business = Boolean(
    item.isBusinessAccount ?? item.is_business_account
  )
  const location =
    item.location && typeof item.location === 'object'
      ? (item.location as Record<string, unknown>)
      : undefined
  const locationName = str(item.locationName ?? location?.name)

  const posts = collectPosts(item)
  const { avgLikes, avgComments } = computeAverages(posts)
  const posts_per_week = computePostsPerWeek(posts)

  let engagement_rate: number | null = null
  if (followers > 0) {
    engagement_rate = ((avgLikes + avgComments) / followers) * 100
  }

  const email = extractEmail(bio) ?? extractEmail(website)
  const phone = extractPhone(bio)

  const score = computeScore({
    followers,
    engagementRate: engagement_rate ?? 0,
    hasEmail: Boolean(email),
    isBusiness: is_business,
  })

  const instagram_url = `https://www.instagram.com/${username.replace(/^@/, '')}/`

  const categoryNote = str(
    item.businessCategoryName ??
      item.category ??
      item.businessCategory ??
      null
  )

  return {
    username,
    full_name,
    bio,
    followers,
    following,
    posts_count,
    engagement_rate,
    avg_likes: posts.length ? avgLikes : null,
    avg_comments: posts.length ? avgComments : null,
    posts_per_week,
    profile_image,
    website,
    email,
    phone,
    country: locationName,
    city: locationName,
    verified,
    is_business,
    instagram_url,
    status: 'pending',
    score,
    notes: categoryNote,
    last_contacted_at: null,
  }
}

function mergeBrand(a: Partial<Brand>, b: Partial<Brand>): Partial<Brand> {
  const followers = Math.max(a.followers ?? 0, b.followers ?? 0)
  const pick = <K extends keyof Brand>(key: K): Brand[K] | undefined => {
    const av = a[key]
    const bv = b[key]
    if (bv != null && bv !== '') return bv as Brand[K]
    return av as Brand[K] | undefined
  }

  return {
    ...a,
    ...b,
    username: a.username ?? b.username,
    followers,
    following: Math.max(a.following ?? 0, b.following ?? 0),
    posts_count: Math.max(a.posts_count ?? 0, b.posts_count ?? 0),
    score: Math.max(a.score ?? 0, b.score ?? 0),
    full_name: pick('full_name') ?? null,
    bio: pick('bio') ?? null,
    engagement_rate: pick('engagement_rate') ?? null,
    email: pick('email') ?? null,
    phone: pick('phone') ?? null,
    notes: pick('notes') ?? null,
  }
}

/**
 * Transforma items del dataset de Apify Instagram Scraper al formato Brand.
 * `filterCategories` acota por categoría de negocio de Instagram; vacío = lista FASHION_CATEGORIES.
 */
export function processBrandData(
  rawData: unknown[],
  filterCategories: string[] = []
): Partial<Brand>[] {
  const byUser = new Map<string, Partial<Brand>>()

  for (const raw of rawData) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as Record<string, unknown>
    const row = normalizeRow(item)
    if (!row?.username) continue
    if (!isFashionBusiness(item, filterCategories)) continue

    const u = row.username.toLowerCase()
    const existing = byUser.get(u)
    if (!existing) {
      byUser.set(u, row)
    } else {
      byUser.set(u, mergeBrand(existing, row))
    }
  }

  return Array.from(byUser.values())
}
