import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogOverlay } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, EyeOff, RotateCcw, Check, X, Image as ImageIcon, ZoomIn, Sliders, Sparkles } from "lucide-react";
import { fileUrl } from "@/lib/auth";
import { toast } from "sonner";

export function MediaAssetModal({
  open,
  type, // "pfp" | "background" | "banner" | "cursor"
  currentValue,
  currentConfig = {},
  onSave,
  onClose,
  uploadFile,
}) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(currentValue || "");
  const [zoom, setZoom] = useState(currentConfig.zoom || 100);
  const [blur, setBlur] = useState(currentConfig.blur || 0);
  const [rotate, setRotate] = useState(currentConfig.rotate || 0);
  const [opacity, setOpacity] = useState(currentConfig.opacity !== undefined ? currentConfig.opacity : 100);
  const [isInvisible, setIsInvisible] = useState(currentConfig.invisible || false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setPreviewUrl(currentValue || "");
      setZoom(currentConfig.zoom || 100);
      setBlur(currentConfig.blur || 0);
      setRotate(currentConfig.rotate || 0);
      setOpacity(currentConfig.opacity !== undefined ? currentConfig.opacity : 100);
      setIsInvisible(currentConfig.invisible || false);
      setFile(null);
    }
  }, [open, currentValue, currentConfig]);

  if (!open) return null;

  const titles = {
    pfp: "Profile Picture Customizer",
    background: "Background Media Customizer",
    banner: "Profile Banner Customizer",
    cursor: "Custom Cursor Customizer",
  };

  const descriptions = {
    pfp: "Upload an avatar, scale, rotate, and adjust visual properties.",
    background: "Upload high-res wallpaper or MP4/GIF ambient backdrop.",
    banner: "Upload top profile cover header image or animated banner.",
    cursor: "Upload a custom 32×32 pointer or crosshair image.",
  };

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    const localUrl = URL.createObjectURL(selected);
    setPreviewUrl(localUrl);

    if (uploadFile) {
      setUploading(true);
      try {
        const uploadedUrl = await uploadFile(selected);
        setPreviewUrl(uploadedUrl);
        toast.success("Image uploaded successfully!");
      } catch {
        toast.error("Upload failed. Using local preview.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleApply = () => {
    onSave({
      url: previewUrl,
      config: {
        zoom,
        blur,
        rotate,
        opacity: isInvisible ? 0 : opacity,
        invisible: isInvisible,
      },
    });
    toast.success(`${titles[type] || "Asset"} updated!`);
    onClose();
  };

  const handleRemove = () => {
    setPreviewUrl("");
    onSave({
      url: "",
      config: { zoom: 100, blur: 0, rotate: 0, opacity: 100, invisible: false },
    });
    toast.info(`${type.toUpperCase()} removed.`);
    onClose();
  };

  const handleToggleInvisible = () => {
    setIsInvisible((prev) => !prev);
  };

  const handleReset = () => {
    setZoom(100);
    setBlur(0);
    setRotate(0);
    setOpacity(100);
    setIsInvisible(false);
  };

  const displaySrc = previewUrl ? (previewUrl.startsWith("blob:") || previewUrl.startsWith("data:") || previewUrl.startsWith("http") ? previewUrl : fileUrl(previewUrl)) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[500px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[92dvh] bg-[#0c0e15] border border-[#2b384e] text-white p-0 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#090b10]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
              <ImageIcon size={16} />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-white font-display">
                {titles[type] || "Media Customizer"}
              </DialogTitle>
              <div className="text-[11px] text-[#E5E7EB]/50">{descriptions[type]}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Top Row: Upload box on Left + Live Preview Box on Right */}
          <div className="grid grid-cols-2 gap-3">
            {/* Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="h-36 rounded-xl border-2 border-dashed border-[#5B8DB8]/40 hover:border-[#5B8DB8] bg-[#121622]/80 hover:bg-[#5B8DB8]/10 cursor-pointer flex flex-col items-center justify-center p-3 text-center transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-9 h-9 rounded-full bg-[#5B8DB8]/20 group-hover:bg-[#5B8DB8]/30 text-[#5B8DB8] flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110">
                <Upload size={16} />
              </div>
              <span className="text-xs font-semibold text-white">Click to Upload</span>
              <span className="text-[10px] text-[#E5E7EB]/50 mt-0.5">PNG, JPG, GIF, MP4</span>
            </div>

            {/* Live Preview Box */}
            <div className="h-36 rounded-xl border border-white/10 bg-[#07080c] relative overflow-hidden flex items-center justify-center">
              {displaySrc ? (
                <div
                  className="w-full h-full flex items-center justify-center overflow-hidden transition-all"
                  style={{
                    opacity: isInvisible ? 0.2 : opacity / 100,
                    filter: `blur(${blur}px)`,
                    transform: `scale(${zoom / 100}) rotate(${rotate}deg)`,
                  }}
                >
                  <img
                    src={displaySrc}
                    alt="Preview"
                    className={`w-full h-full ${type === "pfp" ? "object-cover rounded-full max-w-[100px] max-h-[100px]" : "object-cover"}`}
                  />
                </div>
              ) : (
                <div className="text-center p-3 text-[#E5E7EB]/40">
                  <ImageIcon size={24} className="mx-auto mb-1 opacity-40" />
                  <span className="text-[11px]">No asset selected</span>
                </div>
              )}
              {isInvisible && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[11px] font-bold text-red-400">
                  Invisible (Hidden)
                </div>
              )}
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-[#5B8DB8] border border-white/10">
                Preview
              </div>
            </div>
          </div>

          {/* Sliders: Zoom, Blur, Rotate */}
          <div className="space-y-3 bg-[#080a0f] p-3 rounded-xl border border-white/5">
            {/* Zoom Slider */}
            <div>
              <div className="flex justify-between text-xs text-[#E5E7EB]/70 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <ZoomIn size={12} className="text-[#5B8DB8]" /> Zoom Scale
                </span>
                <span className="font-mono text-[#5B8DB8] text-[11px]">{zoom}%</span>
              </div>
              <Slider
                value={[zoom]}
                min={50}
                max={250}
                step={1}
                onValueChange={(v) => setZoom(v[0])}
                className="py-1"
              />
            </div>

            {/* Blur Slider */}
            <div>
              <div className="flex justify-between text-xs text-[#E5E7EB]/70 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <Sliders size={12} className="text-[#5B8DB8]" /> Blur Intensity
                </span>
                <span className="font-mono text-[#5B8DB8] text-[11px]">{blur}px</span>
              </div>
              <Slider
                value={[blur]}
                min={0}
                max={25}
                step={0.5}
                onValueChange={(v) => setBlur(v[0])}
                className="py-1"
              />
            </div>

            {/* Rotate Slider */}
            <div>
              <div className="flex justify-between text-xs text-[#E5E7EB]/70 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <RotateCcw size={12} className="text-[#5B8DB8]" /> Rotation Angle
                </span>
                <span className="font-mono text-[#5B8DB8] text-[11px]">{rotate}&deg;</span>
              </div>
              <Slider
                value={[rotate]}
                min={-180}
                max={180}
                step={1}
                onValueChange={(v) => setRotate(v[0])}
                className="py-1"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-white/10 bg-[#090b10] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleInvisible}
              className={`text-xs h-8 rounded-lg border-white/10 ${isInvisible ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-white/5 text-white/70 hover:text-white"}`}
              title="Make asset invisible on profile"
            >
              <EyeOff size={13} className="mr-1" />
              {isInvisible ? "Hidden" : "Invis"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs h-8 rounded-lg bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white"
              title="Reset slider values"
            >
              <RotateCcw size={13} className="mr-1" /> Reset
            </Button>
            {displaySrc && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                className="text-xs h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
              >
                <Trash2 size={13} className="mr-1" /> Remove
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              disabled={uploading}
              className="text-xs font-bold h-8 px-4 rounded-lg bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white shadow-[0_0_12px_rgba(91,141,184,0.35)]"
            >
              <Check size={13} className="mr-1" /> Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
