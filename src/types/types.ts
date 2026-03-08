// 1. Define distinct Error Codes (The "Contract")
export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  IMAGE_TOO_LARGE = 'IMAGE_TOO_LARGE',
  INVALID_FILE = 'INVALID_FILE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
}

// 2. Define the Standard Response Structure
export type ApiResponse<T = any>
  = | { success: true, data: T }
    | { success: false, error: ApiErrorDetail }

export interface ApiErrorDetail {
  code: ApiErrorCode
  message: string // Fallback english message for logs
  details?: any
}
