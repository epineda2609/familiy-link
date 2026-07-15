// BASUF — Pseudo-QR determinista para la demo (no es un QR real).
// En producción usar librería estándar (qrcode). Para demo: patrón visual
// creíble derivado del código, sin dependencias extra.

interface Props {
  value: string;
  size?: number;
  className?: string;
}

function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function rand(seed: number) {
  let x = seed || 1;
  return () => {
    x = Math.imul(x ^ (x >>> 15), 2246822519) >>> 0;
    x = Math.imul(x ^ (x >>> 13), 3266489917) >>> 0;
    x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  };
}

export function RescueQR({ value, size = 160, className }: Props) {
  const grid = 21;
  const cell = size / grid;
  const rng = rand(hashSeed(value));
  const cells: JSX.Element[] = [];

  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) =>
      r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, grid - 7) || inBox(grid - 7, 0);
  };

  const finderPixel = (r: number, c: number) => {
    const boxes: [number, number][] = [
      [0, 0],
      [0, grid - 7],
      [grid - 7, 0],
    ];
    for (const [br, bc] of boxes) {
      if (r >= br && r < br + 7 && c >= bc && c < bc + 7) {
        const rr = r - br;
        const cc = c - bc;
        const edge = rr === 0 || rr === 6 || cc === 0 || cc === 6;
        const inner = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
        return edge || inner;
      }
    }
    return false;
  };

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      let on = false;
      if (isFinder(r, c)) {
        on = finderPixel(r, c);
      } else {
        on = rng() > 0.52;
      }
      if (!on) continue;
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={c * cell}
          y={r * cell}
          width={cell}
          height={cell}
          fill="currentColor"
        />,
      );
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={`QR ${value}`}
      className={className}
    >
      <rect width={size} height={size} fill="white" />
      <g className="text-black">{cells}</g>
    </svg>
  );
}
