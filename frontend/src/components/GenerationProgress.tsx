import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Clock, Sparkles } from 'lucide-react';

const ProgressSkeleton = ({ index }: { index: number }) => {
  const heights = ["h-48", "h-64", "h-80"];
  return (
    <div className="mb-4 break-inside-avoid">
      <div className={`animate-pulse rounded-lg bg-gradient-to-br from-muted/30 to-muted/60 ${heights[index % 3]} w-full`} />
      <div className="mt-2 h-4 w-2/3 bg-muted/50 animate-pulse rounded" />
      <div className="mt-1 h-3 w-1/3 bg-muted/50 animate-pulse rounded" />
    </div>
  );
};

export default function GenerationProgress() {
  return (
    <div className="mb-6" aria-live="polite">
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur-sm">
        <CardContent className="py-4 text-sm flex items-center gap-3">
          <div className="relative flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <Sparkles className="h-3 w-3 text-primary/70" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <span>Generating your video...</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>This can take 1-2 minutes. It will appear below automatically.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:balance]">
        {[...Array(3)].map((_, i) => (
          <ProgressSkeleton key={`gen-skel-${i}`} index={i} />
        ))}
      </div>
    </div>
  );
}
