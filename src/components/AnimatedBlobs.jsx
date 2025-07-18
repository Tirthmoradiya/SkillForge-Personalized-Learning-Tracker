export default function AnimatedBlobs() {
  return (
    <div className="pointer-events-none select-none absolute inset-0 -z-10 overflow-hidden">
      <svg width="100%" height="100%" className="absolute top-0 left-0 opacity-30 blur-2xl animate-pulse-slow" style={{ zIndex: -1 }}>
        <defs>
          <radialGradient id="blob1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
          </radialGradient>
        </defs>
        <ellipse cx="30%" cy="20%" rx="220" ry="140" fill="url(#blob1)" />
        <ellipse cx="80%" cy="70%" rx="180" ry="120" fill="url(#blob1)" />
      </svg>
      <svg width="100%" height="100%" className="absolute bottom-0 right-0 opacity-20 blur-3xl animate-pulse-slow" style={{ zIndex: -1 }}>
        <ellipse cx="80%" cy="90%" rx="200" ry="100" fill="#f472b6" />
        <ellipse cx="10%" cy="80%" rx="120" ry="80" fill="#34d399" />
      </svg>
      <style>{`
        .animate-pulse-slow { animation: pulseSlow 8s ease-in-out infinite alternate; }
        @keyframes pulseSlow { 0% { opacity: 0.7; } 100% { opacity: 0.3; } }
      `}</style>
    </div>
  );
} 