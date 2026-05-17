export function DashboardGradient() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute -inset-[100px] animate-[gradient-drift_20s_ease-in-out_infinite] will-change-transform dark:hidden"
        style={{
          background: [
            'radial-gradient(ellipse 600px 600px at 5% 5%, rgba(139,92,246,0.28) 0%, transparent 70%)',
            'radial-gradient(ellipse 500px 500px at 90% 8%, rgba(236,72,153,0.22) 0%, transparent 70%)',
            'radial-gradient(ellipse 500px 450px at 3% 30%, rgba(14,165,233,0.20) 0%, transparent 70%)',
            'radial-gradient(ellipse 400px 400px at 45% 38%, rgba(168,85,247,0.18) 0%, transparent 70%)',
            'radial-gradient(ellipse 450px 400px at 80% 85%, rgba(251,146,60,0.20) 0%, transparent 70%)',
            'radial-gradient(ellipse 400px 350px at 12% 90%, rgba(34,197,94,0.16) 0%, transparent 70%)',
          ].join(', '),
        }}
      />
      <div
        className="absolute -inset-[100px] animate-[gradient-drift_25s_ease-in-out_infinite_reverse] will-change-transform dark:hidden"
        style={{
          background: [
            'radial-gradient(ellipse 350px 350px at 18% 3%, rgba(59,130,246,0.22) 0%, transparent 70%)',
            'radial-gradient(ellipse 350px 350px at 65% 62%, rgba(244,114,182,0.20) 0%, transparent 70%)',
            'radial-gradient(ellipse 500px 400px at 42% 78%, rgba(45,212,191,0.18) 0%, transparent 70%)',
            'radial-gradient(ellipse 500px 500px at 55% 95%, rgba(250,204,21,0.18) 0%, transparent 70%)',
            'radial-gradient(ellipse 450px 450px at 18% 55%, rgba(217,70,239,0.18) 0%, transparent 70%)',
            'radial-gradient(ellipse 600px 600px at 5% 95%, rgba(99,102,241,0.22) 0%, transparent 70%)',
          ].join(', '),
        }}
      />

      <div
        className="absolute -inset-[100px] animate-[gradient-drift_20s_ease-in-out_infinite] will-change-transform hidden dark:block"
        style={{
          background: [
            'radial-gradient(ellipse 600px 600px at 5% 5%, rgba(89,87,232,0.12) 0%, transparent 70%)',
            'radial-gradient(ellipse 500px 500px at 90% 8%, rgba(236,72,153,0.08) 0%, transparent 70%)',
            'radial-gradient(ellipse 500px 450px at 3% 30%, rgba(6,182,212,0.07) 0%, transparent 70%)',
            'radial-gradient(ellipse 400px 400px at 45% 38%, rgba(139,92,246,0.06) 0%, transparent 70%)',
            'radial-gradient(ellipse 450px 400px at 80% 85%, rgba(245,158,11,0.06) 0%, transparent 70%)',
            'radial-gradient(ellipse 400px 350px at 12% 90%, rgba(16,185,129,0.05) 0%, transparent 70%)',
          ].join(', '),
        }}
      />
      <div
        className="absolute -inset-[100px] animate-[gradient-drift_25s_ease-in-out_infinite_reverse] will-change-transform hidden dark:block"
        style={{
          background: [
            'radial-gradient(ellipse 350px 350px at 18% 3%, rgba(59,130,246,0.09) 0%, transparent 70%)',
            'radial-gradient(ellipse 350px 350px at 65% 62%, rgba(251,113,133,0.07) 0%, transparent 70%)',
            'radial-gradient(ellipse 500px 400px at 42% 78%, rgba(52,211,153,0.06) 0%, transparent 70%)',
            'radial-gradient(ellipse 500px 500px at 55% 95%, rgba(245,158,11,0.06) 0%, transparent 70%)',
            'radial-gradient(ellipse 450px 450px at 18% 55%, rgba(232,121,249,0.07) 0%, transparent 70%)',
            'radial-gradient(ellipse 600px 600px at 5% 95%, rgba(99,102,241,0.08) 0%, transparent 70%)',
          ].join(', '),
        }}
      />
    </div>
  )
}
