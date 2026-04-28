"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number | null;
}

function Progress({ className, value, ...props }: ProgressProps) {
  return (
    <div
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-gray-700",
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full w-full flex-1 bg-indigo-500 transition-all duration-300 ease-in-out"
        style={{
          transform: `translateX(-${100 - (value ?? 0)}%)`,
        }}
      />
    </div>
  );
}

export { Progress };
