import { GoogleGenAI, type GoogleGenAIOptions } from "@google/genai";
import { config } from "../config/env.js";
import { type VideoGenerationRequest, type VideoGenerationResponse } from "../types/video.types.js";
import fs from "node:fs";
import path from "node:path";
import { Readable as NodeReadable } from 'node:stream';
import { s3Service } from "../services/s3service.js";

/**
 * Configuration constants for video generation
 */
const VIDEO_GENERATION_CONFIG = {
  MODEL: 'veo-3.0-generate-preview',
  POLLING_INTERVAL_MS: 10_000,
  TEMP_DIR: 'video_temp',
  FILE_WAIT_TIMEOUT_MS: 15_000,
  FILE_WAIT_INTERVAL_MS: 200,
  DEFAULT_EXPIRES_IN: 3600, // 1 hour
} as const;

/**
 * Interface for Google GenAI file metadata
 */
interface GenAIFileMetadata {
  name?: string;
  mimeType?: string;
  createTime?: string;
  expirationTime?: string;
  updateTime?: string;
  uri?: string;
  downloadUri?: string;
  source?: string;
  state?: string;
  videoMetadata?: {
    videoDuration?: string;
  };
}

/**
 * Service for interacting with Google's Veo video generation API
 * Handles video generation, S3 upload, and metadata management
 */
class VeoService {
  private readonly genAI: GoogleGenAI;

  constructor() {
    if (!config.googleApiKey) {
      throw new Error('Google API key is required for VeoService');
    }

    this.genAI = new GoogleGenAI({
      apiKey: config.googleApiKey
    });
  }

  /**
   * Generates a video using Google's Veo API and uploads it to S3
   * @param request - Video generation request containing prompt and options
   * @returns Promise<VideoGenerationResponse> - Generated video metadata and S3 info
   * @throws Error if video generation or upload fails
   */
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    try {
      console.log(`Starting video generation for prompt: "${request.prompt}"`);

      // 1. Initiate video generation
      const operation = await this.initiateVideoGeneration(request);

      // 2. Wait for completion
      const completedOperation = await this.waitForCompletion(operation);

      // 3. Extract video reference
      const videoRef = this.extractVideoReference(completedOperation);

      // 4. Generate S3 key and attempt upload
      const s3Key = this.generateS3Key();
      const uploadResult = await this.uploadVideoToS3(videoRef, s3Key);

      // 5. Fetch metadata and build response
      const metadata = await this.fetchFileMetadata(videoRef);
      return this.buildVideoResponse(uploadResult, request.prompt, metadata);

    } catch (error) {
      console.error('Video generation failed:', error);
      throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lists all videos stored in S3
   * @param expiresIn - Expiration time for presigned URLs in seconds
   * @returns Promise<Array> - List of videos with presigned URLs
   */
  async listVideos(expiresIn?: number): Promise<Array<{ key: string; url: string; size?: number; lastModified?: Date }>> {
    return s3Service.listVideos('videos/', expiresIn ?? VIDEO_GENERATION_CONFIG.DEFAULT_EXPIRES_IN);
  }

  // Private helper methods

  /**
   * Initiates video generation with Google GenAI
   */
  private async initiateVideoGeneration(request: VideoGenerationRequest) {
    return await this.genAI.models.generateVideos({
      model: VIDEO_GENERATION_CONFIG.MODEL,
      prompt: request.prompt,
    });
  }

  /**
   * Waits for video generation to complete by polling the operation
   */
  private async waitForCompletion(operation: any) {
    let currentOperation = operation;

    while (!currentOperation.done) {
      console.log('Waiting for video generation to complete...');
      await this.sleep(VIDEO_GENERATION_CONFIG.POLLING_INTERVAL_MS);
      currentOperation = await this.genAI.operations.getVideosOperation({ operation: currentOperation });
    }

    if (currentOperation.error) {
      console.error('Generation operation failed:', currentOperation.error);
      throw new Error(`Video generation failed: ${currentOperation.error.message}`);
    }

    return currentOperation;
  }

  /**
   * Extracts video reference from completed operation
   */
  private extractVideoReference(operation: any) {
    const videoRef = operation.response?.generatedVideos?.[0]?.video;
    if (!videoRef) {
      throw new Error('No video generated in the response');
    }
    return videoRef;
  }

  /**
   * Generates a unique S3 key for the video
   */
  private generateS3Key(): string {
    const timestamp = Date.now();
    return `videos/${timestamp}.mp4`;
  }

  /**
   * Uploads video to S3 using streaming or disk fallback
   */
  private async uploadVideoToS3(videoRef: any, s3Key: string) {
    const downloadUri = this.extractDownloadUri(videoRef);

    if (downloadUri) {
      try {
        return await this.streamVideoToS3(downloadUri, s3Key);
      } catch (error) {
        console.warn('Direct streaming to S3 failed, falling back to disk download:', error);
      }
    }

    // Fallback to disk download and upload
    return await this.diskDownloadAndUpload(videoRef, s3Key);
  }

  /**
   * Extracts download URI from video reference
   */
  private extractDownloadUri(videoRef: any): string | undefined {
    return videoRef?.uri || videoRef?.downloadUri || videoRef?.fileUrl;
  }

  /**
   * Streams video directly from Google API to S3
   */
  private async streamVideoToS3(downloadUri: string, s3Key: string) {
    console.log('Streaming video directly to S3 from URI');

    const headers = this.buildRequestHeaders(downloadUri);
    const response = await fetch(downloadUri, { headers });

    if (!response.ok || !response.body) {
      throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }

    const nodeStream = NodeReadable.fromWeb(response.body as any);
    return await s3Service.uploadMp4Buffer(nodeStream, s3Key, { contentType: 'video/mp4' });
  }

  /**
   * Downloads video to disk and then uploads to S3
   */
  private async diskDownloadAndUpload(videoRef: any, s3Key: string) {
    console.log('Downloading video to disk before S3 upload');

    const tempDir = path.resolve(process.cwd(), VIDEO_GENERATION_CONFIG.TEMP_DIR);
    await fs.promises.mkdir(tempDir, { recursive: true });

    const tempPath = path.join(tempDir, `video-${Date.now()}.mp4`);

    try {
      await this.genAI.files.download({ file: videoRef, downloadPath: tempPath });
      await this.waitForFile(tempPath);

      const { size } = await fs.promises.stat(tempPath);
      const result = await s3Service.uploadMp4Buffer(
        fs.createReadStream(tempPath),
        s3Key,
        { contentType: 'video/mp4', contentLength: size }
      );

      // Clean up temp file
      await fs.promises.unlink(tempPath).catch(console.warn);

      return result;
    } catch (error) {
      // Clean up temp file on error
      await fs.promises.unlink(tempPath).catch(() => { });
      throw error;
    }
  }

  /**
   * Builds request headers for Google API calls
   */
  private buildRequestHeaders(downloadUri: string): Record<string, string> {
    const headers: Record<string, string> = {};
    const url = new URL(downloadUri);

    if (url.host.includes('googleapis.com') || url.host.includes('googleusercontent.com')) {
      headers['x-goog-api-key'] = config.googleApiKey;
    }

    return headers;
  }

  /**
   * Fetches file metadata from Google GenAI
   */
  private async fetchFileMetadata(videoRef: any): Promise<GenAIFileMetadata | undefined> {
    try {
      const fileName = videoRef?.name || this.parseFileNameFromUri(videoRef?.uri);

      if (fileName) {
        return await this.genAI.files.get({ name: fileName });
      }

      console.warn('No file name available for metadata fetch');
      return undefined;
    } catch (error) {
      console.warn('Failed to fetch file metadata (non-fatal):', error);
      return undefined;
    }
  }

  /**
   * Parses file name from URI
   */
  private parseFileNameFromUri(uri?: string): string | undefined {
    if (!uri) return undefined;

    try {
      const url = new URL(uri);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1] || '';

      // Remove :download suffix if present
      return lastPart.includes(':') ? lastPart.split(':')[0] : lastPart;
    } catch {
      return undefined;
    }
  }

  /**
   * Builds the final video response with metadata
   */
  private buildVideoResponse(
    uploadResult: { key: string; publicUrl: string },
    prompt: string,
    metadata?: GenAIFileMetadata
  ): VideoGenerationResponse {
    const response: VideoGenerationResponse = {
      status: metadata?.state || 'ACTIVE',
      s3Key: uploadResult.key,
      publicUrl: uploadResult.publicUrl,
      prompt,
    };

    // Add metadata fields only if they exist
    if (metadata) {
      if (metadata.name) response.name = metadata.name;
      if (metadata.mimeType) {
        response.mimeType = metadata.mimeType;
        response.format = metadata.mimeType;
      }
      if (metadata.createTime) response.createTime = metadata.createTime;
      if (metadata.expirationTime) response.expirationTime = metadata.expirationTime;
      if (metadata.updateTime) response.updateTime = metadata.updateTime;
      if (metadata.uri) response.uri = metadata.uri;
      if (metadata.downloadUri) response.downloadUri = metadata.downloadUri;
      if (metadata.source) response.source = metadata.source;

      const duration = metadata.videoMetadata?.videoDuration;
      if (duration !== undefined && duration !== null) {
        response.durationSec = String(duration);
      }
    }

    return response;
  }

  /**
   * Waits for a file to exist on disk
   */
  private async waitForFile(filePath: string): Promise<void> {
    const startTime = Date.now();
    const { FILE_WAIT_TIMEOUT_MS, FILE_WAIT_INTERVAL_MS } = VIDEO_GENERATION_CONFIG;

    while (true) {
      try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        return; // File exists
      } catch {
        if (Date.now() - startTime > FILE_WAIT_TIMEOUT_MS) {
          throw new Error(`File not found after ${FILE_WAIT_TIMEOUT_MS}ms: ${filePath}`);
        }
        await this.sleep(FILE_WAIT_INTERVAL_MS);
      }
    }
  }

  /**
   * Utility sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const veoService = new VeoService();