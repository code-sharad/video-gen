import mongoose from 'mongoose';

/**
 * MongoDB connection state tracking
 */
let isConnected = false;

/**
 * MongoDB connection configuration
 */
const CONNECTION_CONFIG = {
  // Connection timeout
  serverSelectionTimeoutMS: 5000,
  // Socket timeout
  socketTimeoutMS: 45000,
  // Automatically create indexes
  autoIndex: true,
  // Buffer commands when not connected
  bufferCommands: false,
  // Max time to wait for a connection to be established
  connectTimeoutMS: 10000,
  // Heartbeat frequency
  heartbeatFrequencyMS: 10000,
  // Retry writes
  retryWrites: true,
  // Write concern
  writeConcern: {
    w: 'majority',
    j: true,
    wtimeout: 1000
  }
} as const;

/**
 * Connects to MongoDB with proper error handling and retry logic
 * @param uri - MongoDB connection URI
 * @returns Promise<typeof mongoose> - Mongoose instance
 * @throws Error if connection fails
 */
export async function connectMongo(uri?: string): Promise<typeof mongoose> {
  const connectionUri = uri || process.env.MONGODB_URL;

  if (!connectionUri) {
    throw new Error('MongoDB URI is required. Please set MONGODB_URL environment variable.');
  }

  // Return existing connection if already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('📡 Using existing MongoDB connection');
    return mongoose;
  }

  try {
    console.log('🔌 Connecting to MongoDB...');

    // Set up connection event listeners
    setupConnectionListeners();

    // Connect to MongoDB
    const connection = await mongoose.connect(connectionUri, CONNECTION_CONFIG);

    isConnected = true;
    console.log('✅ MongoDB connected successfully');
    console.log(`   - Database: ${connection.connection.name}`);
    console.log(`   - Host: ${connection.connection.host}:${connection.connection.port}`);

    return connection;
  } catch (error) {
    isConnected = false;
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

/**
 * Sets up MongoDB connection event listeners for monitoring
 */
function setupConnectionListeners(): void {
  // Connection successful
  mongoose.connection.on('connected', () => {
    console.log('📡 Mongoose connected to MongoDB');
  });

  // Connection error
  mongoose.connection.on('error', (error) => {
    console.error('❌ Mongoose connection error:', error);
    isConnected = false;
  });

  // Connection disconnected
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  Mongoose disconnected from MongoDB');
    isConnected = false;
  });

  // Connection reconnected
  mongoose.connection.on('reconnected', () => {
    console.log('🔄 Mongoose reconnected to MongoDB');
    isConnected = true;
  });

  // MongoDB server discovery and monitoring events
  mongoose.connection.on('serverHeartbeatSucceeded', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('💓 MongoDB heartbeat succeeded');
    }
  });

  mongoose.connection.on('serverHeartbeatFailed', (error) => {
    console.warn('💔 MongoDB heartbeat failed:', error);
  });
}

/**
 * Gracefully closes the MongoDB connection
 * @returns Promise<void>
 */
export async function disconnectMongo(): Promise<void> {
  if (!isConnected) {
    console.log('📡 MongoDB is not connected');
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    console.log('👋 MongoDB connection closed successfully');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    throw error;
  }
}

/**
 * Checks if MongoDB is connected
 * @returns boolean - Connection status
 */
export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Gets MongoDB connection information
 * @returns Object with connection details
 */
export function getConnectionInfo() {
  const connection = mongoose.connection;
  const stateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    isConnected: isMongoConnected(),
    readyState: connection.readyState,
    name: connection.name,
    host: connection.host,
    port: connection.port,
    state: stateMap[connection.readyState] || 'unknown'
  };
}
