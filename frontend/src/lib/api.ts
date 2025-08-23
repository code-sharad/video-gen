/**
 * Configuration for API client
 */
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
  enableLogging: import.meta.env.VITE_ENABLE_LOGGING === 'true',
} as const;

/**
 * Enhanced fetch wrapper with error handling and logging
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('/api')
    ? `${API_CONFIG.baseUrl}${endpoint}`
    : `${API_CONFIG.baseUrl}/api${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  if (API_CONFIG.enableLogging) {
    console.log(`🌐 API ${options.method || 'GET'}: ${url}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    const data: ApiResponse<T> = await response.json();

    if (API_CONFIG.enableLogging) {
      console.log(`✅ API Response [${response.status}]:`, data);
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (API_CONFIG.enableLogging) {
      console.error('❌ API Error:', error);
    }
    throw error;
  }
}

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type ListedVideo = {
  key: string;
  url: string; // presigned GET url
  size?: number;
  lastModified?: string; // ISO string for client
};

export async function listVideos(expiresIn?: number): Promise<ListedVideo[]> {
  const qs = expiresIn ? `?expiresIn=${encodeURIComponent(expiresIn)}` : '';
  const response = await apiRequest<Array<{ key: string; url: string; size?: number; lastModified?: string | Date }>>(`/videos/list${qs}`);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to list videos');
  }

  return response.data.map(v => ({
    ...v,
    lastModified: v.lastModified ? new Date(v.lastModified as string | Date).toISOString() : undefined
  }));
}

export async function generateVideo(prompt: string): Promise<string> {
  const response = await apiRequest<{ publicUrl: string }>('/videos/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to generate video');
  }

  return response.data.publicUrl;
}
