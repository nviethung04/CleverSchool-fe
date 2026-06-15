"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PPTXViewer } from "pptxviewjs";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface PptxLocalViewerProps {
  url: string;
  title: string;
}

export function PptxLocalViewer({ url, title }: PptxLocalViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<PPTXViewer | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas || !url) return;

    const loadPresentation = async () => {
      setLoading(true);
      setError(null);

      try {
        viewerRef.current?.destroy();
        const viewer = new PPTXViewer({ canvas, slideSizeMode: "fit" });
        viewerRef.current = viewer;

        await viewer.loadFromUrl(url);
        if (cancelled) return;

        const count = viewer.getSlideCount();
        setSlideCount(count);
        setSlideIndex(viewer.getCurrentSlideIndex());
        await viewer.render(canvas);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Không thể tải bài trình chiếu"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPresentation();

    return () => {
      cancelled = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [url]);

  const goToSlide = useCallback(async (index: number) => {
    const viewer = viewerRef.current;
    const canvas = canvasRef.current;
    if (!viewer || !canvas) return;

    await viewer.goToSlide(index, canvas);
    setSlideIndex(viewer.getCurrentSlideIndex());
  }, []);

  if (error) {
    return (
      <div className="aspect-video flex flex-col items-center justify-center gap-4 rounded-lg border bg-gray-50 p-8">
        <p className="text-center text-sm text-gray-600">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(url, "_blank")}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Mở file
          </Button>
          <Button variant="outline" asChild>
            <a href={url} download>
              <Download className="mr-2 h-4 w-4" />
              Tải xuống
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex aspect-video flex-col overflow-hidden rounded-lg border bg-white">
      <div className="relative flex flex-1 items-center justify-center bg-gray-100">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="max-h-full max-w-full"
          aria-label={title}
        />
      </div>
      {slideCount > 1 && (
        <div className="flex items-center justify-between border-t bg-white px-4 py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void goToSlide(slideIndex - 1)}
            disabled={slideIndex === 0 || loading}
            aria-label="Slide trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">
            {slideIndex + 1} / {slideCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void goToSlide(slideIndex + 1)}
            disabled={slideIndex >= slideCount - 1 || loading}
            aria-label="Slide tiếp"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
