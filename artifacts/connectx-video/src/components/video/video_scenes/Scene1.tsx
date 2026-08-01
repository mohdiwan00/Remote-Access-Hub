import { motion } from 'framer-motion';

export function Scene1() {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Abstract Logo */}
        <motion.div
          className="relative flex items-center justify-center w-[15vw] h-[15vw] mb-8"
          initial={{ scale: 0.8, rotate: -30, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          {/* Hexagon outline */}
          <motion.svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]">
            <motion.polygon
              points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            {/* The 'X' inside */}
            <motion.path
              d="M 35 35 L 65 65 M 65 35 L 35 65"
              stroke="var(--color-text-primary)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
            />
          </motion.svg>
        </motion.div>

        {/* Brand Name */}
        <div className="overflow-hidden mb-4">
          <motion.h1
            className="text-[6vw] font-display font-bold tracking-tight text-white leading-none"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Connect<span className="text-[var(--color-primary)]">X</span>
          </motion.h1>
        </div>

        {/* Tagline */}
        <motion.p
          className="text-[1.8vw] font-mono text-[var(--color-text-secondary)] tracking-widest uppercase"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          The ultimate remote access powerhouse
        </motion.p>
        
        {/* Decorative Grid Lines */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] border border-[rgba(255,255,255,0.02)] rounded-full pointer-events-none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 2, ease: "easeOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] border border-[rgba(6,182,212,0.05)] rounded-full pointer-events-none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.7, duration: 2.5, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}
