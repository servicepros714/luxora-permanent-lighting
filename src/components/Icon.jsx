const P = {
  calendar: 'M4 7h16v13H4zM4 11h16M8 4v5M16 4v5',
  compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm3.5 5.5-2 5-5 2 2-5z',
  ladder: 'M8 3v18M16 3v18M8 7h8M8 11h8M8 15h8M8 19h8',
  box: 'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8',
  tree: 'M12 3l5 7h-3l4 6h-5v5h-2v-5H6l4-6H7z',
  wreath: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM10 19l2-2 2 2',
  path: 'M9 21l2-18M15 21l-2-18M5 9v4M19 9v4M5 7h0M19 7h0',
  plug: 'M9 3v5M15 3v5M7 8h10v4a5 5 0 0 1-10 0zM12 17v4',
  phone: 'M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 6a2 2 0 0 1 2-2z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  close: 'M6 6l12 12M18 6L6 18',
  lock: 'M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  home: 'M4 11l8-7 8 7M6 10v10h12V10',
  pin: 'M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
};

export default function Icon({ name, size = 22, stroke = 1.6, className = '' }) {
  return (
    <svg className={`ico ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={P[name] || P.check} />
    </svg>
  );
}

/* The logo's house-with-three-rays crest, drawn as vector for small UI marks. */
export function Crest({ size = 28, className = '', lit = true }) {
  return (
    <svg className={`crest ${lit ? 'is-lit' : ''} ${className}`} width={size} height={size * 0.72} viewBox="0 0 100 72" aria-hidden="true" focusable="false">
      <g className="crest__rays" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
        <path d="M50 4v13" />
        <path d="M26 12l8 8" />
        <path d="M74 12l-8 8" />
      </g>
      <path d="M8 66 L50 30 L92 66" fill="none" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" />
      <rect x="43" y="46" width="14" height="14" fill="currentColor" />
    </svg>
  );
}
