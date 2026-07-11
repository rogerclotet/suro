"use client";

const WIDTH = 240;
const HEIGHT = 72;
/** Horizontal guides from the baseline upward (0 = bottom axis). */
const GRID_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];

function gridY(fraction: number) {
  return HEIGHT - fraction * HEIGHT;
}

function ChartGrid() {
  return (
    <>
      {GRID_FRACTIONS.map((fraction) => (
        <line
          key={fraction}
          x1={0}
          y1={gridY(fraction)}
          x2={WIDTH}
          y2={gridY(fraction)}
          className={fraction === 0 ? "stroke-border" : "stroke-border/35"}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </>
  );
}

export default function SoloMonthChart({
  amounts,
  className,
}: {
  amounts: number[];
  className?: string;
}) {
  const max = amounts.length > 0 ? Math.max(...amounts, 1) : 1;
  const gap = amounts.length > 1 ? 1 : 0;
  const barWidth =
    amounts.length > 0
      ? (WIDTH - gap * (amounts.length - 1)) / amounts.length
      : 0;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={className}
      preserveAspectRatio="none"
      role="img"
      aria-hidden
    >
      <title> </title>
      <ChartGrid />
      {amounts.map((amount, index) => {
        const barHeight = amount > 0 ? Math.max(2, (amount / max) * HEIGHT) : 0;
        return (
          <rect
            // biome-ignore lint/suspicious/noArrayIndexKey: one bar per fixed calendar day
            key={index}
            x={index * (barWidth + gap)}
            y={HEIGHT - barHeight}
            width={barWidth}
            height={barHeight}
            className="fill-primary/80"
            rx={1}
          />
        );
      })}
    </svg>
  );
}
