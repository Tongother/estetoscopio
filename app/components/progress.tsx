"use client";

import * as React from "react";
import { cn } from "@/app/lib/cn";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100. Si es undefined, muestra indeterminado */
  value?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => {
    const clamped =
      typeof value === "number" ? Math.max(0, Math.min(100, value)) : undefined;

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800",
          className
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        {...props}
      >
        {typeof clamped === "number" ? (
          <div
            className="h-full rounded-full bg-neutral-900 transition-[width] duration-300 ease-out dark:bg-white"
            style={{ width: `${clamped}%` }}
          />
        ) : (
          <div className="absolute inset-0">
            <div className="absolute left-0 top-0 h-full w-1/3 rounded-full bg-neutral-900 dark:bg-white animate-[progress_1.2s_ease_infinite]" />
            <style jsx>{`
              @keyframes progress {
                0%   { transform: translateX(-120%); }
                50%  { transform: translateX(80%); }
                100% { transform: translateX(120%); }
              }
            `}</style>
          </div>
        )}
      </div>
    );
  }
);
Progress.displayName = "Progress";