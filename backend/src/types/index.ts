
/**
 * Common API response interface
 */
export interface ApiResponse<T = any> {
  /** Indicates if the operation was successful */
  success: boolean;
  /** Response data (present on success) */
  data?: T;
  /** Error message (present on failure) */
  error?: string;
  /** User-friendly message */
  message?: string;
}

/**
 * Legacy interface - kept for compatibility
 * @deprecated Use interfaces from video.types.ts instead
 */
export interface StoredVideo {
  id: string;
  s3Key: string;
  bucket: string;
  originalPrompt: string;
  userId?: string;
  createdAt: Date;
  metadata: Record<string, any>;
}

// Re-export video types for convenience
export type {
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoGenerationMetadata,
  ApiErrorResponse
} from './video.types.js';