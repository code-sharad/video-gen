import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, ExternalLink, Copy, Check } from 'lucide-react';
import type { ListedVideo } from '@/lib/api';

interface VideoListProps {
  videos: ListedVideo[];
  loading: boolean;
  onRefresh: () => void;
}

const VideoSkeleton = ({ index }: { index: number }) => {
  const heights = ["h-40", "h-56", "h-72"];
  return (
    <div className="mb-4 break-inside-avoid">
      <div className={`animate-pulse rounded-lg bg-muted/50 ${heights[index % 3]} w-full`} />
      <div className="mt-2 h-4 w-2/3 bg-muted/50 animate-pulse rounded" />
      <div className="mt-1 h-3 w-1/3 bg-muted/50 animate-pulse rounded" />
    </div>
  );
};

const VideoCard = ({ video }: { video: ListedVideo }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(video.url);
      setCopiedKey(video.key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // Ignore copy errors silently
    }
  };

  return (
    <Card className="mb-4 break-inside-avoid overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md hover:border-border/60">
      <div className="relative group">
        <video
          src={video.url}
          controls
          className="w-full h-auto bg-muted/20"
          preload="metadata"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
      </div>

      <CardContent className="p-3 space-y-2">


        <div className="flex items-center justify-between">
          <div className="space-y-1 text-xs text-muted-foreground">
            {video.lastModified && (
              <div className="flex items-center gap-1">
                <span>Updated:</span>
                <span>{new Date(video.lastModified).toLocaleDateString()}</span>
              </div>
            )}
            {typeof video.size === 'number' && (
              <div className="flex items-center gap-1">
                <span>Size:</span>
                <span>{(video.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
              <a href={video.url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Open
              </a>
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={handleCopyLink}
            >
              {copiedKey === video.key ? (
                <>
                  <Check className="h-3 w-3 mr-1 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function VideoList({ videos, loading, onRefresh }: VideoListProps) {
  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Previous Videos</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {videos.length} {videos.length === 1 ? 'video' : 'videos'}
          </span>
          <Button
            onClick={onRefresh}
            disabled={loading}
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {loading && videos.length === 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-fill:balance]">
          {[...Array(6)].map((_, i) => (
            <VideoSkeleton key={i} index={i} />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <Card className="border-dashed border-border/50 bg-muted/20">
          <CardContent className="py-12 text-center">
            <div className="text-sm text-muted-foreground">
              No videos yet. Generate your first video above to get started.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-fill:balance]">
          {videos.map((video) => (
            <VideoCard key={video.key} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
