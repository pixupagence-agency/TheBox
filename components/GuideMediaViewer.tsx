"use client";

import React, { useState } from "react";
import { getMediaType, getEmbedUrl } from "@/lib/userGuideData";
import { Film, Image as ImageIcon, AlertCircle } from "lucide-react";

interface GuideMediaViewerProps {
  url?: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
}

export default function GuideMediaViewer({
  url,
  title = "Démonstration de la fonctionnalité",
  className = "",
  autoPlay = false
}: GuideMediaViewerProps) {
  const [loadError, setLoadError] = useState(false);
  const mediaType = getMediaType(url);

  if (!url || mediaType === "none") {
    return (
      <div className={`rounded-xl border border-dashed border-slate-700 bg-black/30 p-8 flex flex-col items-center justify-center text-center text-slate-400 ${className}`}>
        <Film className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-xs font-semibold">Aucun média vidéo ou image configuré</p>
        <p className="text-[10px] text-slate-500 mt-1">L&apos;administrateur peut ajouter une URL de vidéo (.mp4, YouTube) ou une image animée.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`rounded-xl border border-rose-500/30 bg-rose-950/20 p-6 flex flex-col items-center justify-center text-center text-rose-300 ${className}`}>
        <AlertCircle className="w-7 h-7 mb-2 text-rose-400" />
        <p className="text-xs font-bold">Impossible de charger le média</p>
        <p className="text-[10px] text-rose-400/80 mt-1 font-mono break-all max-w-md">{url}</p>
        <button
          type="button"
          onClick={() => setLoadError(false)}
          className="mt-3 px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-bold border border-rose-500/40 transition cursor-pointer"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (mediaType === "youtube" || mediaType === "vimeo") {
    const embedUrl = getEmbedUrl(url);
    return (
      <div className={`relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-black/40 shadow-inner ${className}`}>
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
          onError={() => setLoadError(true)}
        />
      </div>
    );
  }

  if (mediaType === "video") {
    return (
      <div className={`relative w-full max-h-96 rounded-xl overflow-hidden bg-black border border-black/40 shadow-inner flex items-center justify-center ${className}`}>
        <video
          key={url}
          controls
          loop
          playsInline
          autoPlay={autoPlay}
          muted={autoPlay}
          onError={() => setLoadError(true)}
          className="w-full h-auto max-h-96 object-contain"
        >
          <source src={url} />
          Votre navigateur ne supporte pas la lecture de cette vidéo.
        </video>
      </div>
    );
  }

  // Image / animated WebP / GIF
  return (
    <div className={`relative w-full max-h-96 rounded-xl overflow-hidden bg-black/60 border border-black/40 shadow-inner flex items-center justify-center ${className}`}>
      <img
        src={url}
        alt={title}
        onError={() => setLoadError(true)}
        className="w-full h-auto max-h-96 object-contain"
        loading="lazy"
      />
    </div>
  );
}
