"use client";

import { useRef, useState, useCallback } from "react";
import { UploadCloud, X, ImageIcon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compress an image in the browser (max 1600px on the longest side, JPEG).
 * Keeps the base64 payload small so uploads travel safely inside JSON
 * (serverless request bodies are capped ~4.5MB).
 */
function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface FileUploadProps {
  value?: string; // base64 data URL or empty
  onChange: (base64: string) => void;
  accept?: string; // e.g. "image/*" or ".pdf"
  maxSize?: number; // in MB, default 5
  label?: string;
  hint?: string;
  className?: string;
  aspectRatio?: "square" | "wide" | "tall" | "auto";
}

export function FileUpload({
  value,
  onChange,
  accept = "image/*",
  maxSize = 5,
  label = "Arrastra o haz clic para subir",
  hint,
  className,
  aspectRatio = "auto",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const isImage = value && value.startsWith("data:image");
  const isPdf = value && value.startsWith("data:application/pdf");

  const handleFile = useCallback(
    (file: File) => {
      setError("");

      // Los PDF viajan sin comprimir dentro del JSON: tope absoluto de 3MB
      // (base64 crece ~33% y el límite serverless es ~4.5MB).
      const effectiveMax =
        file.type === "application/pdf" ? Math.min(maxSize, 3) : maxSize;

      // Validate size
      if (file.size > effectiveMax * 1024 * 1024) {
        setError(
          file.type === "application/pdf" && maxSize > 3
            ? "El PDF supera 3MB"
            : `El archivo supera ${effectiveMax}MB`
        );
        return;
      }

      // Validate type if accept is specified
      if (accept !== "*") {
        const acceptTypes = accept.split(",").map((t) => t.trim());
        const matches = acceptTypes.some((type) => {
          if (type.endsWith("/*")) {
            return file.type.startsWith(type.slice(0, -1));
          }
          if (type.startsWith(".")) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          return file.type === type;
        });
        if (!matches) {
          setError(`Tipo no permitido. Acepta: ${accept}`);
          return;
        }
      }

      // Imágenes > 400KB se comprimen en el navegador (máx 1600px, JPEG);
      // si falla la compresión, se envía el archivo original.
      if (file.type.startsWith("image/") && file.size > 400 * 1024) {
        compressImage(file)
          .then((b64) => onChange(b64))
          .catch(() => {
            const reader = new FileReader();
            reader.onloadend = () => onChange(reader.result as string);
            reader.onerror = () => setError("Error al leer el archivo");
            reader.readAsDataURL(file);
          });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.onerror = () => setError("Error al leer el archivo");
      reader.readAsDataURL(file);
    },
    [accept, maxSize, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "wide"
      ? "aspect-[3/1]"
      : aspectRatio === "tall"
      ? "aspect-[3/4]"
      : "min-h-[120px]";

  return (
    <div className={cn("w-full", className)}>
      {value ? (
        <div className="relative group">
          {isImage ? (
            <img
              src={value}
              alt="Preview"
              className={cn(
                "w-full object-contain rounded-lg border bg-gray-50",
                aspectClass
              )}
            />
          ) : isPdf ? (
            <div
              className={cn(
                "w-full flex flex-col items-center justify-center gap-2 rounded-lg border bg-gray-50 p-6",
                aspectClass
              )}
            >
              <FileText className="size-12 text-red-500" />
              <p className="text-sm font-medium text-gray-700">PDF cargado</p>
              <p className="text-xs text-gray-400">
                {value.length > 100 ? `${(value.length / 1024).toFixed(0)} KB` : ""}
              </p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => {
              onChange("");
              setError("");
            }}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Eliminar"
          >
            <X className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium shadow-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed cursor-pointer transition-all",
            aspectClass,
            dragging
              ? "border-red-400 bg-red-50/50"
              : "border-gray-300 hover:border-gray-400 bg-gray-50/50"
          )}
        >
          <div className="flex flex-col items-center gap-1.5 text-gray-500">
            {accept.includes("pdf") ? (
              <FileText className="size-8" />
            ) : (
              <ImageIcon className="size-8" />
            )}
            <p className="text-sm font-medium text-gray-600">{label}</p>
            {hint && <p className="text-xs text-gray-400">{hint}</p>}
            <p className="text-xs text-gray-400">Máximo {maxSize}MB</p>
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = ""; // reset for same-file re-upload
        }}
      />
    </div>
  );
}
