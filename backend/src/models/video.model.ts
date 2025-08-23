import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * MongoDB schema for video documents
 * Stores video metadata, S3 information, and GenAI file details
 */
const VideoSchema = new Schema({
  // Core video information
  /** Original prompt used to generate the video */
  prompt: {
    type: String,
    required: [true, 'Prompt is required'],
    trim: true,
    maxlength: [1000, 'Prompt cannot exceed 1000 characters']
  },

  /** S3 object key where the video file is stored */
  s3Key: {
    type: String,
    required: [true, 'S3 key is required'],
    unique: true,
    index: true
  },

  /** Current status of the video */
  status: {
    type: String,
    enum: {
      values: ['ACTIVE', 'PROCESSING', 'FAILED', 'EXPIRED'],
      message: 'Status must be one of: ACTIVE, PROCESSING, FAILED, EXPIRED'
    },
    default: 'ACTIVE',
    index: true
  },

  /** Video file format */
  format: {
    type: String,
    default: 'video/mp4',
    trim: true
  },

  // Video properties
  /** File size in bytes */
  sizeBytes: {
    type: Number,
    min: [0, 'Size cannot be negative']
  },

  /** Video duration as string (e.g., '8s') */
  durationSec: {
    type: String,
    trim: true
  },

  /** Video width in pixels */
  width: {
    type: Number,
    min: [1, 'Width must be positive']
  },

  /** Video height in pixels */
  height: {
    type: Number,
    min: [1, 'Height must be positive']
  },

  /** Error message if generation failed */
  error: {
    type: String,
    trim: true
  },

  // Google GenAI metadata snapshot
  /** GenAI file name/identifier */
  name: {
    type: String,
    trim: true,
    index: true
  },

  /** MIME type from GenAI */
  mimeType: {
    type: String,
    trim: true
  },

  /** ISO timestamp when the file was created in GenAI */
  createTime: {
    type: String,
    trim: true
  },

  /** ISO timestamp when the file expires in GenAI */
  expirationTime: {
    type: String,
    trim: true
  },

  /** ISO timestamp when the file was last updated in GenAI */
  updateTime: {
    type: String,
    trim: true
  },

  /** GenAI API URI for the file */
  uri: {
    type: String,
    trim: true
  },

  /** Direct download URI from GenAI */
  downloadUri: {
    type: String,
    trim: true
  },

  /** Source of the file (typically 'GENERATED') */
  source: {
    type: String,
    trim: true,
    default: 'GENERATED'
  },

  // Optional user tracking
  /** User ID who generated the video */
  userId: {
    type: String,
    trim: true,
    index: true
  },

  // Technical metadata
  /** Generation quality setting used */
  quality: {
    type: String,
    enum: ['low', 'medium', 'high'],
    trim: true
  },

  /** Additional metadata object for extensibility */
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'videos'
});

// Indexes for better query performance
VideoSchema.index({ createdAt: -1 }); // Sort by creation date
VideoSchema.index({ status: 1, createdAt: -1 }); // Filter by status and sort
VideoSchema.index({ userId: 1, createdAt: -1 }); // User's videos sorted by date

// Virtual for computed properties
VideoSchema.virtual('age').get(function () {
  return Date.now() - this.createdAt.getTime();
});

VideoSchema.virtual('isExpired').get(function () {
  if (!this.expirationTime) return false;
  return new Date(this.expirationTime) < new Date();
});

// Instance methods
VideoSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  delete obj.metadata; // Hide internal metadata
  return obj;
};

// Static methods
VideoSchema.statics.findByUserId = function (userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

VideoSchema.statics.findActiveVideos = function () {
  return this.find({ status: 'ACTIVE' }).sort({ createdAt: -1 });
};

VideoSchema.statics.findExpiredVideos = function () {
  const now = new Date().toISOString();
  return this.find({
    expirationTime: { $exists: true, $lt: now },
    status: 'ACTIVE'
  });
};

// Pre-save middleware
VideoSchema.pre('save', function (next) {
  // Update status if expired
  if (this.expirationTime && this.status === 'ACTIVE') {
    const isExpired = new Date(this.expirationTime) < new Date();
    if (isExpired) {
      this.status = 'EXPIRED';
    }
  }
  next();
});

/**
 * TypeScript type for video documents
 */
export type VideoDocument = InferSchemaType<typeof VideoSchema> & {
  _id: any;
  createdAt: Date;
  updatedAt: Date;
  age: number;
  isExpired: boolean;
  toPublicJSON(): any;
};

/**
 * Video model interface with static methods
 */
interface VideoModel extends VideoDocument {
  findByUserId(userId: string): Promise<VideoDocument[]>;
  findActiveVideos(): Promise<VideoDocument[]>;
  findExpiredVideos(): Promise<VideoDocument[]>;
}

/**
 * Mongoose model for video documents
 */
export const VideoModel = model<VideoDocument>('Video', VideoSchema);
