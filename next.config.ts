import path from 'path'
import { fileURLToPath } from 'url'

import type { NextConfig } from 'next'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  // Evita que Next use un lockfile de un directorio padre como raíz del workspace.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cdninstagram.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'instagram.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.instagram.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
