"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { X, Image as ImageIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedImage {
  storage_path: string;
  public_url: string;
  sort_order: number;
  alt_text?: string;
}

interface ImageUploaderProps {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
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
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeImage = useCallback(
    (file: File): Promise<File> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
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
                const resizedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
                  type: "image/webp",
                  lastModified: Date.now(),
                });
                resolve(resizedFile);
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
    },
    []
  );

  const uploadFile = useCallback(
    async (file: File, index: number) => {
      setUploading(index);
      setError("");

      try {
        const resizedFile = await resizeImage(file);

        const formData = new FormData();
        formData.append("file", resizedFile);
        if (productId) {
          formData.append("productId", productId);
        }

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Upload failed");
        }

        onChange([...value, { ...data, alt_text: "" }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(null);
      }
    },
    [productId, onChange, resizeImage]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      if (value.length + files.length > maxFiles) {
        setError(`Maximum ${maxFiles} images allowed`);
        return;
      }

      Array.from(files).forEach((file, i) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError(`File ${file.name} is not a valid image type (JPEG, PNG, WebP)`);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`File ${file.name} exceeds 5MB limit`);
          return;
        }
        uploadFile(file, i);
      });

      e.target.value = "";
    },
    [value.length, maxFiles, uploadFile]
  );

  const handleRemove = useCallback(
    async (index: number) => {
      const image = value[index];
      setError("");

      try {
        await fetch(`/api/upload?path=${encodeURIComponent(image.storage_path)}`, {
          method: "DELETE",
        });
        onChange(value.filter((_, i) => i !== index));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete image");
      }
    },
    [value, onChange]
  );

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newImages = [...value];
      const [removed] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, removed);
      onChange(
        newImages.map((img, i) => ({ ...img, sort_order: i }))
      );
    },
    [value, onChange]
  );

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-error/10 border border-error rounded-[4px] text-error text-sm" role="alert">
          {error}
        </div>
      )}

      <div
        className={cn(
          "border-2 border-dashed rounded-[4px] p-6 transition-colors",
          "border-border hover:border-gold/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileSelect}
          disabled={disabled || value.length >= maxFiles || uploading !== null}
          className="hidden"
          aria-label="Upload product images"
        />

        <div className="text-center">
          <Upload className="w-10 h-10 mx-auto text-muted mb-3" />
          <p className="font-montserrat text-sm text-muted">
            {disabled || value.length >= maxFiles
              ? "Maximum images reached"
              : "Click or drag images here to upload"}
          </p>
          <p className="text-xs text-muted mt-1">
            JPEG, PNG, WebP · Max 5MB each · Auto-resized to 1600px WebP
          </p>
          {value.length < maxFiles && !disabled && (
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => fileInputRef.current?.click()}>
              Select Images
            </Button>
          )}
        </div>
      </div>

      {value.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-montserrat font-medium text-sm">Uploaded Images (drag to reorder)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {value.map((image, index) => (
              <div
                key={index}
                className={cn(
                  "relative group bg-surface rounded-[4px] border border-border overflow-hidden",
                  "transition-all duration-150"
                )}
              >
                <div className="aspect-[4/5] relative overflow-hidden">
                  <img
                    src={image.public_url}
                    alt={image.alt_text || `Product image ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  {uploading === index && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="p-2 flex items-center justify-between">
                  <input
                    type="text"
                    value={image.alt_text || ""}
                    onChange={(e) =>
                      onChange(
                        value.map((img, i) =>
                          i === index ? { ...img, alt_text: e.target.value } : img
                        )
                      )
                    }
                    placeholder="Alt text"
                    className="flex-1 text-xs bg-charcoal border border-border-strong rounded-[2px] px-2 py-1 text-offwhite placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-gold"
                    aria-label={`Alt text for image ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="ml-2 p-1 text-muted hover:text-error transition-colors rounded-[2px] hover:bg-error/10 focus:outline-none focus:ring-1 focus:ring-error"
                    aria-label={`Remove image ${index + 1}`}
                    disabled={uploading !== null}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-2 right-2">
                  <span className="bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-[2px]">
                    #{index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}