"use client";

import { useRef, useState, useCallback } from "react";
import { UploadCloud, X, ImageIcon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

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

      // Validate size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`El archivo supera ${maxSize}MB`);
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
