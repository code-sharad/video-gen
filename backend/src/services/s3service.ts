import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  type ListObjectsV2CommandOutput
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/env.js';
import { Readable } from 'stream';

/**
 * Result of an S3 upload operation
 */
export interface S3UploadResult {
  /** S3 object key */
  key: string;
  /** Presigned URL for accessing the object */
  url: string;
  /** Public URL (if bucket allows public access) */
  publicUrl: string;
  /** S3 bucket name */
  bucket: string;
}

/**
 * Options for S3 upload operations
 */
export interface S3UploadOptions {
  /** MIME content type */
  contentType?: string;
  /** Custom metadata to attach to the object */
  metadata?: Record<string, string>;
  /** Expiration time for presigned URL in seconds */
  expiresIn?: number;
  /** Content length in bytes (helpful for streaming uploads) */
  contentLength?: number;
}

/**
 * Configuration constants for S3 operations
 */
const S3_CONFIG = {
  DEFAULT_EXPIRES_IN: 3600, // 1 hour
  MULTIPART_QUEUE_SIZE: 3,
  MULTIPART_PART_SIZE: 8 * 1024 * 1024, // 8 MB
} as const;


/**
 * Service for managing S3 operations including video uploads and file management
 * Provides secure access through presigned URLs and handles multipart uploads
 */
class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly bucketRegion: string;

  constructor() {
    // Validate required configuration
    if (!config.aws.accessKeyId || !config.aws.secretAccessKey) {
      throw new Error('AWS credentials are required for S3Service');
    }
    if (!config.aws.s3.bucketName) {
      throw new Error('S3 bucket name is required');
    }

    // Initialize S3 client
    this.bucketRegion = config.aws.s3.bucketRegion || config.aws.region;
    this.bucketName = config.aws.s3.bucketName;

    this.s3Client = new S3Client({
      region: this.bucketRegion,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
  }

  /**
   * Uploads a video file (buffer or stream) to S3 using multipart upload
   * @param buffer - File buffer or readable stream
   * @param key - S3 object key (path within bucket)
   * @param options - Upload options including content type and metadata
   * @returns Promise<S3UploadResult> - Upload result with URLs and metadata
   * @throws Error if upload fails
   */
  async uploadMp4Buffer(
    buffer: Buffer | Readable,
    key: string,
    options: S3UploadOptions = {}
  ): Promise<S3UploadResult> {
    try {
      console.log(`Starting S3 upload for key: ${key}`);

      const uploadParams = this.buildUploadParams(buffer, key, options);

      // Use multipart upload for reliability with large files and streams
      const uploader = new Upload({
        client: this.s3Client,
        params: uploadParams,
        queueSize: S3_CONFIG.MULTIPART_QUEUE_SIZE,
        partSize: S3_CONFIG.MULTIPART_PART_SIZE,
        leavePartsOnError: false,
      });

      await uploader.done();
      console.log(`S3 upload completed for key: ${key}`);

      return this.buildUploadResult(key, options.expiresIn);
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates a presigned URL for secure access to an S3 object
   * @param key - S3 object key
   * @param expiresIn - URL expiration time in seconds
   * @returns Promise<string> - Presigned URL
   */
  async getSignedUrl(key: string, expiresIn: number = S3_CONFIG.DEFAULT_EXPIRES_IN): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Lists all videos in S3 with presigned URLs
   * @param prefix - S3 key prefix to filter objects
   * @param expiresIn - URL expiration time in seconds
   * @returns Promise<Array> - List of videos with metadata and presigned URLs
   */
  async listVideos(
    prefix: string = 'videos/',
    expiresIn: number = S3_CONFIG.DEFAULT_EXPIRES_IN
  ): Promise<Array<{ key: string; url: string; size?: number; lastModified?: Date }>> {
    const results: Array<{ key: string; url: string; size?: number; lastModified?: Date }> = [];
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await this.s3Client.send(command) as ListObjectsV2CommandOutput;
      const objects = response.Contents || [];

      // Process each object and generate presigned URL
      for (const obj of objects) {
        if (!obj.Key) continue;

        const url = await this.getSignedUrl(obj.Key, expiresIn);
        const item: { key: string; url: string; size?: number; lastModified?: Date } = {
          key: obj.Key,
          url,
        };

        // Add optional metadata if available
        if (typeof obj.Size === 'number') item.size = obj.Size;
        if (obj.LastModified) item.lastModified = obj.LastModified;

        results.push(item);
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return results.sort((a, b) => {
      // Sort by last modified date, newest first
      if (!a.lastModified && !b.lastModified) return 0;
      if (!a.lastModified) return 1;
      if (!b.lastModified) return -1;
      return b.lastModified.getTime() - a.lastModified.getTime();
    });
  }

  // Private helper methods

  /**
   * Builds upload parameters for S3 operation
   */
  private buildUploadParams(buffer: Buffer | Readable, key: string, options: S3UploadOptions) {
    const params: any = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: options.contentType || 'video/mp4',
      Metadata: options.metadata || {},
    };

    // Add content length if provided (helpful for streaming)
    if (typeof options.contentLength === 'number') {
      params.ContentLength = options.contentLength;
    }

    return params;
  }

  /**
   * Builds the upload result with URLs
   */
  private async buildUploadResult(key: string, expiresIn?: number): Promise<S3UploadResult> {
    const publicUrl = `https://${this.bucketName}.s3.${this.bucketRegion}.amazonaws.com/${key}`;
    const signedUrl = await this.getSignedUrl(key, expiresIn);

    return {
      key,
      url: signedUrl,
      publicUrl,
      bucket: this.bucketName,
    };
  }
}

export const s3Service = new S3Service();