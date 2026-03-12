import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface InfoTooltipProps {
  text: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function InfoTooltip({ text, side = "top" }: InfoTooltipProps) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span
          className="inline-flex items-center cursor-help flex-shrink-0"
          style={{ color: "var(--sys-text-tertiary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--sys-text-secondary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--sys-text-tertiary)")}
          data-testid="info-tooltip-trigger"
        >
          <Info className="h-4 w-4" />
        </span>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        role="tooltip"
        className="max-w-[280px] text-[13px] leading-relaxed font-normal"
        style={{
          background: "var(--sys-bg-surface)",
          border: "1px solid var(--sys-border-subtle)",
          borderRadius: "8px",
          padding: "12px 16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          color: "var(--sys-text-primary)",
        }}
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
