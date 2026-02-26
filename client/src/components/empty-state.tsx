import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  module?: "nutrition" | "training" | "biometry" | "hydration";
}

const moduleColors = {
  nutrition: "text-[#5B8C6F]",
  training: "text-[#D97952]",
  biometry: "text-[#3D7A8C]",
  hydration: "text-[#6BA3BE]",
};

export function EmptyState({ icon, title, description, action, className, module }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)} data-testid="empty-state">
      <div className={cn(
        "mb-6 rounded-full p-6 bg-muted/50",
        module && moduleColors[module]
      )}>
        <div className="h-12 w-12 flex items-center justify-center opacity-60">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-title">{title}</h3>
      <p className="text-muted-foreground max-w-sm text-sm leading-relaxed" data-testid="text-empty-description">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
