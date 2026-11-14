import Link from 'next/link';

export function Ribbon({ children, className = '', color }: { children: React.ReactNode; className?: string; color?: string }) {
  return (
    <span className={`ribbon ${className}`} style={color ? { background: color } : undefined}>
      <span className="text-[15px]">{children}</span>
    </span>
  );
}

export function Logo({ size = 64, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`inline-block -skew-x-[8deg] ${className}`} aria-label="Battle du Bide" role="img">
      <div className="extrude" style={{ fontSize: size }} aria-hidden>
        BATTLE<br />DU BIDE
      </div>
    </div>
  );
}

export function Icon({ name, size = 22, className = '' }: { name: keyof typeof ICONS; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className={className}
      style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2.3, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
      {ICONS[name]}
    </svg>
  );
}

const ICONS = {
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.4" /><path d="M12 17h.01" /></>,
  scale: <><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8.5 10a3.5 3.5 0 0 1 7 0" /><path d="M12 10l1.5-2" /></>,
  ring: <><path d="M3 20V8M21 20V8" /><path d="M3 10h18M3 14h18M3 18h18" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 16 0v1" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  lock: <><path d="M6 11h12v10H6z" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  check: <path d="M5 12l4 4L19 6" />,
  fire: <path d="M12 3c1 3 4.5 4.6 4.5 9a4.5 4.5 0 0 1-9 0c0-2.2 1-3.4 2.2-4.4 0 2 .9 3.1 2.1 3.1 0-3-1.1-5 .2-7.7z" />,
  zap: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />,
  laugh: <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2.5 4 2.5 4-2.5 4-2.5" /><path d="M8.5 9.5h2M13.5 9.5h2" /></>,
  glove: <><path d="M7 11V8a4 4 0 0 1 4-4h2a5 5 0 0 1 5 5v4a6 6 0 0 1-6 6h-1a4 4 0 0 1-4-4z" /><path d="M7 12h6" /></>,
  mic: <><path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></>,
  play: <path d="M8 5v14l11-7z" style={{ fill: 'currentColor' }} />,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5v2a3 3 0 0 0 3 3M16 6h3v2a3 3 0 0 1-3 3" /><path d="M12 13v4M9 21h6M10 17h4" /></>,
  calendar: <><path d="M4 6h16v14H4z" /><path d="M4 10h16" /><path d="M8 3v4M16 3v4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  coins: <><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" /><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></>,
  sound: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></>,
  mute: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M17 9l4 6M21 9l-4 6" /></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v12H4z" /><circle cx="12" cy="13" r="4" /></>,
  logout: <><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4M6 12h10" /></>
};

export function BackLink({ href, label = 'Retour' }: { href: string; label?: string }) {
  return (
    <Link href={href} aria-label={label} className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-prune text-soleil">
      <Icon name="back" />
    </Link>
  );
}

export function TopBar({ back, kicker, title, right }: { back?: string; kicker?: string; title: string; right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-encre/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur">
      {back ? <BackLink href={back} /> : null}
      <div className="min-w-0 flex-1">
        {kicker ? <div className="label truncate">{kicker}</div> : null}
        <h1 className="truncate font-display text-[22px] leading-tight">{title}</h1>
      </div>
      {right}
    </header>
  );
}

/** Barre de vie inclinée façon arcade, avec les dégâts du soir en rouge. */
export function HpBar({ hp, ghost = 0, reverse = false, label }: { hp: number; ghost?: number; reverse?: boolean; label: string }) {
  const v = Math.max(0, Math.min(100, hp));
  const g = Math.max(0, Math.min(100 - v, ghost));
  return (
    <div role="img" aria-label={label}
      className={`flex h-[22px] overflow-hidden border-[3px] border-creme bg-violet ${reverse ? 'flex-row-reverse skew-x-[16deg]' : '-skew-x-[16deg]'}`}>
      <div className="h-full transition-[width] duration-700 ease-out" style={{ width: `${v}%`, background: 'linear-gradient(180deg,#FFE98A 0 40%,#FFD23D 40% 100%)' }} />
      <div className="h-full bg-rouge transition-[width] duration-700" style={{ width: `${g}%` }} />
    </div>
  );
}

export function Gauge({ value, max = 7, label }: { value: number; max?: number; label?: string }) {
  return (
    <div className="flex -skew-x-[16deg] gap-1" role="img" aria-label={label ?? `Jauge de super : ${value} crans sur ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <div key={i} className={`h-[16px] w-[18px] border-2 ${i < value ? 'border-encre bg-neon' : 'border-prune bg-violet'}`} />
      ))}
    </div>
  );
}

export function Skyline({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 720 200" className={className} aria-hidden preserveAspectRatio="xMidYMax slice">
      <g style={{ fill: '#5A2A7A', stroke: '#140A22', strokeWidth: 3 }}>
        <rect x="0" y="80" width="70" height="120" /><rect x="64" y="44" width="58" height="156" /><polygon points="64,44 93,22 122,44" />
        <rect x="118" y="96" width="52" height="104" /><rect x="166" y="30" width="64" height="170" /><rect x="228" y="72" width="50" height="128" />
        <rect x="276" y="18" width="40" height="182" /><rect x="314" y="60" width="76" height="140" /><rect x="388" y="90" width="56" height="110" />
        <rect x="442" y="40" width="70" height="160" /><rect x="510" y="84" width="60" height="116" /><rect x="568" y="50" width="64" height="150" />
        <rect x="630" y="98" width="90" height="102" />
      </g>
      <g style={{ fill: '#FFD23D' }}>
        <rect x="76" y="60" width="8" height="10" /><rect x="98" y="84" width="8" height="10" /><rect x="178" y="46" width="8" height="10" />
        <rect x="200" y="70" width="8" height="10" /><rect x="286" y="40" width="8" height="10" /><rect x="328" y="76" width="8" height="10" />
        <rect x="456" y="58" width="8" height="10" /><rect x="480" y="82" width="8" height="10" /><rect x="580" y="68" width="8" height="10" />
      </g>
      <g style={{ fill: '#2A1548', stroke: '#140A22', strokeWidth: 3 }}>
        <rect x="0" y="140" width="120" height="60" /><rect x="112" y="124" width="90" height="76" /><rect x="200" y="150" width="130" height="50" />
        <rect x="324" y="132" width="110" height="68" /><rect x="430" y="146" width="140" height="54" /><rect x="566" y="128" width="154" height="72" />
      </g>
    </svg>
  );
}

const INK = '#140A22';
const GOLD = 'linear-gradient(180deg,#FFE98A 0 40%,#FFD23D 40% 100%)';

/** Brasero posé sur un poteau du ring (flamme du ring, palier 1). */
function Brasero({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 30 40" width="30" height="40" className={`absolute ${className}`} style={{ overflow: 'visible' }}>
      <g className="animate-flicker motion-reduce:animate-none" style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}>
        <path d="M15 1C17 9 26 12 26 21C26 27 21 31 15 31C9 31 4 27 4 21C4 16 7.5 13.5 9.5 11C9.5 15 11.5 17 13.5 17C13 11 12.5 6.5 15 1Z" style={{ fill: '#F7893B', stroke: INK, strokeWidth: 2.5, strokeLinejoin: 'round' }} />
        <path d="M15 14C16.5 18 20.5 19.5 20.5 23.5C20.5 27 18 29 15 29C12 29 9.5 27 9.5 24C9.5 21.5 11 20 12.3 19C12.6 21 13.5 22 14.5 22C14.2 19 14 16.5 15 14Z" style={{ fill: '#FFD23D' }} />
      </g>
      <path d="M2 29H28L24 38H6Z" style={{ fill: '#5A2A7A', stroke: INK, strokeWidth: 2.5, strokeLinejoin: 'round' }} />
    </svg>
  );
}

/** Guirlande de fanions tendue en haut du ring (palier 2). Les fanions suivent la courbe de la corde. */
function Bunting() {
  const SAG = 40, COLORS = ['#E8287C', '#2BB5FF', '#FFD23D', '#FFF4E3'];
  return (
    <div className="absolute inset-x-0 top-0 h-[44px]">
      <svg viewBox="0 0 100 44" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d={`M0 2Q50 ${2 + SAG} 100 2`} vectorEffect="non-scaling-stroke" style={{ fill: 'none', stroke: INK, strokeWidth: 2.5 }} />
      </svg>
      {[7, 18, 29, 40, 50, 60, 71, 82, 93].map((x, i) => (
        <svg key={x} viewBox="0 0 16 18" width="16" height="18" className="absolute -ml-2" style={{ left: `${x}%`, top: Math.round(1 + SAG * (x / 100) * (1 - x / 100)) }}>
          <path d="M1 1H15L8 16Z" style={{ fill: COLORS[i % COLORS.length], stroke: INK, strokeWidth: 2, strokeLinejoin: 'round' }} />
        </svg>
      ))}
    </div>
  );
}

/** Bouquet de feu d'artifice (palier 3). */
function Firework({ color, size, className, delay = 0 }: { color: string; size: number; className: string; delay?: number }) {
  const rays = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
    return { c: Math.round(Math.cos(a) * 100) / 100, s: Math.round(Math.sin(a) * 100) / 100 };
  });
  return (
    <svg viewBox="-32 -32 64 64" width={size} height={size} className={`absolute animate-twinkle motion-reduce:animate-none ${className}`} style={{ animationDelay: `${delay}s` }}>
      {rays.map(({ c, s }, i) => (
        <g key={i}>
          <line x1={c * 9} y1={s * 9} x2={c * 20} y2={s * 20} style={{ stroke: INK, strokeWidth: 5.5, strokeLinecap: 'round' }} />
          <line x1={c * 9} y1={s * 9} x2={c * 20} y2={s * 20} style={{ stroke: color, strokeWidth: 2.6, strokeLinecap: 'round' }} />
          <circle cx={c * 27} cy={s * 27} r={2.6} style={{ fill: color, stroke: INK, strokeWidth: 1.6 }} />
        </g>
      ))}
    </svg>
  );
}

/**
 * Décor de ring au coucher de soleil, avec cordes et sol. `flame` est le palier de la flamme du ring (0 à 3) :
 * 1 allume les braseros, 2 ajoute les projecteurs et les fanions, 3 les cordes d'or et le feu d'artifice.
 */
export function RingScene({ height = 280, children, ropes = true, className = '', flame = 0 }: { height?: number; children?: React.ReactNode; ropes?: boolean; className?: string; flame?: number }) {
  const gold = flame >= 3;
  const ROPES: [string, number][] = [['bg-magenta', 168], ['bg-creme', 134], ['bg-neon', 100]];
  return (
    <div className={`sunset relative overflow-hidden ${className}`} style={{ height }}>
      <div className="halftone absolute inset-0" aria-hidden />
      {flame >= 2 ? (
        <div className="absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-creme/20" style={{ clipPath: 'polygon(3% 100%, 13% 100%, 80% 0, 54% 0)' }} />
          <div className="absolute inset-0 bg-creme/20" style={{ clipPath: 'polygon(97% 100%, 87% 100%, 20% 0, 46% 0)' }} />
        </div>
      ) : null}
      {flame >= 3 ? (
        <div aria-hidden>
          {/* Au centre du ciel : les combattants se tiennent de part et d'autre. */}
          <Firework color="#FFD23D" size={58} className="left-[calc(50%-64px)] top-[42px]" />
          <Firework color="#2BB5FF" size={44} className="left-[calc(50%+12px)] top-[56px]" delay={1.2} />
        </div>
      ) : null}
      <Skyline className="absolute inset-x-0 bottom-[40px] h-[150px] w-full" />
      {ropes ? (
        <div aria-hidden>
          <div className="absolute left-2 bottom-[46px] h-[140px] w-[14px] border-[3px] border-encre bg-soleil" />
          <div className="absolute right-2 bottom-[46px] h-[140px] w-[14px] border-[3px] border-encre bg-soleil" />
          {ROPES.map(([color, bottom]) => (
            <div key={bottom} className={`absolute inset-x-5 h-[7px] border-2 border-encre ${gold ? '' : color}`} style={gold ? { bottom, background: GOLD } : { bottom }} />
          ))}
          {flame >= 1 ? <><Brasero className="bottom-[183px] left-0" /><Brasero className="bottom-[183px] right-0" /></> : null}
        </div>
      ) : null}
      {flame >= 2 ? <div aria-hidden><Bunting /></div> : null}
      <div className="absolute inset-x-0 bottom-0 h-[52px] border-t-[5px] border-magenta bg-violet" aria-hidden />
      {children}
    </div>
  );
}

export function Burst({ text, sub, className = '', color = '#FFD23D' }: { text: string; sub?: string; className?: string; color?: string }) {
  const pts: string[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (Math.PI * i) / 12 - Math.PI / 2;
    const r = i % 2 === 0 ? (i % 4 === 0 ? 58 : 50) : 34;
    pts.push(`${Math.round(60 + Math.cos(a) * r)},${Math.round(50 + Math.sin(a) * r * 0.82)}`);
  }
  return (
    <div className={`pointer-events-none relative grid place-items-center ${className}`} style={{ width: 150, height: 122 }}>
      <svg viewBox="0 0 120 100" width="150" height="122" className="absolute inset-0" aria-hidden style={{ overflow: 'visible' }}>
        <polygon points={pts.join(' ')} style={{ fill: color, stroke: '#140A22', strokeWidth: 4, strokeLinejoin: 'round' }} />
      </svg>
      <div className="relative -rotate-6 text-center leading-none">
        <div className={`stroke-text whitespace-nowrap font-sans font-black italic text-magenta ${text.length > 7 ? 'text-[21px]' : text.length > 5 ? 'text-[25px]' : 'text-[30px]'}`}>{text}</div>
        {sub ? <div className="mt-1 font-display text-[15px] text-encre">{sub}</div> : null}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card-line px-4 py-6 text-center text-sm text-lilas">{children}</div>;
}
