// BASUF — Barcode SVG determinista (demo, no es Code128 real).
interface Props {
  value: string;
  height?: number;
  className?: string;
}

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

export function BarcodePseudo({ value, height = 56, className }: Props) {
  const bars: { x: number; w: number }[] = [];
  let x = 4;
  let h = hash(value);
  while (x < 300) {
    const w = 1 + (h & 3);
    const gap = 1 + ((h >> 2) & 3);
    bars.push({ x, w });
    x += w + gap;
    h = (h * 1664525 + 1013904223) >>> 0;
  }
  return (
    <svg
      viewBox={`0 0 ${x} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Barcode ${value}`}
      className={className}
      style={{ width: "100%", height }}
    >
      <rect width={x} height={height} fill="white" />
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={height - 12} fill="black" />
      ))}
      <text
        x={x / 2}
        y={height - 2}
        textAnchor="middle"
        fontSize={9}
        fontFamily="ui-monospace,monospace"
        fill="black"
      >
        {value}
      </text>
    </svg>
  );
}
