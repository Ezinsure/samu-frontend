import { useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadVisitPhoto } from "@/lib/api";
import type { PhotoDraft } from "./types";

const MAX_PHOTOS = 10;
const MAX_BYTES = 10 * 1024 * 1024;

interface PhotoEvidenceFieldProps {
  photos: PhotoDraft[];
  onChange: (photos: PhotoDraft[]) => void;
}

/**
 * Camera / gallery picker. Each file is uploaded immediately so problems
 * (size, type, network) surface here rather than at final submit.
 */
export function PhotoEvidenceField({ photos, onChange }: PhotoEvidenceFieldProps) {
  const [uploading, setUploading] = useState(0);

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) {
      toast.error(`You can attach up to ${MAX_PHOTOS} photos.`);
    }

    const uploaded: PhotoDraft[] = [];
    for (const file of files.slice(0, Math.max(room, 0))) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 10 MB.`);
        continue;
      }

      setUploading((count) => count + 1);
      const result = await uploadVisitPhoto(file);
      setUploading((count) => count - 1);

      if (!result.ok) {
        toast.error(`Could not upload ${file.name}`, { description: result.error });
        continue;
      }
      uploaded.push({
        id: result.data.storageKey,
        previewUrl: URL.createObjectURL(file),
        upload: result.data,
      });
    }

    if (uploaded.length > 0) onChange([...photos, ...uploaded]);
  }

  function remove(photo: PhotoDraft) {
    URL.revokeObjectURL(photo.previewUrl);
    onChange(photos.filter((item) => item.id !== photo.id));
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="photo">Photo evidence (at least one required)</Label>
      <Input
        id="photo"
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        disabled={uploading > 0 || photos.length >= MAX_PHOTOS}
        onChange={(event) => {
          void handleFiles(event.target.files);
          // Allow re-selecting the same file after removing it.
          event.target.value = "";
        }}
      />

      {uploading > 0 ? (
        <p className="flex items-center gap-2 text-xs text-foreground-secondary">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Uploading…
        </p>
      ) : null}

      {photos.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="overflow-hidden rounded-[var(--radius-md)] border border-border"
            >
              {/* Local blob preview — next/image does not handle blob: URLs. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.previewUrl}
                alt="Visit evidence preview"
                className="h-40 w-full object-cover"
              />
              <div className="flex items-center gap-2 px-3 py-2 text-sm">
                <Camera className="h-4 w-4 shrink-0 text-primary-600" />
                <span className="truncate">{photo.upload.fileName}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  aria-label={`Remove ${photo.upload.fileName}`}
                  onClick={() => remove(photo)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-foreground-secondary">
          Attach photos from the camera or gallery (images up to 10 MB each).
        </p>
      )}
    </div>
  );
}
