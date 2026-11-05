/* Illustrated night-install scenes (SVG). Used by the hero timelapse and the gallery book.
   Sky and ground extend past the viewBox so "meet" fitting never shows empty bars. */
import { useId, useMemo } from 'react';

const SHAPES = {
  gable: {
    walls: [[350, 215, 500, 215], [850, 300, 200, 130]],
    roofs: ['318,222 600,98 882,222', '836,306 872,262 1040,262 1078,306'],
    track: [[[318, 222], [600, 98], [882, 222]], [[836, 306], [872, 262], [1040, 262], [1078, 306]]],
    windows: [[398, 246, 76, 56], [726, 246, 76, 56], [396, 336, 86, 60], [718, 336, 86, 60]],
    round: [600, 170, 18],
    door: [570, 332, 60, 98],
    garage: [880, 336, 140, 94],
    palm: true,
  },
  ranch: {
    walls: [[250, 300, 700, 130]],
    roofs: ['220,306 400,212 800,212 980,306', '470,306 560,246 650,306'],
    chimney: [700, 172, 36, 60],
    track: [[[220, 306], [400, 212], [800, 212], [980, 306]], [[470, 306], [560, 246], [650, 306]]],
    windows: [[284, 330, 92, 56], [392, 330, 60, 56], [688, 330, 92, 56], [810, 330, 92, 56]],
    door: [536, 332, 48, 98],
    palm: true,
  },
  cottage: {
    walls: [[330, 250, 560, 180]],
    roofs: ['300,258 470,130 640,258', '600,258 760,160 920,258'],
    track: [[[300, 258], [470, 130], [640, 258]], [[622, 245], [760, 160], [920, 258]]],
    windows: [[440, 186, 60, 50], [736, 200, 50, 42], [372, 330, 92, 60], [748, 330, 100, 60]],
    door: [560, 322, 60, 108],
  },
};

function sample(lines, spacing) {
  const pts = [];
  for (const line of lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const [x1, y1] = line[i];
      const [x2, y2] = line[i + 1];
      const len = Math.hypot(x2 - x1, y2 - y1);
      const n = Math.max(1, Math.round(len / spacing));
      for (let k = i === 0 ? 0 : 1; k <= n; k++) pts.push([x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n]);
    }
  }
  return pts;
}

const STARS = Array.from({ length: 46 }, (_, i) => {
  const r = Math.sin(i * 91.7) * 10000;
  const r2 = Math.sin(i * 47.3) * 10000;
  return [((r - Math.floor(r)) * 1500) - 150, ((r2 - Math.floor(r2)) * 190) - 40, i % 5 === 0 ? 1.8 : 1.1];
});

export default function Scene({ shape = 'gable', colors = ['#FFD27A'], extras = [], hero = false, spacing = 22, title, className = '', svgRef }) {
  const uid = useId().replace(/:/g, '');
  const S = SHAPES[shape] || SHAPES.gable;
  const bulbs = useMemo(() => sample(S.track, spacing), [S, spacing]);
  const id = (n) => `${uid}-${n}`;
  const staticVars = hero ? undefined : { '--day': 0, '--dusk': 0, '--night': 1, '--win': 1, '--lit': 999 };
  const trackD = S.track.map((l) => 'M' + l.map((p) => p.join(',')).join(' L')).join(' ');

  return (
    <svg
      ref={svgRef}
      className={`scene ${hero ? 'scene--hero' : ''} ${className}`}
      viewBox="0 0 1200 500"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={title || 'Illustrated home with roofline lights'}
      style={staticVars}
      data-bulbs={bulbs.length}
    >
      <defs>
        <linearGradient id={id('night')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000A1E" />
          <stop offset=".65" stopColor="#0B2348" />
          <stop offset="1" stopColor="#1A3463" />
        </linearGradient>
        <linearGradient id={id('dusk')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1A3463" />
          <stop offset=".55" stopColor="#6A4A6E" />
          <stop offset="1" stopColor="#E08A4C" />
        </linearGradient>
        <linearGradient id={id('gold')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7FA6C9" />
          <stop offset=".6" stopColor="#F2C97A" />
          <stop offset="1" stopColor="#FBE3A2" />
        </linearGradient>
        <radialGradient id={id('win')} cx=".5" cy=".5" r=".6">
          <stop offset="0" stopColor="#FFE9A8" />
          <stop offset="1" stopColor="#F2B53A" />
        </radialGradient>
        <linearGradient id={id('lawn')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3E5A33" />
          <stop offset="1" stopColor="#1E2F1C" />
        </linearGradient>
        <filter id={id('glow')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* sky — oversized so any frame ratio is covered */}
      <rect x="-1200" y="-600" width="3600" height="1100" fill={`url(#${id('night')})`} />
      <rect className="v-dusk" x="-1200" y="-600" width="3600" height="1100" fill={`url(#${id('dusk')})`} />
      <rect className="v-day" x="-1200" y="-600" width="3600" height="1100" fill={`url(#${id('gold')})`} />
      <g className="v-night">
        {STARS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#FBF7EE" opacity={i % 3 ? 0.55 : 0.9} />)}
        <path d="M1036 46 A24 24 0 1 0 1056 88 A21 21 0 1 1 1036 46 Z" fill="#F7EFD9" />
      </g>
      <circle className="v-day" cx="150" cy="330" r="46" fill="#FFE6A0" opacity=".9" />

      {/* ground */}
      <rect x="-1200" y="428" width="3600" height="700" fill={`url(#${id('lawn')})`} />
      <path d={shape === 'cottage' ? 'M560 430 L540 520 L640 520 L620 430 Z' : 'M560 430 L520 520 L680 520 L640 430 Z'} fill="#B9AE9B" opacity=".75" />

      {S.palm && (
        <g className="palm" fill="#1B2A1C">
          <path d="M150 432 C 156 360, 168 290, 178 214 L 186 214 C 178 292, 168 362, 164 432 Z" />
          <path d="M182 214 C 140 196, 104 206, 82 230 C 118 214, 150 214, 182 218 Z M182 214 C 226 192, 262 200, 284 224 C 248 210, 214 212, 182 218 Z M182 214 C 168 176, 140 160, 112 162 C 142 176, 164 194, 180 216 Z M182 214 C 200 174, 230 160, 258 164 C 228 178, 204 194, 184 216 Z M182 212 C 182 182, 190 160, 204 148 C 194 170, 188 192, 186 214 Z" />
        </g>
      )}

      {/* house */}
      <g className="house">
        {S.chimney && <rect x={S.chimney[0]} y={S.chimney[1]} width={S.chimney[2]} height={S.chimney[3]} fill="#5B4A3F" />}
        {S.walls.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} fill={i ? '#D9CDB8' : '#E6DCC8'} />)}
        {S.roofs.map((p, i) => <polygon key={i} points={p} fill="#3B3A42" />)}
        {S.windows.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} rx="2" fill="#2A3550" />)}
        {S.round && <circle cx={S.round[0]} cy={S.round[1]} r={S.round[2]} fill="#2A3550" />}
        {S.door && <rect x={S.door[0]} y={S.door[1]} width={S.door[2]} height={S.door[3]} rx="3" fill="#4A2F22" />}
        {S.garage && (
          <g>
            <rect x={S.garage[0]} y={S.garage[1]} width={S.garage[2]} height={S.garage[3]} fill="#CFC3AE" />
            {[1, 2, 3].map((k) => <line key={k} x1={S.garage[0]} x2={S.garage[0] + S.garage[2]} y1={S.garage[1] + (S.garage[3] * k) / 4} y2={S.garage[1] + (S.garage[3] * k) / 4} stroke="#B6A88F" strokeWidth="2" />)}
          </g>
        )}
        {/* shrubs */}
        <ellipse cx={S.walls[0][0] + 30} cy="430" rx="46" ry="26" fill="#2C4A2A" />
        <ellipse cx={S.walls[0][0] + S.walls[0][2] - 30} cy="430" rx="46" ry="26" fill="#2C4A2A" />
      </g>

      {/* nightfall shade */}
      <rect className="v-shade" x="-1200" y="-600" width="3600" height="1800" fill="#000A1E" />

      {/* window glow */}
      <g className="v-win">
        {S.windows.map(([x, y, w, h], i) => <rect key={i} x={x + 4} y={y + 4} width={w - 8} height={h - 8} rx="2" fill={`url(#${id('win')})`} opacity={i % 2 ? 0.75 : 0.95} />)}
        {S.round && <circle cx={S.round[0]} cy={S.round[1]} r={S.round[2] - 4} fill={`url(#${id('win')})`} />}
        {S.windows.map(([x, y, w, h], i) => <path key={'m' + i} d={`M${x + w / 2} ${y + 4} V${y + h - 4} M${x + 4} ${y + h / 2} H${x + w - 4}`} stroke="#5E3B12" strokeWidth="3" />)}
      </g>

      {/* extras */}
      {extras.includes('wreath') && S.door && (
        <g className="v-lit-extra">
          <circle cx={S.door[0] + S.door[2] / 2} cy={S.door[1] + 26} r="15" fill="none" stroke="#2C5A33" strokeWidth="8" />
          {Array.from({ length: 8 }, (_, k) => (
            <circle key={k} cx={S.door[0] + S.door[2] / 2 + 15 * Math.cos((k * Math.PI) / 4)} cy={S.door[1] + 26 + 15 * Math.sin((k * Math.PI) / 4)} r="2.6" fill="#FFE08A" />
          ))}
          <path d={`M${S.door[0] + S.door[2] / 2 - 6} ${S.door[1] + 40} l6 -4 l6 4`} stroke="#C7302A" strokeWidth="4" fill="none" />
        </g>
      )}
      {extras.includes('trees') && (
        <g className="v-lit-extra">
          {[S.walls[0][0] + 30, S.walls[0][0] + S.walls[0][2] - 30].map((cx, j) =>
            Array.from({ length: 14 }, (_, k) => (
              <circle key={`${j}-${k}`} cx={cx - 40 + ((k * 37) % 80)} cy={414 + ((k * 13) % 26) - 6} r="2.6" fill={colors[k % colors.length]} />
            )),
          )}
        </g>
      )}
      {extras.includes('path') && (
        <g className="v-lit-extra">
          {[0, 1, 2, 3].map((k) => (
            <g key={k}>
              <circle cx={548 - k * 12} cy={446 + k * 20} r="4" fill="#FFE08A" />
              <circle cx={652 + k * 12} cy={446 + k * 20} r="4" fill="#FFE08A" />
            </g>
          ))}
        </g>
      )}

      {/* roofline track + bulbs */}
      <path d={trackD} fill="none" stroke="#1A1A20" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <g className="bulbs-halo" filter={`url(#${id('glow')})`}>
        {bulbs.map(([x, y], i) => <circle key={i} className="bulb" style={{ '--i': i }} cx={x} cy={y} r="9" fill={colors[i % colors.length]} />)}
      </g>
      <g className="bulbs">
        {bulbs.map(([x, y], i) => <circle key={i} className="bulb" style={{ '--i': i }} cx={x} cy={y} r="4.2" fill={colors[i % colors.length]} />)}
      </g>
    </svg>
  );
}
