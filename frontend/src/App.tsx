import { useEffect, useState } from 'react';
import { listVideos, generateVideo, type ListedVideo } from './lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Zap, Command } from 'lucide-react';

import VideoList from './components/VideoList';
import GenerationProgress from './components/GenerationProgress';
import ThemeToggle from './components/ThemeToggle';
import './index.css';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<ListedVideo[]>([]);
  const [listLoading, setListLoading] = useState(false);

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

  useEffect(() => {
    loadVideos();
  }, []);

  const onGenerate = async () => {
    if (!prompt.trim()) return;
    setError(null);
    setLoading(true);

    try {
      await generateVideo(prompt.trim());
      setPrompt('');
      // Refresh the list after generation
      await loadVideos();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <>

      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Video Generator AI 🎬
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <Command className="h-3 w-3" />
                <span>Ctrl/⌘ + Enter to generate</span>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* Generation Form */}
          <Card className="relative mb-6 border-none bg-transparent backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-3 ">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Describe your video scene
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="relative">
                <Textarea
                  placeholder="E.g., A cinematic drone shot over snowy mountains at sunrise with warm golden lighting..."
                  value={prompt}
                  className="min-h-[120px] -z-10 resize-none bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                />

                <div className="absolute bottom-3 bg-black rounded-lg right-3 flex items-center gap-3">
                  {loading && (
                    <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                      <span>Generating...</span>
                    </div>
                  )}

                  <Button
                    onClick={onGenerate}
                    disabled={loading || !prompt.trim()}
                    className=" z-10 bg-black  text-white hover:bg-primary/90  shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2 " />
                          <span className="hidden md:inline">Generate Video</span>
                          <span className="md:hidden">Generate</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive px-4 py-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
                {error}
              </div>
            </div>
          )}

          {/* Generation Progress */}
          {loading && <GenerationProgress />}

          {/* Video List */}
          <VideoList
            videos={videos}
            loading={listLoading}
            onRefresh={loadVideos}
          />
        </div>
      </div>
    </>
  );
}
