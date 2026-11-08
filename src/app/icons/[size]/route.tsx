import { ImageResponse } from 'next/og';

const SIZES = [96, 180, 192, 512];

// Icône de l'app : un gant de boxe sur le coucher de soleil du ring.
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const size = SIZES.includes(Number(raw)) ? Number(raw) : 192;
  const s = size / 192;
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: 'flex', flexDirection: 'column', background: '#1C0E33', position: 'relative' }}>
        {['#6B1E6E', '#B3206F', '#E8287C', '#F25C4A', '#F7893B', '#FFB23D'].map((c, i) => (
          <div key={c} style={{ position: 'absolute', left: 0, right: 0, top: (i * size) / 6, height: size / 6, background: c }} />
        ))}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 34 * s, background: '#2A1548', borderTop: `${6 * s}px solid #140A22` }} />
        <svg width={size} height={size} viewBox="0 0 192 192" style={{ position: 'absolute', left: 0, top: 0 }}>
          <path d="M 52 70 C 60 40 118 32 140 58 C 160 82 150 128 116 138 L 70 140 C 58 128 46 100 52 70 Z" fill="#D22B3A" stroke="#140A22" strokeWidth="9" strokeLinejoin="round" />
          <path d="M 66 64 C 74 46 104 44 112 62 C 104 70 82 72 66 64 Z" fill="#D22B3A" stroke="#140A22" strokeWidth="7" strokeLinejoin="round" />
          <ellipse cx="116" cy="74" rx="14" ry="8" fill="#FFFFFF" opacity="0.55" />
          <path d="M 66 136 L 122 134 L 124 160 L 64 162 Z" fill="#FFF4E3" stroke="#140A22" strokeWidth="9" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  );
}
