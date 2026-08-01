import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene3() {
  const [typedChars, setTypedChars] = useState(0);
  const command = "ssh root@production-db-01";
  
  useEffect(() => {
    let timer: any;
    if (typedChars < command.length) {
      timer = setTimeout(() => {
        setTypedChars(c => c + 1);
      }, 80); // realistic typing speed
    }
    return () => clearTimeout(timer);
  }, [typedChars]);

  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: '-10vw', filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute top-[10vh] left-[5vw] max-w-[40vw]">
        <motion.h2
          className="text-[4vw] font-display font-bold text-white leading-tight mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Built-in <span className="text-[var(--color-accent)]">Terminal</span>
        </motion.h2>
        <motion.p
          className="text-[1.5vw] font-body text-slate-400"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          With custom key toolbar for mobile-first control.
        </motion.p>
      </div>

      {/* Terminal Mockup */}
      <motion.div
        className="absolute right-[5vw] top-[15vh] w-[50vw] h-[60vh] bg-[#020617] rounded-xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        initial={{ opacity: 0, x: '10vw', rotateY: -15, perspective: 1000 }}
        animate={{ opacity: 1, x: 0, rotateY: 0 }}
        transition={{ delay: 0.6, duration: 1, type: "spring", bounce: 0.2 }}
        style={{ boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.25)' }}
      >
        {/* Terminal Header */}
        <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <div className="mx-auto text-xs font-mono text-slate-500">root@production</div>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 p-6 font-mono text-[1.2vw] text-slate-300 flex flex-col gap-2">
          <div>
            <span className="text-[var(--color-accent)]">connectx</span>
            <span className="text-slate-500"> ~ $ </span>
            <span>{command.substring(0, typedChars)}</span>
            <motion.span 
              className="inline-block w-2.5 h-[1.2em] bg-slate-400 align-middle ml-1"
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            />
          </div>

          {typedChars === command.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4"
            >
              <div className="text-slate-400">Authenticating with public key "ed25519-key"...</div>
              <div className="text-[var(--color-primary)] mt-2">Welcome to Ubuntu 22.04 LTS</div>
              <div className="text-slate-400 mt-1">System load: 0.12   Processes: 142</div>
              <div className="mt-4">
                <span className="text-[var(--color-accent)]">root@production-db-01</span>
                <span className="text-slate-500"> ~ # </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Custom Key Toolbar */}
        <motion.div 
          className="h-14 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-2 gap-1"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          transition={{ delay: 1.5, duration: 0.6, type: "spring" }}
        >
          {['ESC', 'TAB', 'CTRL', 'ALT', '/', '-', '|', 'UP', 'DWN'].map((key) => (
            <div key={key} className="flex-1 h-10 bg-slate-800 rounded flex items-center justify-center font-mono text-[1vw] text-slate-300 border border-slate-700 shadow-sm active:bg-slate-700">
              {key}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
