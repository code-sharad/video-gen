import { Router } from 'express';
import type { Response, Request } from 'express';
import { veoService } from '../services/veoService.js';
import type { ApiResponse } from '../types/index.js';
import type {
  VideoGenerationRequest,
  VideoGenerationResponse,
} from '../types/video.types.js';
import { s3Service } from '../services/s3service.js';
import { VideoModel } from '../models/video.model.js';

/**
 * Express router for video-related endpoints
 * Handles video generation, retrieval, and listing operations
 */
const router: Router = Router();

/**
 * GET /videos/list - List all available videos with presigned URLs
 * @query expiresIn - URL expiration time in seconds (60-86400)
 * @returns Array of video metadata with presigned URLs
 */
router.get('/list', async (req: Request, res: Response<ApiResponse<Array<{ key: string; url: string; size?: number; lastModified?: Date }>>>) => {
  try {
    const expiresInRaw = req.query.expiresIn as string | undefined;
    const expiresIn = expiresInRaw
      ? Math.max(60, Math.min(86400, Number(expiresInRaw))) // 1 minute to 24 hours
      : 3600; // Default 1 hour

    // const videos = await veoService.listVideos(expiresIn);
    const videos = await VideoModel.find();
    const formattedVideos = await Promise.all(videos.map(async (video) => {
      const url = await s3Service.getSignedUrl(video.s3Key, expiresIn);
      return {
        key: video.s3Key,
        url: url,
        lastModified: video.updatedAt
      };
    }));
    return res.status(200).json({
      success: true,
      data: formattedVideos,
      message: `Retrieved ${videos.length} videos successfully`
    });
  } catch (error) {
    console.error('Error listing videos:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list videos'
    });
  }
});


/**
 * POST /videos/generate - Generate a new video using AI
 * @body VideoGenerationRequest - Generation parameters including prompt
 * @returns VideoGenerationResponse - Generated video metadata and URLs
 */
router.post('/generate', async (req: Request, res: Response<ApiResponse<VideoGenerationResponse>>) => {
  try {
    // Validate request body
    const generationRequest = validateGenerationRequest(req.body);
    if (!generationRequest.isValid) {
      return res.status(400).json({
        success: false,
        error: generationRequest.error
      });
    }

    console.log(`Starting video generation for prompt: "${generationRequest.data.prompt}"`);
    const response = await veoService.generateVideo(generationRequest.data);

    // Persist to database if we have an S3 key
    if (response.s3Key) {
      try {
        await VideoModel.create({
          prompt: response.prompt || generationRequest.data.prompt,
          s3Key: response.s3Key,
          status: response.status || 'ACTIVE',
          format: response.format || 'video/mp4',
          durationSec: response.durationSec,
          // GenAI metadata
          name: response.name,
          mimeType: response.mimeType,
          createTime: response.createTime,
          expirationTime: response.expirationTime,
          updateTime: response.updateTime,
          uri: response.uri,
          downloadUri: response.downloadUri,
          source: response.source,
        });
        console.log(`Video record saved to database with S3 key: ${response.s3Key}`);
      } catch (dbError) {
        console.warn('Failed to save video to database (non-fatal):', dbError);
      }
    }

    return res.status(200).json({
      success: true,
      data: response,
      message: 'Video generated successfully'
    });
  } catch (error) {
    console.error('Error generating video:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate video'
    });
  }
});

// Helper functions

/**
 * Validates video generation request
 */
function validateGenerationRequest(body: any):
  | { isValid: true; data: VideoGenerationRequest }
  | { isValid: false; error: string } {

  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body is required' };
  }

  const { prompt, duration, quality, userId } = body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return { isValid: false, error: 'Prompt is required and must be a non-empty string' };
  }

  if (prompt.length > 1000) {
    return { isValid: false, error: 'Prompt must be less than 1000 characters' };
  }


  return {
    isValid: true,
    data: {
      prompt: prompt.trim(),
      duration,
      quality,
      userId: userId?.trim(),
    }
  };
}

export { router as videoRoutes };