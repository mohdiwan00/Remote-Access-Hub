import { motion } from 'framer-motion';

export function Scene6() {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center z-10 bg-[var(--color-bg-dark)]"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Logo Mark Small */}
        <motion.div
          className="w-[8vw] h-[8vw] mb-6 relative flex items-center justify-center"
          initial={{ scale: 0, rotate: 90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.5, duration: 1, type: "spring", bounce: 0.5 }}
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">
            <polygon
              points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25"
              fill="rgba(6,182,212,0.1)"
              stroke="var(--color-primary)"
              strokeWidth="3"
            />
            <path
              d="M 35 35 L 65 65 M 65 35 L 35 65"
              stroke="var(--color-text-primary)"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>

        {/* Brand Name */}
        <div className="overflow-hidden mb-6">
          <motion.h1
            className="text-[7vw] font-display font-bold tracking-tight text-white leading-none"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Connect<span className="text-[var(--color-primary)]">X</span>
          </motion.h1>
        </div>

        {/* Tagline */}
        <div className="overflow-hidden mb-12">
          <motion.p
            className="text-[2.2vw] font-body text-slate-300 font-light"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            Master your servers anywhere.
          </motion.p>
        </div>

        {/* App Store Badges Mockup */}
        <motion.div
          className="flex gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <div className="w-[12vw] h-[4vw] bg-white rounded-lg flex items-center justify-center text-black font-display font-bold text-[1.2vw] hover:scale-105 transition-transform">
            App Store
          </div>
          <div className="w-[12vw] h-[4vw] bg-white rounded-lg flex items-center justify-center text-black font-display font-bold text-[1.2vw] hover:scale-105 transition-transform">
            Google Play
          </div>
        </motion.div>
      </div>

      {/* Decorative Flare */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[100vw] h-[20vh] bg-[var(--color-primary)]/20 blur-[100px] rounded-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 2 }}
      />
    </motion.div>
  );
}
