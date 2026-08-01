import { motion } from 'framer-motion';

const protocols = [
  { name: 'SSH', color: 'var(--color-primary)', x: '-20vw', y: '-10vh' },
  { name: 'VNC', color: 'var(--color-secondary)', x: '20vw', y: '-15vh' },
  { name: 'RDP', color: 'var(--color-accent)', x: '-15vw', y: '15vh' },
  { name: 'SFTP', color: '#f59e0b', x: '15vw', y: '10vh' },
];

export function Scene2() {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center z-10 perspective-1000"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      transition={{ duration: 0.8 }}
    >
      {/* Central Hub */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[8vw] h-[8vw] rounded-full border border-white/20 bg-glass flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] z-20"
        style={{ x: '-50%', y: '-50%' }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
      >
        <div className="w-1/2 h-1/2 rounded-full bg-white/10 pulse" />
      </motion.div>

      {/* Protocol Nodes and Lines */}
      {protocols.map((proto, idx) => (
        <div key={proto.name}>
          {/* Connecting Line */}
          <motion.svg className="absolute top-1/2 left-1/2 w-full h-full overflow-visible pointer-events-none z-10" style={{ x: '-50%', y: '-50%' }}>
            <motion.line
              x1="50%"
              y1="50%"
              x2={`calc(50% + ${proto.x})`}
              y2={`calc(50% + ${proto.y})`}
              stroke={proto.color}
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ delay: 0.5 + idx * 0.15, duration: 0.8 }}
            />
          </motion.svg>
          
          {/* Node */}
          <motion.div
            className="absolute top-1/2 left-1/2 flex items-center justify-center bg-[#020617] border-2 rounded-xl z-20 w-[12vw] h-[6vw] font-display font-bold text-[2vw] tracking-wider"
            style={{ 
              borderColor: proto.color,
              x: `calc(-50% + ${proto.x})`,
              y: `calc(-50% + ${proto.y})`,
              color: proto.color,
              boxShadow: `0 0 20px ${proto.color}40`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 + idx * 0.15, type: 'spring', bounce: 0.5 }}
          >
            {proto.name}
          </motion.div>
        </div>
      ))}

      {/* Text Content */}
      <div className="absolute bottom-[10vh] flex flex-col items-center">
        <div className="overflow-hidden mb-2">
          <motion.h2
            className="text-[3.5vw] font-display font-bold text-white leading-none"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ delay: 1.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            One app. All protocols.
          </motion.h2>
        </div>
        <motion.p
          className="text-[1.5vw] font-mono text-[var(--color-text-secondary)]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
        >
          Connect to any server, anywhere, instantly.
        </motion.p>
      </div>
    </motion.div>
  );
}
