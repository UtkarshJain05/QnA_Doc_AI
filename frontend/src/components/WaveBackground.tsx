const WaveBackground = () => {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,#020617,#0f172a)]" />

      {/* Teal orb top-right */}
      <div
        className="absolute -top-32 right-1/4 h-[500px] w-[500px] rounded-full opacity-20 blur-[120px] animate-[float_8s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, #22d3ee, transparent 70%)" }}
      />

      {/* Green orb bottom-left */}
      <div
        className="absolute -bottom-40 -left-20 h-[600px] w-[600px] rounded-full opacity-15 blur-[140px] animate-[float_10s_ease-in-out_infinite_reverse]"
        style={{ background: "radial-gradient(circle, #34d399, transparent 70%)" }}
      />

      {/* Teal orb center */}
      <div
        className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-[100px] animate-[float_12s_ease-in-out_infinite_2s]"
        style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)" }}
      />

      {/* SVG wave overlay */}
      <svg
        className="absolute bottom-0 w-full opacity-[0.07] animate-[float_6s_ease-in-out_infinite]"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill="url(#wave-grad)"
          d="M0,224L48,208C96,192,192,160,288,165.3C384,171,480,213,576,218.7C672,224,768,192,864,170.7C960,149,1056,139,1152,154.7C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
        <defs>
          <linearGradient id="wave-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default WaveBackground;
