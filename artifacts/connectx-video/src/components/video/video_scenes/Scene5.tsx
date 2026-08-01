import { motion } from 'framer-motion';

export function Scene5() {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: '-10vh', filter: 'blur(10px)' }}
      transition={{ duration: 0.8 }}
    >
      {/* Central Shield/Lock */}
      <div className="relative flex items-center justify-center mb-12">
        <motion.div
          className="absolute w-[20vw] h-[20vw] rounded-full border border-[var(--color-secondary)]/30 border-dashed"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute w-[15vw] h-[15vw] rounded-full border-t-2 border-[var(--color-primary)]"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        
        <motion.div
          className="w-[10vw] h-[10vw] bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 shadow-[0_0_50px_rgba(139,92,246,0.2)] relative overflow-hidden"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1, type: "spring", bounce: 0.5 }}
        >
          {/* Scanning effect */}
          <motion.div
            className="absolute top-0 left-0 w-full h-1 bg-[var(--color-primary)] shadow-[0_0_10px_rgba(6,182,212,0.8)]"
            animate={{ y: ['0%', '1000%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <svg className="w-[5vw] h-[5vw] text-[var(--color-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </motion.div>
      </div>

      {/* Security Tags */}
      <div className="flex flex-wrap justify-center gap-4 max-w-[60vw] mb-12">
        {['Biometric Lock', 'SSH Key Manager (Ed25519/RSA)', 'Tailscale Integration', 'Mosh Support', 'Audit Logs'].map((tag, idx) => (
          <motion.div
            key={tag}
            className="px-6 py-3 rounded-full bg-slate-900 border border-slate-700 font-mono text-[1vw] text-slate-300 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + idx * 0.15, type: "spring" }}
          >
            {tag}
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <motion.h2
          className="text-[4.5vw] font-display font-bold text-white leading-tight mb-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          Uncompromised <span className="text-[var(--color-secondary)] text-glow-purple">Security</span>
        </motion.h2>
      </div>
    </motion.div>
  );
}
