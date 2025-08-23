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
  const res = await fetch(`/api/videos/list${qs}`);
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  const json: ApiResponse<Array<{ key: string; url: string; size?: number; lastModified?: string | Date }>> = await res.json();
  if (!json.success || !json.data) throw new Error(json.error || 'Unknown error');
  return json.data.map(v => ({ ...v, lastModified: v.lastModified ? new Date(v.lastModified as string | Date).toString() : undefined }));
}

export async function generateVideo(prompt: string): Promise<string> {
  const res = await fetch('/api/videos/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  const json: ApiResponse<{ publicUrl: string }> = await res.json();
  if (!res.ok || !json.success || !json.data) throw new Error(json.error || 'Generate failed');
  return json.data.publicUrl;
}
