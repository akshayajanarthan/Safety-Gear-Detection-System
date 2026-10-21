import { motion } from "framer-motion";

export function BrainOrb({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 blur-3xl" />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="relative aspect-square rounded-full border border-primary/30 grid-bg"
      >
        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
          <defs>
            <radialGradient id="g" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.78 0.15 200)" stopOpacity="0.9" />
              <stop offset="60%" stopColor="oklch(0.7 0.19 300)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="70" fill="url(#g)" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const x1 = 100 + Math.cos(a) * 40;
            const y1 = 100 + Math.sin(a) * 40;
            const x2 = 100 + Math.cos(a) * 88;
            const y2 = 100 + Math.sin(a) * 88;
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="oklch(0.85 0.18 190 / 0.5)"
                strokeWidth="1"
              />
            );
          })}
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const r = 40 + (i % 3) * 15;
            return (
              <circle
                key={`d${i}`}
                cx={100 + Math.cos(a) * r}
                cy={100 + Math.sin(a) * r}
                r={1.6}
                fill="oklch(0.85 0.18 190)"
              />
            );
          })}
        </svg>
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon shadow-[0_0_30px_oklch(0.85_0.18_190)]"
      />
    </div>
  );
}
