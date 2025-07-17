import { createError, handleError, ERROR_CODES, logError } from './errorHandler'

export interface StorageOptions {
  compress?: boolean
  encrypt?: boolean
  maxRetries?: number
  retryDelay?: number
}

export class SafeStorage {
  private static instance: SafeStorage
  private readonly prefix: string = 'social_hub_'
  
  private constructor() {}
  
  public static getInstance(): SafeStorage {
    if (!SafeStorage.instance) {
      SafeStorage.instance = new SafeStorage()
    }
    return SafeStorage.instance
  }
  
  /**
   * Save data to localStorage with error handling and validation
   */
  public async save<T>(key: string, data: T, options: StorageOptions = {}): Promise<void> {
    const fullKey = this.prefix + key
    const maxRetries = options.maxRetries || 3
    const retryDelay = options.retryDelay || 1000
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Validate data
        if (data === undefined) {
          throw createError(ERROR_CODES.FORM_INVALID_INPUT, { 
            field: key, 
            message: 'Cannot save undefined data' 
          })
        }
        
        // Serialize data
        const serializedData = JSON.stringify({
          data,
          timestamp: Date.now(),
          version: '1.0'
        })
        
        // Check storage quota before saving
        this.checkStorageQuota(serializedData.length)
        
        // Save to localStorage
        localStorage.setItem(fullKey, serializedData)
        
        // Verify the save was successful
        const verification = localStorage.getItem(fullKey)
        if (!verification) {
          throw new Error('Save verification failed')
        }
        
        return // Success
        
      } catch (error) {
        const appError = handleError(error, {
          component: 'SafeStorage',
          action: 'save',
          data: { key, attempt },
          timestamp: new Date()
        })
        
        logError(appError)
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          if (error instanceof Error && error.message.includes('quota')) {
            throw createError(ERROR_CODES.STORAGE_QUOTA_EXCEEDED, {
              key,
              dataSize: JSON.stringify(data).length
            })
          }
          throw createError(ERROR_CODES.STORAGE_SAVE_FAILED, { key, error: error })
        }
        
        // Wait before retrying
        await this.delay(retryDelay * attempt)
      }
    }
  }
  
  /**
   * Load data from localStorage with error handling and validation
   */
  public async load<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const fullKey = this.prefix + key
    
    try {
      const stored = localStorage.getItem(fullKey)
      
      if (!stored) {
        return defaultValue
      }
      
      // Parse stored data
      const parsed = JSON.parse(stored)
      
      // Validate structure
      if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) {
        throw createError(ERROR_CODES.STORAGE_CORRUPTED_DATA, {
          key,
          message: 'Invalid data structure'
        })
      }
      
      // Check if data is too old (optional - can be configured)
      const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
      if (parsed.timestamp && (Date.now() - parsed.timestamp) > maxAge) {
        console.warn(`Data for key '${key}' is older than ${maxAge}ms, consider refreshing`)
      }
      
      return parsed.data as T
      
    } catch (error) {
      const appError = handleError(error, {
        component: 'SafeStorage',
        action: 'load',
        data: { key },
        timestamp: new Date()
      })
      
      logError(appError)
      
      if (error instanceof SyntaxError) {
        // Data is corrupted, remove it
        this.remove(key)
        throw createError(ERROR_CODES.STORAGE_CORRUPTED_DATA, {
          key,
          message: 'JSON parse error - data removed'
        })
      }
      
      throw createError(ERROR_CODES.STORAGE_LOAD_FAILED, { key, error })
    }
  }
  
  /**
   * Remove data from localStorage
   */
  public remove(key: string): void {
    const fullKey = this.prefix + key
    try {
      localStorage.removeItem(fullKey)
    } catch (error) {
      logError(handleError(error, {
        component: 'SafeStorage',
        action: 'remove',
        data: { key },
        timestamp: new Date()
      }))
    }
  }
  
  /**
   * Clear all app data from localStorage
   */
  public clearAll(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      logError(handleError(error, {
        component: 'SafeStorage',
        action: 'clearAll',
        data: {},
        timestamp: new Date()
      }))
    }
  }
  
  /**
   * Get storage usage information
   */
  public getStorageInfo(): {
    used: number
    available: number
    total: number
    keys: string[]
  } {
    try {
      let used = 0
      const keys: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.prefix)) {
          keys.push(key.replace(this.prefix, ''))
          const value = localStorage.getItem(key)
          if (value) {
            used += key.length + value.length
          }
        }
      }
      
      // Estimate total available storage (varies by browser)
      const total = 5 * 1024 * 1024 // 5MB typical limit
      const available = total - used
      
      return { used, available, total, keys }
      
    } catch (error) {
      logError(handleError(error, {
        component: 'SafeStorage',
        action: 'getStorageInfo',
        data: {},
        timestamp: new Date()
      }))
      
      return { used: 0, available: 0, total: 0, keys: [] }
    }
  }
  
  /**
   * Check if there's enough storage quota for the data
   */
  private checkStorageQuota(dataSize: number): void {
    const info = this.getStorageInfo()
    
    if (dataSize > info.available) {
      throw createError(ERROR_CODES.STORAGE_QUOTA_EXCEEDED, {
        required: dataSize,
        available: info.available,
        used: info.used
      })
    }
  }
  
  /**
   * Utility function to create a delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * Export all data for backup
   */
  public exportData(): Record<string, any> {
    const data: Record<string, any> = {}
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.prefix)) {
          const value = localStorage.getItem(key)
          if (value) {
            try {
              data[key.replace(this.prefix, '')] = JSON.parse(value)
            } catch {
              data[key.replace(this.prefix, '')] = value
            }
          }
        }
      }
    } catch (error) {
      logError(handleError(error, {
        component: 'SafeStorage',
        action: 'exportData',
        data: {},
        timestamp: new Date()
      }))
    }
    
    return data
  }
  
  /**
   * Import data from backup
   */
  public async importData(data: Record<string, any>): Promise<void> {
    try {
      for (const [key, value] of Object.entries(data)) {
        await this.save(key, value.data || value)
      }
    } catch (error) {
      throw handleError(error, {
        component: 'SafeStorage',
        action: 'importData',
        data: { keys: Object.keys(data) },
        timestamp: new Date()
      })
    }
  }
}

// Export singleton instance
export const storage = SafeStorage.getInstance()

// Convenience functions
export const saveData = <T>(key: string, data: T, options?: StorageOptions) => 
  storage.save(key, data, options)

export const loadData = <T>(key: string, defaultValue?: T) => 
  storage.load<T>(key, defaultValue)

export const removeData = (key: string) => 
  storage.remove(key)

export const clearAllData = () => 
  storage.clearAll()

export const getStorageInfo = () => 
  storage.getStorageInfo()

export const exportAllData = () => 
  storage.exportData()

export const importAllData = (data: Record<string, any>) => 
  storage.importData(data)