export interface ErrorDetails {
  code: string
  message: string
  details?: string
  suggestions?: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ErrorContext {
  component: string
  action: string
  data?: any
  timestamp: Date
}

export class AppError extends Error {
  public readonly code: string
  public readonly details?: string
  public readonly suggestions?: string[]
  public readonly severity: 'low' | 'medium' | 'high' | 'critical'
  public readonly context?: ErrorContext

  constructor(
    code: string,
    message: string,
    options?: {
      details?: string
      suggestions?: string[]
      severity?: 'low' | 'medium' | 'high' | 'critical'
      context?: ErrorContext
      cause?: Error
    }
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = options?.details
    this.suggestions = options?.suggestions
    this.severity = options?.severity || 'medium'
    this.context = options?.context
    
    if (options?.cause) {
      this.cause = options.cause
    }
  }
}

// Error codes and their definitions
export const ERROR_CODES = {
  // URL Validation Errors
  URL_INVALID_FORMAT: 'URL_INVALID_FORMAT',
  URL_MISSING_PROTOCOL: 'URL_MISSING_PROTOCOL',
  URL_INVALID_DOMAIN: 'URL_INVALID_DOMAIN',
  URL_PLATFORM_MISMATCH: 'URL_PLATFORM_MISMATCH',
  URL_SUSPICIOUS_DOMAIN: 'URL_SUSPICIOUS_DOMAIN',
  URL_UNREACHABLE: 'URL_UNREACHABLE',
  
  // Data Storage Errors
  STORAGE_SAVE_FAILED: 'STORAGE_SAVE_FAILED',
  STORAGE_LOAD_FAILED: 'STORAGE_LOAD_FAILED',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_CORRUPTED_DATA: 'STORAGE_CORRUPTED_DATA',
  
  // API Errors
  API_NETWORK_ERROR: 'API_NETWORK_ERROR',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_UNAUTHORIZED: 'API_UNAUTHORIZED',
  API_CONTENT_SCRAPING_FAILED: 'API_CONTENT_SCRAPING_FAILED',
  API_AI_GENERATION_FAILED: 'API_AI_GENERATION_FAILED',
  
  // Form Validation Errors
  FORM_REQUIRED_FIELD: 'FORM_REQUIRED_FIELD',
  FORM_INVALID_INPUT: 'FORM_INVALID_INPUT',
  FORM_DUPLICATE_ENTRY: 'FORM_DUPLICATE_ENTRY',
  
  // General Application Errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

// Error message templates
const ERROR_MESSAGES: Record<ErrorCode, (details?: any) => ErrorDetails> = {
  [ERROR_CODES.URL_INVALID_FORMAT]: (details) => ({
    code: ERROR_CODES.URL_INVALID_FORMAT,
    message: 'Invalid URL format',
    details: details?.originalUrl ? `The URL "${details.originalUrl}" is not properly formatted` : undefined,
    suggestions: [
      'Make sure the URL starts with http:// or https://',
      'Check for typos in the domain name',
      'Ensure the URL is complete and properly formatted'
    ],
    severity: 'medium'
  }),
  
  [ERROR_CODES.URL_MISSING_PROTOCOL]: (details) => ({
    code: ERROR_CODES.URL_MISSING_PROTOCOL,
    message: 'URL missing protocol',
    details: 'URLs must start with http:// or https://',
    suggestions: [
      'Add https:// to the beginning of your URL',
      'Most modern websites use https://'
    ],
    severity: 'low'
  }),
  
  [ERROR_CODES.URL_INVALID_DOMAIN]: (details) => ({
    code: ERROR_CODES.URL_INVALID_DOMAIN,
    message: 'Invalid domain name',
    details: details?.domain ? `The domain "${details.domain}" appears to be invalid` : undefined,
    suggestions: [
      'Check the spelling of the domain name',
      'Make sure the domain has a valid extension (.com, .org, etc.)',
      'Verify the website exists and is accessible'
    ],
    severity: 'medium'
  }),
  
  [ERROR_CODES.URL_PLATFORM_MISMATCH]: (details) => ({
    code: ERROR_CODES.URL_PLATFORM_MISMATCH,
    message: 'URL doesn\'t match selected platform',
    details: details?.expected && details?.detected 
      ? `Expected ${details.expected} URL, but detected ${details.detected}`
      : undefined,
    suggestions: [
      'Make sure you\'ve selected the correct platform type',
      'Verify the URL belongs to the chosen social media platform',
      'Try selecting "Website" if it\'s a general web URL'
    ],
    severity: 'medium'
  }),
  
  [ERROR_CODES.URL_SUSPICIOUS_DOMAIN]: (details) => ({
    code: ERROR_CODES.URL_SUSPICIOUS_DOMAIN,
    message: 'Suspicious or blocked domain',
    details: 'This domain appears to be a test, local, or blocked domain',
    suggestions: [
      'Use a real, publicly accessible website URL',
      'Avoid localhost, test domains, or example URLs',
      'Make sure the website is live and accessible'
    ],
    severity: 'high'
  }),
  
  [ERROR_CODES.URL_UNREACHABLE]: (details) => ({
    code: ERROR_CODES.URL_UNREACHABLE,
    message: 'URL is not accessible',
    details: 'The website could not be reached or is currently down',
    suggestions: [
      'Check if the website is currently online',
      'Verify your internet connection',
      'Try again later if the site is temporarily down',
      'Make sure the URL is correct and publicly accessible'
    ],
    severity: 'medium'
  }),
  
  [ERROR_CODES.STORAGE_SAVE_FAILED]: (details) => ({
    code: ERROR_CODES.STORAGE_SAVE_FAILED,
    message: 'Failed to save data',
    details: 'Your data could not be saved to local storage',
    suggestions: [
      'Check if your browser allows local storage',
      'Clear some browser data if storage is full',
      'Try refreshing the page and saving again'
    ],
    severity: 'high'
  }),
  
  [ERROR_CODES.STORAGE_LOAD_FAILED]: (details) => ({
    code: ERROR_CODES.STORAGE_LOAD_FAILED,
    message: 'Failed to load saved data',
    details: 'Previously saved data could not be loaded',
    suggestions: [
      'Your saved data may be corrupted',
      'Try clearing browser data and starting fresh',
      'Check browser console for more details'
    ],
    severity: 'medium'
  }),
  
  [ERROR_CODES.STORAGE_QUOTA_EXCEEDED]: (details) => ({
    code: ERROR_CODES.STORAGE_QUOTA_EXCEEDED,
    message: 'Storage quota exceeded',
    details: 'Browser storage is full and cannot save more data',
    suggestions: [
      'Clear some browser data to free up space',
      'Remove old inspiration sources or topic ideas',
      'Consider exporting your data before clearing'
    ],
    severity: 'high'
  }),
  
  [ERROR_CODES.STORAGE_CORRUPTED_DATA]: (details) => ({
    code: ERROR_CODES.STORAGE_CORRUPTED_DATA,
    message: 'Corrupted data detected',
    details: 'Some saved data appears to be corrupted and cannot be loaded',
    suggestions: [
      'Clear corrupted data and start fresh',
      'Check browser console for more details',
      'Report this issue if it persists'
    ],
    severity: 'medium'
  }),
  
  [ERROR_CODES.API_NETWORK_ERROR]: (details) => ({
    code: ERROR_CODES.API_NETWORK_ERROR,
    message: 'Network connection error',
    details: 'Unable to connect to the service',
    suggestions: [
      'Check your internet connection',
      'Try again in a few moments',
      'Disable any VPN or proxy that might interfere'
    ],
    severity: 'medium'
  }),
  
  [ERROR_CODES.API_RATE_LIMIT]: (details) => ({
    code: ERROR_CODES.API_RATE_LIMIT,
    message: 'Rate limit exceeded',
    details: 'Too many requests made in a short time',
    suggestions: [
      'Wait a few minutes before trying again',
      'Reduce the number of sources processed at once',
      'Consider upgrading your plan for higher limits'
    ],
    severity: 'medium'
  }),
  
  [ERROR_CODES.API_UNAUTHORIZED]: (details) => ({
    code: ERROR_CODES.API_UNAUTHORIZED,
    message: 'Authentication required',
    details: 'You need to be logged in to perform this action',
    suggestions: [
      'Make sure you\'re logged in',
      'Refresh the page and try again',
      'Check if your session has expired'
    ],
    severity: 'high'
  }),
  
  [ERROR_CODES.API_CONTENT_SCRAPING_FAILED]: (details) => ({
    code: ERROR_CODES.API_CONTENT_SCRAPING_FAILED,
    message: 'Failed to scrape content',
    details: details?.url ? `Could not extract content from ${details.url}` : undefined,
    suggestions: [
      'The website may be blocking automated access',
      'Try a different URL from the same source',
      'Some social media profiles may be private',
      'Verify the URL is publicly accessible'
    ],
    severity: 'medium'
  }),
  
  [ERROR_CODES.API_AI_GENERATION_FAILED]: (details) => ({
    code: ERROR_CODES.API_AI_GENERATION_FAILED,
    message: 'AI generation failed',
    details: 'The AI service could not process your request',
    suggestions: [
      'Try again with different content',
      'Reduce the amount of text being processed',
      'Check if the service is temporarily unavailable'
    ],
    severity: 'medium'
  }),
  
  [ERROR_CODES.FORM_REQUIRED_FIELD]: (details) => ({
    code: ERROR_CODES.FORM_REQUIRED_FIELD,
    message: 'Required field missing',
    details: details?.field ? `The field "${details.field}" is required` : undefined,
    suggestions: [
      'Fill in all required fields before submitting',
      'Check for any highlighted or marked fields'
    ],
    severity: 'low'
  }),
  
  [ERROR_CODES.FORM_INVALID_INPUT]: (details) => ({
    code: ERROR_CODES.FORM_INVALID_INPUT,
    message: 'Invalid input provided',
    details: details?.field ? `Invalid value for "${details.field}"` : undefined,
    suggestions: [
      'Check the format requirements for each field',
      'Make sure all inputs are properly formatted'
    ],
    severity: 'low'
  }),
  
  [ERROR_CODES.FORM_DUPLICATE_ENTRY]: (details) => ({
    code: ERROR_CODES.FORM_DUPLICATE_ENTRY,
    message: 'Duplicate entry detected',
    details: 'This item already exists in your list',
    suggestions: [
      'Check if you\'ve already added this source',
      'Use a different name or URL',
      'Update the existing entry instead'
    ],
    severity: 'low'
  }),
  
  [ERROR_CODES.UNKNOWN_ERROR]: (details) => ({
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: 'An unexpected error occurred',
    details: details?.message || 'Something went wrong',
    suggestions: [
      'Try refreshing the page',
      'Check browser console for more details',
      'Report this issue if it persists'
    ],
    severity: 'medium'
  }),
  
  [ERROR_CODES.FEATURE_NOT_AVAILABLE]: (details) => ({
    code: ERROR_CODES.FEATURE_NOT_AVAILABLE,
    message: 'Feature not available',
    details: 'This feature is currently not available',
    suggestions: [
      'Try again later',
      'Check if you have the required permissions',
      'Contact support if this feature should be available'
    ],
    severity: 'low'
  })
}

export function createError(code: ErrorCode, details?: any, context?: ErrorContext): AppError {
  const errorDetails = ERROR_MESSAGES[code](details)
  
  return new AppError(code, errorDetails.message, {
    details: errorDetails.details,
    suggestions: errorDetails.suggestions,
    severity: errorDetails.severity,
    context
  })
}

export function handleError(error: unknown, context?: ErrorContext): AppError {
  if (error instanceof AppError) {
    return error
  }
  
  if (error instanceof Error) {
    // Try to categorize common errors
    if (error.message.includes('fetch')) {
      return createError(ERROR_CODES.API_NETWORK_ERROR, { message: error.message }, context)
    }
    
    if (error.message.includes('quota') || error.message.includes('storage')) {
      return createError(ERROR_CODES.STORAGE_QUOTA_EXCEEDED, { message: error.message }, context)
    }
    
    if (error.message.includes('rate limit')) {
      return createError(ERROR_CODES.API_RATE_LIMIT, { message: error.message }, context)
    }
    
    return createError(ERROR_CODES.UNKNOWN_ERROR, { message: error.message }, context)
  }
  
  return createError(ERROR_CODES.UNKNOWN_ERROR, { message: String(error) }, context)
}

// Helper function to format error for display
export function formatErrorForDisplay(error: AppError): {
  title: string
  description: string
  suggestions?: string[]
  severity: string
} {
  return {
    title: error.message,
    description: error.details || 'An error occurred while processing your request',
    suggestions: error.suggestions,
    severity: error.severity
  }
}

// Helper function to log errors (can be extended to send to monitoring service)
export function logError(error: AppError): void {
  console.group(`🚨 ${error.severity.toUpperCase()} ERROR: ${error.code}`)
  console.error('Message:', error.message)
  if (error.details) console.error('Details:', error.details)
  if (error.context) console.error('Context:', error.context)
  if (error.suggestions) console.error('Suggestions:', error.suggestions)
  if (error.cause) console.error('Cause:', error.cause)
  console.groupEnd()
}