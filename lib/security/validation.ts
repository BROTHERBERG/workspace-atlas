/**
 * Input validation and sanitization utilities
 * Provides comprehensive validation for all user inputs
 */

import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

// Define validation schemas for different input types
export interface ValidationRule {
  required?: boolean
  type?: 'string' | 'number' | 'email' | 'url' | 'phone' | 'date' | 'boolean' | 'array'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: any) => string | null // Returns error message or null
  sanitize?: boolean
  allowEmpty?: boolean
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  sanitizedData: Record<string, any>
}

/**
 * Main validation function
 */
export function validateData(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
  const errors: Record<string, string> = {}
  const sanitizedData: Record<string, any> = {}

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field]
    const error = validateField(value, rule)
    
    if (error) {
      errors[field] = error
    } else {
      // Sanitize the valid data
      sanitizedData[field] = rule.sanitize ? sanitizeInput(value, rule.type) : value
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData
  }
}

/**
 * Validate individual field
 */
function validateField(value: any, rule: ValidationRule): string | null {
  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    return 'This field is required'
  }

  // Allow empty if not required and allowEmpty is true
  if (!rule.required && rule.allowEmpty && (value === '' || value === null || value === undefined)) {
    return null
  }

  // Type validation
  if (value !== undefined && value !== null && value !== '') {
    const typeError = validateType(value, rule.type || 'string')
    if (typeError) return typeError

    // Length validation for strings
    if (rule.type === 'string' || typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `Must be at least ${rule.minLength} characters`
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `Must be no more than ${rule.maxLength} characters`
      }
    }

    // Range validation for numbers
    if (rule.type === 'number' || typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `Must be at least ${rule.min}`
      }
      if (rule.max !== undefined && value > rule.max) {
        return `Must be no more than ${rule.max}`
      }
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(String(value))) {
      return 'Invalid format'
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value)
      if (customError) return customError
    }
  }

  return null
}

/**
 * Type validation
 */
function validateType(value: any, type: string): string | null {
  switch (type) {
    case 'email':
      if (!validator.isEmail(String(value))) {
        return 'Invalid email address'
      }
      break
    
    case 'url':
      if (!validator.isURL(String(value))) {
        return 'Invalid URL'
      }
      break
    
    case 'phone':
      if (!validator.isMobilePhone(String(value))) {
        return 'Invalid phone number'
      }
      break
    
    case 'date':
      if (!validator.isISO8601(String(value))) {
        return 'Invalid date format'
      }
      break
    
    case 'number':
      if (!validator.isNumeric(String(value))) {
        return 'Must be a number'
      }
      break
    
    case 'boolean':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return 'Must be true or false'
      }
      break
    
    case 'array':
      if (!Array.isArray(value)) {
        return 'Must be an array'
      }
      break
  }
  
  return null
}

/**
 * Sanitize input based on type
 */
function sanitizeInput(value: any, type?: string): any {
  if (value === null || value === undefined) return value

  switch (type) {
    case 'string':
      return DOMPurify.sanitize(String(value), { ALLOWED_TAGS: [] })
    
    case 'email':
      return validator.normalizeEmail(String(value)) || value
    
    case 'url':
      return validator.escape(String(value))
    
    case 'number':
      return parseFloat(String(value))
    
    case 'boolean':
      return value === 'true' || value === true
    
    default:
      return typeof value === 'string' ? DOMPurify.sanitize(value, { ALLOWED_TAGS: [] }) : value
  }
}

/**
 * Pre-defined validation schemas for common use cases
 */
export const validationSchemas = {
  // Contact form validation
  contactForm: {
    name: {
      required: true,
      type: 'string' as const,
      minLength: 2,
      maxLength: 50,
      sanitize: true
    },
    email: {
      required: true,
      type: 'email' as const,
      sanitize: true
    },
    subject: {
      required: true,
      type: 'string' as const,
      minLength: 5,
      maxLength: 100,
      sanitize: true
    },
    message: {
      required: true,
      type: 'string' as const,
      minLength: 10,
      maxLength: 1000,
      sanitize: true
    }
  },

  // Workspace submission validation
  workspaceSubmission: {
    name: {
      required: true,
      type: 'string' as const,
      minLength: 2,
      maxLength: 100,
      sanitize: true
    },
    description: {
      required: true,
      type: 'string' as const,
      minLength: 20,
      maxLength: 2000,
      sanitize: true
    },
    website: {
      required: false,
      type: 'url' as const,
      sanitize: true
    },
    email: {
      required: true,
      type: 'email' as const,
      sanitize: true
    },
    phone: {
      required: false,
      type: 'phone' as const,
      sanitize: true
    },
    address: {
      required: true,
      type: 'string' as const,
      minLength: 10,
      maxLength: 200,
      sanitize: true
    },
    city: {
      required: true,
      type: 'string' as const,
      minLength: 2,
      maxLength: 50,
      sanitize: true
    },
    country: {
      required: true,
      type: 'string' as const,
      minLength: 2,
      maxLength: 50,
      sanitize: true
    },
    priceRange: {
      required: false,
      type: 'string' as const,
      maxLength: 50,
      sanitize: true
    }
  },

  // Score request validation
  scoreRequest: {
    workspaceUrl: {
      required: true,
      type: 'url' as const,
      sanitize: true,
      custom: (value: string) => {
        // Additional validation for workspace URLs
        if (!value.includes('http')) {
          return 'URL must include http:// or https://'
        }
        return null
      }
    },
    contactEmail: {
      required: true,
      type: 'email' as const,
      sanitize: true
    },
    workspaceName: {
      required: true,
      type: 'string' as const,
      minLength: 2,
      maxLength: 100,
      sanitize: true
    },
    additionalInfo: {
      required: false,
      type: 'string' as const,
      maxLength: 500,
      sanitize: true,
      allowEmpty: true
    }
  },

  // User profile validation
  userProfile: {
    name: {
      required: true,
      type: 'string' as const,
      minLength: 2,
      maxLength: 50,
      sanitize: true
    },
    email: {
      required: true,
      type: 'email' as const,
      sanitize: true
    },
    bio: {
      required: false,
      type: 'string' as const,
      maxLength: 500,
      sanitize: true,
      allowEmpty: true
    },
    website: {
      required: false,
      type: 'url' as const,
      sanitize: true,
      allowEmpty: true
    },
    location: {
      required: false,
      type: 'string' as const,
      maxLength: 100,
      sanitize: true,
      allowEmpty: true
    }
  },

  // Review submission validation
  reviewSubmission: {
    rating: {
      required: true,
      type: 'number' as const,
      min: 1,
      max: 5
    },
    title: {
      required: true,
      type: 'string' as const,
      minLength: 5,
      maxLength: 100,
      sanitize: true
    },
    content: {
      required: true,
      type: 'string' as const,
      minLength: 20,
      maxLength: 1000,
      sanitize: true
    },
    recommend: {
      required: true,
      type: 'boolean' as const
    }
  },

  // Search query validation
  searchQuery: {
    query: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 100,
      sanitize: true,
      pattern: /^[a-zA-Z0-9\s\-_.,]+$/ // Allow alphanumeric, spaces, basic punctuation
    },
    city: {
      required: false,
      type: 'string' as const,
      maxLength: 50,
      sanitize: true,
      allowEmpty: true
    },
    country: {
      required: false,
      type: 'string' as const,
      maxLength: 50,
      sanitize: true,
      allowEmpty: true
    },
    limit: {
      required: false,
      type: 'number' as const,
      min: 1,
      max: 100
    }
  }
}

/**
 * SQL injection prevention
 */
export function preventSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /[';]|--|\*|\/\*/gi
  ]

  return !sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * XSS prevention
 */
export function sanitizeHTML(input: string, allowedTags: string[] = []): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedTags.length > 0 ? ['href', 'target'] : []
  })
}

/**
 * Path traversal prevention
 */
export function sanitizeFilePath(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, '').replace(/\.+/g, '.')
}

/**
 * Validate file uploads
 */
export interface FileValidationRule {
  maxSize: number // in bytes
  allowedTypes: string[]
  allowedExtensions: string[]
}

export function validateFile(file: File, rule: FileValidationRule): string | null {
  // Size validation
  if (file.size > rule.maxSize) {
    return `File size must be less than ${Math.round(rule.maxSize / 1024 / 1024)}MB`
  }

  // Type validation
  if (!rule.allowedTypes.includes(file.type)) {
    return `File type ${file.type} is not allowed`
  }

  // Extension validation
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !rule.allowedExtensions.includes(extension)) {
    return `File extension .${extension} is not allowed`
  }

  return null
}

/**
 * Common file validation rules
 */
export const fileValidationRules = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif']
  },
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'text/plain', 'application/msword'],
    allowedExtensions: ['pdf', 'txt', 'doc', 'docx']
  }
}

/**
 * Request body size validation middleware
 */
export function validateRequestSize(maxSize: number = 1024 * 1024) { // 1MB default
  return (req: any) => {
    const contentLength = req.headers['content-length']
    if (contentLength && parseInt(contentLength) > maxSize) {
      throw new Error(`Request body too large. Maximum size: ${Math.round(maxSize / 1024)}KB`)
    }
  }
}