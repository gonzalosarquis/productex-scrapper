/**
 * Procesamiento de datos de marcas — placeholder (fase posterior).
 */

import type { Brand } from '@/lib/types'

export function processBrandPayloadPlaceholder(
  raw: unknown
): Partial<Brand> | null {
  if (raw && typeof raw === 'object') {
    return {}
  }
  return null
}
