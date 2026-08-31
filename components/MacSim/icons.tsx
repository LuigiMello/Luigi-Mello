export function BraveIcon() {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <defs>
        <linearGradient id="braveGrad" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#ff9a52" />
          <stop offset="100%" stopColor="#f5321f" />
        </linearGradient>
      </defs>
      <path
        d="M24 2.5 Q30 2.5 32.5 5.5 L36.5 9.5 Q38.5 11.3 37 13.3 L35 15.7
           Q37.5 18 37.8 20.8 L34.5 39 Q34 41.7 31.7 43 L25.6 46.2
           Q24 47 22.4 46.2 L16.3 43 Q14 41.7 13.5 39 L10.2 20.8
           Q10.5 18 13 15.7 L11 13.3 Q9.5 11.3 11.5 9.5 L15.5 5.5 Q18 2.5 24 2.5 Z"
        fill="url(#braveGrad)"
      />
      <path
        d="M24 10 Q28.5 10 30.8 12.7 L33 15 Q31 16.8 29.7 19 L27.5 36.3
           Q26.8 40 24 42 Q21.2 40 20.5 36.3 L18.3 19 Q17 16.8 15 15
           L17.2 12.7 Q19.5 10 24 10 Z"
        fill="#fff"
      />
      <path d="M24 16.3 L28.4 19 L26.6 22.8 L24 21.3 L21.4 22.8 L19.6 19 Z" fill="#f5321f" />
      <path
        d="M24 21.7 L27.2 23.4 L25.7 32.7 L24 34.8 L22.3 32.7 L20.8 23.4 Z"
        fill="#f5321f"
        opacity="0.94"
      />
    </svg>
  );
}

export function DiscordIcon() {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <path
        d="M17.5 8.5 Q13 10 10.3 14 Q7.5 18.3 7.5 24 Q7.5 30.5 11.3 34.8
           Q13.7 37.5 17 38.8 L18.7 35.3 Q21.3 36 24 36 Q26.7 36 29.3 35.3
           L31 38.8 Q34.3 37.5 36.7 34.8 Q40.5 30.5 40.5 24 Q40.5 18.3 37.7 14
           Q35 10 30.5 8.5 L28.7 11.8 Q26.4 11.2 24 11.2 Q21.6 11.2 19.3 11.8 Z"
        fill="#5865F2"
      />
      <circle cx="18.6" cy="24.5" r="3" fill="#fff" />
      <circle cx="29.4" cy="24.5" r="3" fill="#fff" />
    </svg>
  );
}

export function SpotifyIcon() {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <circle cx="24" cy="24" r="21" fill="#1ED760" />
      <path d="M12.5 20.5 Q24 13.5 35.5 20.5" stroke="#191414" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M14.5 27 Q24 21.3 33.5 27" stroke="#191414" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M16.5 33 Q24 29 31.5 33" stroke="#191414" strokeWidth="2.3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function DevToolIcon() {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <defs>
        <linearGradient id="devGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f34386" />
          <stop offset="100%" stopColor="#9c1c5a" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="11" fill="url(#devGrad)" />
      <text
        x="24"
        y="30.5"
        textAnchor="middle"
        fontFamily="var(--font-mono), monospace"
        fontWeight="700"
        fontSize="16"
        fill="#fff"
      >
        IJ
      </text>
    </svg>
  );
}

export function NotebookIcon() {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <rect width="48" height="48" rx="11" fill="#1f6feb" />
      <rect x="9" y="9" width="5" height="30" rx="2" fill="#0b3d91" />
      <line x1="18" y1="16" x2="36" y2="16" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="18" y1="23.5" x2="36" y2="23.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="18" y1="31" x2="29" y2="31" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function CodeIcon() {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <defs>
        <linearGradient id="vscodeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5cd1ff" />
          <stop offset="100%" stopColor="#0d6ecd" />
        </linearGradient>
      </defs>
      <path
        d="M33 3.5 L44.5 9.5 L44.5 38.5 L33 44.5 L18.5 30.8 L9.5 37.5 L4 33.7
           L14.5 24 L4 14.3 L9.5 10.5 L18.5 17.2 Z"
        fill="url(#vscodeGrad)"
      />
      <path
        d="M33 3.5 L44.5 9.5 L44.5 38.5 L33 44.5 L18.5 30.8 L33 24 Z"
        fill="#0a4f9e"
        opacity="0.55"
      />
    </svg>
  );
}

export function NotesIcon() {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <rect x="6" y="6" width="36" height="36" rx="9" fill="#fdd835" />
      <line x1="14" y1="17" x2="34" y2="17" stroke="#5c4b00" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="14" y1="24" x2="34" y2="24" stroke="#5c4b00" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="14" y1="31" x2="27" y2="31" stroke="#5c4b00" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function TerminalIcon() {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <rect width="48" height="48" rx="11" fill="#111820" />
      <path
        d="M13 18 L21 24 L13 30"
        stroke="#00d0ff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1="24" y1="30" x2="35" y2="30" stroke="#e0efff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <rect width="48" height="48" rx="11" fill="#22a55e" />
      <rect x="14" y="14.5" width="20" height="3" rx="1.5" fill="#fff" />
      <rect x="20" y="10.5" width="8" height="3" rx="1.5" fill="#fff" />
      <path
        d="M16 18h16l-1.4 18.3a2.6 2.6 0 0 1-2.6 2.4h-8a2.6 2.6 0 0 1-2.6-2.4Z"
        fill="#fff"
      />
      <line x1="20.3" y1="21.5" x2="20.3" y2="34.5" stroke="#22a55e" strokeWidth="1.7" strokeLinecap="round" />
      <line x1="24" y1="21.5" x2="24" y2="34.5" stroke="#22a55e" strokeWidth="1.7" strokeLinecap="round" />
      <line x1="27.7" y1="21.5" x2="27.7" y2="34.5" stroke="#22a55e" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function LaunchpadIcon() {
  const dots = Array.from({ length: 9 });
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <rect width="48" height="48" rx="11" fill="#1a2436" />
      {dots.map((_, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        return (
          <circle
            key={i}
            cx={14 + col * 10}
            cy={14 + row * 10}
            r="3.2"
            fill="#8fb4de"
          />
        );
      })}
    </svg>
  );
}

export function PowerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15">
      <path
        d="M12 3v8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.5 6.5a8 8 0 1 0 11 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function WifiIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15">
      <path d="M3 9c5-4.5 13-4.5 18 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M6.5 12.7c3-2.6 8-2.6 11 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M10 16.3c1.3-1 2.7-1 4 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="12" cy="19" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function VolumeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15">
      <path d="M4 10v4h3.5L12 17.5v-11L7.5 10Z" fill="currentColor" />
      <path d="M15.5 9a4.5 4.5 0 0 1 0 6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function BatteryIcon() {
  return (
    <svg viewBox="0 0 26 14" width="22" height="12">
      <rect x="1" y="1" width="20" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <rect x="22.4" y="4.5" width="2" height="5" rx="1" fill="currentColor" />
      <rect x="3" y="3" width="9" height="8" rx="1.2" fill="currentColor" />
    </svg>
  );
}

export function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path
        d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path
        d="M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2M6.2 6.5C3.9 8 2 12 2 12s3.8 6.5 10 6.5c2 0 3.7-.6 5.1-1.4M17.9 17.9C20.3 16.2 22 12 22 12s-1.4-2.4-3.7-4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
