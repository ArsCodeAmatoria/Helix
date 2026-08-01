"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Trash2, X } from "lucide-react";
import type { PhotoItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface PhotoModuleProps {
  photos: PhotoItem[];
  onAdd: (photo: PhotoItem) => void;
  onRemove: (id: string) => void;
}

export function PhotoModule({ photos, onAdd, onRemove }: PhotoModuleProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [viewer, setViewer] = useState<PhotoItem | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        onAdd({
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          dataUrl: String(reader.result),
          caption: file.name,
          annotated: false,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Capture site conditions, hazards, or equipment. Multiple photos supported.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-16 rounded-2xl text-base"
          onClick={() => cameraRef.current?.click()}
        >
          <Camera className="size-5" />
          Take photo
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-16 rounded-2xl text-base"
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="size-5" />
          Upload
        </Button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="group relative overflow-hidden rounded-2xl">
              <button
                type="button"
                className="block w-full"
                onClick={() => setViewer(p)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.dataUrl}
                  alt={p.caption}
                  className="aspect-square w-full object-cover"
                />
              </button>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute right-2 top-2 size-9 rounded-full opacity-90"
                onClick={() => onRemove(p.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!viewer} onOpenChange={(o) => !o && setViewer(null)}>
        <DialogContent className="max-w-lg border-0 bg-black p-0 text-white sm:rounded-3xl">
          <DialogTitle className="sr-only">Photo viewer</DialogTitle>
          <button
            type="button"
            className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2"
            onClick={() => setViewer(null)}
          >
            <X className="size-5" />
          </button>
          {viewer && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={viewer.dataUrl}
              alt={viewer.caption}
              className="max-h-[85dvh] w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
