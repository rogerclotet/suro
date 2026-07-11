import Svg, { Line, Rect } from "react-native-svg";

const WIDTH = 240;
const HEIGHT = 72;
/** Horizontal guides from the baseline upward (0 = bottom axis). */
const GRID_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];

function gridY(fraction: number) {
  return HEIGHT - fraction * HEIGHT;
}

function ChartGrid({ borderColor }: { borderColor: string }) {
  return (
    <>
      {GRID_FRACTIONS.map((fraction) => (
        <Line
          key={fraction}
          x1={0}
          y1={gridY(fraction)}
          x2={WIDTH}
          y2={gridY(fraction)}
          stroke={borderColor}
          strokeWidth={1}
          strokeOpacity={fraction === 0 ? 1 : 0.35}
        />
      ))}
    </>
  );
}

export default function SoloMonthChart({
  amounts,
  color,
  borderColor,
}: {
  amounts: number[];
  color: string;
  borderColor: string;
}) {
  const max = amounts.length > 0 ? Math.max(...amounts, 1) : 1;
  const gap = amounts.length > 1 ? 1 : 0;
  const barWidth =
    amounts.length > 0
      ? (WIDTH - gap * (amounts.length - 1)) / amounts.length
      : 0;

  return (
    <Svg
      width="100%"
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
    >
      <ChartGrid borderColor={borderColor} />
      {amounts.map((amount, index) => {
        const barHeight = amount > 0 ? Math.max(2, (amount / max) * HEIGHT) : 0;
        return (
          <Rect
            // biome-ignore lint/suspicious/noArrayIndexKey: one bar per fixed calendar day
            key={index}
            x={index * (barWidth + gap)}
            y={HEIGHT - barHeight}
            width={barWidth}
            height={barHeight}
            fill={color}
            rx={1}
          />
        );
      })}
    </Svg>
  );
}
