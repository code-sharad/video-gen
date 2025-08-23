import { useEffect, useState } from 'react';
import { listVideos, generateVideo, type ListedVideo } from './lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import './index.css';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<ListedVideo[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadVideos = async () => {
    try {
      setListLoading(true);
      const items = await listVideos(3600);
      setVideos(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load videos');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => { loadVideos(); }, []);

  const onGenerate = async () => {
    if (!prompt.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await generateVideo(prompt.trim());
      // allow backend time; then refresh list
      setPrompt('');
      await loadVideos();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Video Generator</h1>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span>Ctrl/⌘ + Enter to generate</span>
          </div>
        </div>

        <Card className="relative mb-8 border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Describe the scene</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="relative">
              <Textarea
                placeholder="E.g., A cinematic drone shot over snowy mountains at sunrise with warm lighting"
                value={prompt}
                className="h-44 pr-36"
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    onGenerate();
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-3">
                {loading && (
                  <p className="text-sm text-muted-foreground hidden md:block">Generating… ~1 min</p>
                )}
                <Button onClick={onGenerate} disabled={loading || !prompt.trim()}>
                  {loading ? 'Generating…' : 'Generate'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-4 rounded-md border border-red-300/60 bg-red-50 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Previous videos</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">{videos.length} items</span>
              <Button onClick={loadVideos} disabled={listLoading} className="h-8 px-3 text-xs">
                {listLoading ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>
          </div>

          {loading && (
            <div className="mb-6" aria-live="polite">
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="py-3 text-sm flex items-center gap-3">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Generating your video… This can take 1 minute or more. It will appear below automatically.
                </CardContent>
              </Card>
              <div className="mt-3 columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:balance]">
                {[...Array(3)].map((_, i) => (
                  <div key={`gen-skel-${i}`} className="mb-4 break-inside-avoid">
                    <div className={`animate-pulse rounded-lg bg-muted ${["h-48", "h-64", "h-80"][i % 3]} w-full`} />
                    <div className="mt-2 h-4 w-2/3 bg-muted animate-pulse rounded" />
                    <div className="mt-1 h-3 w-1/3 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {listLoading && videos.length === 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:balance]">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="mb-4 break-inside-avoid">
                  <div className={`animate-pulse rounded-lg bg-muted ${["h-40", "h-56", "h-72"][i % 3]} w-full`} />
                  <div className="mt-2 h-4 w-2/3 bg-muted animate-pulse rounded" />
                  <div className="mt-1 h-3 w-1/3 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No videos yet. Generate one above to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:balance]">
              {videos.map((v) => (
                <Card
                  key={v.key}
                  className="mb-4 break-inside-avoid overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md"
                >
                  <video src={v.url} controls className="w-full h-auto" />
                  <CardContent className="space-y-2">
                    <div className="text-sm font-medium truncate" title={v.key}>{v.key}</div>
                    <div className="flex items-center justify-between">
                      <div className="space-x-3 text-xs text-muted-foreground">
                        {v.lastModified && <span>Updated: {new Date(v.lastModified).toLocaleString()}</span>}
                        {typeof v.size === 'number' && <span>Size: {(v.size / (1024 * 1024)).toFixed(2)} MB</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild className="h-8 px-3 text-xs">
                          <a href={v.url} target="_blank" rel="noreferrer">Open</a>
                        </Button>
                        <Button
                          className="h-8 px-3 text-xs"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(v.url);
                              setCopiedKey(v.key);
                              setTimeout(() => setCopiedKey((k) => (k === v.key ? null : k)), 1500);
                            } catch {
                              // ignore copy errors silently
                            }
                          }}
                        >
                          {copiedKey === v.key ? 'Copied' : 'Copy link'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
