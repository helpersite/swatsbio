import React from "react";

const VIDEO_PATTERN = /\.(mp4|webm|mov|m4v|ogg)([?#]|$)|\/video\/upload\//i;

export function MediaDisplay({ src, alt = "", className = "", style, loading = "eager" }) {
  if (!src) return null;
  if (VIDEO_PATTERN.test(src)) {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={alt || undefined}
        className={className}
        style={style}
      />
    );
  }
  return <img src={src} alt={alt} loading={loading} decoding="async" className={className} style={style} />;
}