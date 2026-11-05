"use client";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  centered = true,
  light = false,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn(centered && "text-center", "mb-12", className)}>
      <h2
        className={cn(
          "text-3xl md:text-4xl font-bold mb-4",
          light ? "text-white" : "text-foreground"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "text-lg max-w-2xl",
            centered && "mx-auto",
            light ? "text-gray-300" : "text-muted-foreground"
          )}
        >
          {subtitle}
        </p>
      )}
      <div
        className={cn(
          "w-20 h-1 rounded-full mt-4 gradient-primary",
          centered && "mx-auto"
        )}
      />
    </div>
  );
}
