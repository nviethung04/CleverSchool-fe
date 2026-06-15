"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import {
  canUseOfficeOnlineEmbed,
  getOfficeOnlineEmbedUrl,
} from "@/lib/utils/office-preview";

const PptxLocalViewer = dynamic(
  () =>
    import("./pptx-local-viewer").then((module) => module.PptxLocalViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-video items-center justify-center rounded-lg border bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    ),
  }
);

interface OfficeSlidePreviewProps {
  url: string;
  title: string;
}

export function OfficeSlidePreview({ url, title }: OfficeSlidePreviewProps) {
  if (canUseOfficeOnlineEmbed(url)) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-lg border bg-white">
        <iframe
          src={getOfficeOnlineEmbedUrl(url)}
          title={title}
          className="h-full w-full"
          allowFullScreen
        />
      </div>
    );
  }

  return <PptxLocalViewer url={url} title={title} />;
}
