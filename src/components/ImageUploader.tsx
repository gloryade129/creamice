"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { X, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { publicImageUrl } from "@/lib/images";

export interface UploadedImage {
  storage_path: string;
  public_url: string;
  sort_order: number;
  alt_text?: string;
  // True when this file was uploaded in the current form session, so removing
  // it can clean up storage right away. Images that are already saved are only
  // deleted server side once the save (or rejection) lands.
  session?: boolean;
}

interface ImageUploaderProps {
  value: UploadedImage[];
  // Functional updater: parallel uploads all start from the same list without
  // losing each other's results to a stale closure.
  onChange: (update: (current: UploadedImage[]) => UploadedImage[]) => void;
  productId?: string;
  disabled?: boolean;
  maxFiles?: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1600;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageUploader({
  value,
  onChange,
  productId,
  disabled,
  maxFiles = 10,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      // window.Image: the next/image import shadows the DOM constructor.
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(
                new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
                  type: "image/webp",
                  lastModified: Date.now(),
                })
              );
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          "image/webp",
          0.85
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      setError("");
      setUploading((count) => count + 1);

      try {
        const resizedFile = await resizeImage(file);

        const formData = new FormData();
        formData.append("file", resizedFile);
        if (productId) formData.append("productId", productId);

        const response = await fetch("/api/upload", { method: "POST", body: formData });

        let data: { error?: string; storage_path?: string; public_url?: string } = {};
        try {
          data = await response.json();
        } catch {
          // A redirect to the login page (expired session) returns HTML.
        }

        if (!response.ok || response.redirected || !data.storage_path) {
          throw new Error(data.error || "Upload failed. Sign in again and retry.");
        }

        onChange((current) => [
          ...current,
          {
            storage_path: data.storage_path as string,
            public_url: data.public_url ?? "",
            alt_text: "",
            sort_order: current.length,
            session: true,
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading((count) => Math.max(0, count - 1));
      }
    },
    [onChange, productId, resizeImage]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const accepted: File[] = [];
      for (const file of Array.from(files)) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError(`${file.name} is not a JPEG, PNG or WebP image`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`${file.name} is larger than 5MB`);
          continue;
        }
        accepted.push(file);
      }

      if (value.length + accepted.length > maxFiles) {
        setError(`A product can have at most ${maxFiles} images`);
        return;
      }

      accepted.forEach((file) => {
        void uploadFile(file);
      });
    },
    [uploadFile, value.length, maxFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const image = value[index];
      setError("");
      onChange((current) => current.filter((_, i) => i !== index));

      if (image?.session && image.storage_path) {
        void fetch(`/api/upload?path=${encodeURIComponent(image.storage_path)}`, {
          method: "DELETE",
        }).catch(() => {
          // The file is already detached from the form; a leftover in storage
          // is cleaned up when the product is saved or the edit is rejected.
        });
      }
    },
    [value, onChange]
  );

  const move = useCallback(
    (index: number, step: number) => {
      const target = index + step;
      if (target < 0 || target >= value.length) return;
      onChange((current) => {
        const next = [...current];
        const [moved] = next.splice(index, 1);
        next.splice(target, 0, moved);
        return next.map((img, i) => ({ ...img, sort_order: i }));
      });
    },
    [value.length, onChange]
  );

  const updateAlt = useCallback(
    (index: number, alt: string) => {
      onChange((current) =>
        current.map((img, i) => (i === index ? { ...img, alt_text: alt } : img))
      );
    },
    [onChange]
  );

  const full = value.length >= maxFiles;

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-error/10 border border-error rounded-lg text-error text-sm" role="alert">
          {error}
        </div>
      )}

      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors",
          "border-border hover:border-gold/50",
          dragging && "border-gold",
          (disabled || full) && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !full && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
          disabled={disabled || full || uploading > 0}
          className="hidden"
          aria-label="Upload product images"
        />

        <div className="text-center">
          <Upload className="w-10 h-10 mx-auto text-muted mb-3" aria-hidden="true" />
          <p className="font-montserrat text-sm text-muted">
            {disabled || full ? "Maximum images reached" : "Click or drop images here to upload"}
          </p>
          <p className="text-xs text-muted mt-1">
            JPEG, PNG, WebP · Max 5MB each · Auto-resized to 1600px WebP
          </p>
          {full || disabled ? null : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Select Images
            </Button>
          )}
        </div>
      </div>

      {uploading > 0 && (
        <p className="text-sm text-muted" role="status">
          Uploading {uploading === 1 ? "image" : `${uploading} images`}…
        </p>
      )}

      {value.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-montserrat font-medium text-sm">
            Images ({value.length}) · first image is the main product image
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {value.map((image, index) => {
              const src = image.public_url || publicImageUrl(image.storage_path);
              return (
                <div
                  key={`${image.storage_path}-${index}`}
                  className="relative group bg-surface rounded-lg border border-border overflow-hidden"
                >
                  <div className="aspect-[4/5] relative overflow-hidden bg-charcoal">
                    {src ? (
                      <Image
                        src={src}
                        alt={image.alt_text || `Product image ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted">
                        Preview unavailable
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-md">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="p-2 space-y-2">
                    <input
                      type="text"
                      value={image.alt_text || ""}
                      onChange={(e) => updateAlt(index, e.target.value)}
                      placeholder="Alt text"
                      maxLength={200}
                      className="w-full text-xs bg-charcoal border border-border-strong rounded-md px-2 py-2 text-offwhite placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-gold"
                      aria-label={`Alt text for image ${index + 1}`}
                    />
                    {/* flex-wrap: at 320px the three 44px buttons cannot share a row */}
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => move(index, -1)}
                          disabled={index === 0 || uploading > 0}
                          className="w-11 h-11 flex items-center justify-center text-muted hover:text-gold transition-colors rounded-md focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-30"
                          aria-label={`Move image ${index + 1} earlier`}
                        >
                          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(index, 1)}
                          disabled={index === value.length - 1 || uploading > 0}
                          className="w-11 h-11 flex items-center justify-center text-muted hover:text-gold transition-colors rounded-md focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-30"
                          aria-label={`Move image ${index + 1} later`}
                        >
                          <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="w-11 h-11 flex items-center justify-center text-muted hover:text-error transition-colors rounded-md hover:bg-error/10 focus:outline-none focus:ring-1 focus:ring-error"
                        aria-label={`Remove image ${index + 1}`}
                        disabled={uploading > 0}
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
