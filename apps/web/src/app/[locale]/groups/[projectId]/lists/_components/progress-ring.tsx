import { Check } from "lucide-react";

const SIZE = 30;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Per-row completion ring (Reminders/Things-style), ported from the mobile
 * lists overview: an empty track for an empty list, a primary arc that fills
 * as items complete, and a bare muted check when everything is done. The
 * pending count sits inside the ring so an arc-less ring still reads as a
 * progress gauge rather than an unchecked checkbox.
 */
export default function ProgressRing({
  done,
  pending,
  total,
}: {
  done: number;
  pending: number;
  total: number;
}) {
  const complete = total > 0 && done === total;

  if (complete) {
    return (
      // Same footprint as the ring so the trailing column stays aligned.
      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center">
        <Check
          size={20}
          strokeWidth={3}
          className="text-muted-foreground opacity-60"
          aria-hidden
        />
      </span>
    );
  }

  return (
    <span className="relative flex h-[30px] w-[30px] shrink-0 items-center justify-center">
      <svg width={SIZE} height={SIZE} className="absolute" aria-hidden="true">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          fill="none"
          className="stroke-border"
        />
        {done > 0 && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - done / total)}
            // Start the arc at 12 o'clock instead of SVG's default 3 o'clock.
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            className="stroke-primary transition-[stroke-dashoffset] duration-300"
          />
        )}
      </svg>
      {pending > 0 && (
        // Two digits is all the ring fits; beyond that the gauge matters more
        // than the exact number.
        <span className="font-bold text-muted-foreground text-xs tabular-nums">
          {pending > 99 ? "99" : pending}
        </span>
      )}
    </span>
  );
}
