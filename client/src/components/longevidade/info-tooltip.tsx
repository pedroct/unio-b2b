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
        className="max-w-[280px] text-[13px] leading-relaxed font-normal !bg-white dark:!bg-gray-900 !border !border-gray-200 dark:!border-gray-700 !rounded-lg !shadow-md ![padding:12px_16px] !text-gray-800 dark:!text-gray-100"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
