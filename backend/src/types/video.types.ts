/**
 * Request payload for video generation
 */
export interface VideoGenerationRequest {
  /** Text prompt describing the video to generate */
  prompt: string;
  /** Desired video duration in seconds (optional) */
  duration?: number;
  /** Video quality setting */
  quality?: 'low' | 'medium' | 'high';
  /** Optional user identifier for tracking */
  userId?: string;
}

/**
 * Response from video generation containing S3 info and metadata
 */
export interface VideoGenerationResponse {
  /** Current status of the video (ACTIVE, PROCESSING, FAILED, etc.) */
  status: string;
  /** S3 object key for the generated video */
  s3Key?: string;
  /** Public URL for accessing the video (presigned) */
  publicUrl?: string;
  /** Original prompt used for generation */
  prompt?: string;

  // Google GenAI file metadata
  /** GenAI file name/identifier */
  name?: string;
  /** MIME type of the generated file */
  mimeType?: string;
  /** ISO timestamp when the file was created */
  createTime?: string;
  /** ISO timestamp when the file expires */
  expirationTime?: string;
  /** ISO timestamp when the file was last updated */
  updateTime?: string;
  /** GenAI API URI for the file */
  uri?: string;
  /** Direct download URI from GenAI */
  downloadUri?: string;
  /** Source of the file (typically 'GENERATED') */
  source?: string;

  // Media-specific attributes
  /** File format/MIME type (usually same as mimeType) */
  format?: string;
  /** Video duration as string (e.g., '8s') */
  durationSec?: string;
}

/**
 * Database model for stored videos
 */
export interface StoredVideo {
  /** Unique identifier for the video record */
  id: string;
  /** S3 object key where the video is stored */
  s3Key: string;
  /** S3 bucket name */
  bucket: string;
  /** Original prompt used to generate the video */
  originalPrompt: string;
  /** User who generated the video (optional) */
  userId?: string;
  /** Timestamp when the record was created */
  createdAt: Date;
  /** Additional metadata from the generation process */
  metadata: VideoGenerationMetadata;
}

/**
 * Metadata associated with a generated video
 */
export interface VideoGenerationMetadata {
  /** GenAI file name */
  name?: string;
  /** File MIME type */
  mimeType?: string;
  /** Generation completion time */
  createTime?: string;
  /** File expiration time */
  expirationTime?: string;
  /** Last update time */
  updateTime?: string;
  /** GenAI URI */
  uri?: string;
  /** Download URI */
  downloadUri?: string;
  /** File source */
  source?: string;
  /** Video duration */
  durationSec?: string;
  /** File size in bytes (if available) */
  fileSize?: number;
  /** Generation quality setting used */
  quality?: string;
}

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  /** Error message */
  message: string;
  /** HTTP status code */
  status: number;
  /** Error code for client handling */
  code?: string;
  /** Additional error details */
  details?: Record<string, any>;
}