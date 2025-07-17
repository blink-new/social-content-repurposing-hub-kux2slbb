export interface URLValidationResult {
  isValid: boolean
  error?: string
  platform?: string
  normalizedUrl?: string
}

export interface PlatformPattern {
  name: string
  patterns: RegExp[]
  normalizeUrl?: (url: string) => string
}

const platformPatterns: PlatformPattern[] = [
  {
    name: 'YouTube',
    patterns: [
      /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i,
      /^https?:\/\/(www\.)?youtube\.com\/@[\w-]+/i,
      /^https?:\/\/(www\.)?youtube\.com\/c\/[\w-]+/i,
      /^https?:\/\/(www\.)?youtube\.com\/channel\/[\w-]+/i,
      /^https?:\/\/(www\.)?youtube\.com\/user\/[\w-]+/i
    ],
    normalizeUrl: (url: string) => {
      // Normalize YouTube URLs to consistent format
      if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0]
        return `https://youtube.com/watch?v=${videoId}`
      }
      return url.replace(/^http:/, 'https:').replace(/www\./, '')
    }
  },
  {
    name: 'LinkedIn',
    patterns: [
      /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+/i,
      /^https?:\/\/(www\.)?linkedin\.com\/company\/[\w-]+/i,
      /^https?:\/\/(www\.)?linkedin\.com\/school\/[\w-]+/i
    ],
    normalizeUrl: (url: string) => url.replace(/^http:/, 'https:').replace(/www\./, '')
  },
  {
    name: 'X (Twitter)',
    patterns: [
      /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[\w-]+/i
    ],
    normalizeUrl: (url: string) => {
      return url.replace(/^http:/, 'https:')
        .replace(/www\./, '')
        .replace('twitter.com', 'x.com')
    }
  },
  {
    name: 'Instagram',
    patterns: [
      /^https?:\/\/(www\.)?instagram\.com\/[\w.-]+/i
    ],
    normalizeUrl: (url: string) => url.replace(/^http:/, 'https:').replace(/www\./, '')
  },
  {
    name: 'TikTok',
    patterns: [
      /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+/i,
      /^https?:\/\/(www\.)?tiktok\.com\/[\w.-]+/i
    ],
    normalizeUrl: (url: string) => url.replace(/^http:/, 'https:').replace(/www\./, '')
  },
  {
    name: 'Website',
    patterns: [
      /^https?:\/\/[\w.-]+\.[a-z]{2,}/i
    ],
    normalizeUrl: (url: string) => url.replace(/^http:/, 'https:')
  }
]

export function validateURL(url: string, expectedPlatform?: string): URLValidationResult {
  // Basic URL format validation
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL is required'
    }
  }

  // Trim whitespace
  url = url.trim()

  if (!url) {
    return {
      isValid: false,
      error: 'URL cannot be empty'
    }
  }

  // Check if URL starts with protocol
  if (!url.match(/^https?:\/\//i)) {
    // Try to fix by adding https://
    url = `https://${url}`
  }

  // Basic URL structure validation
  try {
    const urlObj = new URL(url)
    
    // Check for valid hostname
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      return {
        isValid: false,
        error: 'Invalid hostname in URL'
      }
    }

    // Check for valid TLD
    if (!urlObj.hostname.includes('.')) {
      return {
        isValid: false,
        error: 'URL must contain a valid domain'
      }
    }

  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format'
    }
  }

  // Platform-specific validation
  let detectedPlatform: string | undefined
  let normalizedUrl = url

  for (const platform of platformPatterns) {
    for (const pattern of platform.patterns) {
      if (pattern.test(url)) {
        detectedPlatform = platform.name
        if (platform.normalizeUrl) {
          normalizedUrl = platform.normalizeUrl(url)
        }
        break
      }
    }
    if (detectedPlatform) break
  }

  // If expected platform is specified, validate against it
  if (expectedPlatform && detectedPlatform) {
    const expectedPlatformName = platformPatterns.find(p => 
      p.name.toLowerCase() === expectedPlatform.toLowerCase()
    )?.name

    if (expectedPlatformName && detectedPlatform !== expectedPlatformName) {
      return {
        isValid: false,
        error: `URL doesn't match expected platform (${expectedPlatformName}). Detected: ${detectedPlatform}`
      }
    }
  }

  // Additional platform-specific validations
  if (detectedPlatform === 'YouTube') {
    if (url.includes('/watch?v=') && !url.match(/[?&]v=[\w-]{11}/)) {
      return {
        isValid: false,
        error: 'Invalid YouTube video URL format'
      }
    }
  }

  if (detectedPlatform === 'LinkedIn') {
    if (url.includes('/in/') && url.split('/in/')[1]?.length < 3) {
      return {
        isValid: false,
        error: 'LinkedIn profile URL appears to be incomplete'
      }
    }
  }

  if (detectedPlatform === 'Instagram') {
    const username = url.split('instagram.com/')[1]?.split('/')[0]
    if (username && (username.length < 1 || username.length > 30)) {
      return {
        isValid: false,
        error: 'Invalid Instagram username length'
      }
    }
  }

  if (detectedPlatform === 'TikTok') {
    if (url.includes('/@') && !url.match(/@[\w.-]+/)) {
      return {
        isValid: false,
        error: 'Invalid TikTok username format'
      }
    }
  }

  // Check for suspicious or blocked domains
  const suspiciousDomains = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'example.com',
    'test.com',
    'fake.com'
  ]

  const hostname = new URL(normalizedUrl).hostname.toLowerCase()
  if (suspiciousDomains.some(domain => hostname.includes(domain))) {
    return {
      isValid: false,
      error: 'URL appears to be a test or local domain'
    }
  }

  return {
    isValid: true,
    platform: detectedPlatform,
    normalizedUrl
  }
}

export function getPlatformFromUrl(url: string): string | undefined {
  const result = validateURL(url)
  return result.platform
}

export function normalizeUrl(url: string): string {
  const result = validateURL(url)
  return result.normalizedUrl || url
}

// Helper function to get platform-specific placeholder text
export function getPlatformPlaceholder(platformType: string): string {
  const placeholders: Record<string, string> = {
    youtube: 'https://youtube.com/@channelname or https://youtube.com/c/channelname',
    linkedin: 'https://linkedin.com/in/username or https://linkedin.com/company/companyname',
    twitter: 'https://x.com/username or https://twitter.com/username',
    instagram: 'https://instagram.com/username',
    tiktok: 'https://tiktok.com/@username',
    website: 'https://example.com or https://blog.example.com',
    blog: 'https://blog.example.com/feed or https://example.com/rss'
  }
  
  return placeholders[platformType] || 'https://example.com'
}