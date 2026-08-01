import { motion } from 'framer-motion';

const cloudProviders = [
  { name: 'Google Drive', color: '#10b981', icon: 'M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z' },
  { name: 'Dropbox', color: '#3b82f6', icon: 'M7 2l5 3.5L7 9 2 5.5 7 2zm10 0l5 3.5L17 9l-5-3.5L17 2zM2 12.5L7 16l5-3.5L7 9l-5 3.5zm15-3.5l5 3.5L17 16l-5-3.5L17 9zm-5 4.5l5 3.5v5l-5-3.5v-5z' },
  { name: 'AWS S3', color: '#f59e0b', icon: 'M12 2l10 5v10l-10 5-10-5V7l10-5zm0 2.5L4.5 8.5v7L12 19.5l7.5-4v-7L12 4.5z' },
  { name: 'OneDrive', color: '#06b6d4', icon: 'M17 6a4 4 0 00-7.8-1.2 5 5 0 00-7.1 3.5A4.5 4.5 0 006.5 17h11a4.5 4.5 0 00-.5-8.9V6z' },
];

const files = [
  { name: 'config.json', size: '12 KB', type: 'file' },
  { name: 'app_data', size: '--', type: 'folder' },
  { name: 'deploy.sh', size: '4 KB', type: 'file' },
  { name: 'backups', size: '--', type: 'folder' },
];

export function Scene4() {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex z-10"
      initial={{ opacity: 0, x: '10vw' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* File Browser Mockup */}
      <div className="w-[50vw] h-full flex items-center justify-center p-[5vw]">
        <motion.div
          className="w-full bg-[#020617] border border-slate-800 rounded-xl overflow-hidden shadow-2xl"
          initial={{ rotateY: 15, scale: 0.9, opacity: 0, perspective: 1000 }}
          animate={{ rotateY: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.2 }}
        >
          {/* Header */}
          <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between">
            <div className="font-display font-medium text-white flex items-center gap-2 text-[1.2vw]">
              <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              /var/www/production
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* File List */}
          <div className="flex flex-col">
            {files.map((file, idx) => (
              <motion.div
                key={file.name}
                className="flex items-center justify-between p-4 border-b border-slate-800/50 hover:bg-slate-800/30"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + idx * 0.1 }}
              >
                <div className="flex items-center gap-4">
                  {file.type === 'folder' ? (
                    <svg className="w-6 h-6 text-[var(--color-primary)]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span className="font-mono text-[1.1vw] text-slate-200">{file.name}</span>
                </div>
                <span className="font-mono text-[1vw] text-slate-500">{file.size}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Cloud Integration */}
      <div className="w-[50vw] h-full flex flex-col justify-center pr-[5vw]">
        <motion.h2
          className="text-[4vw] font-display font-bold text-white leading-tight mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Seamless <span className="text-[var(--color-primary)]">Cloud</span> Integration
        </motion.h2>
        <motion.p
          className="text-[1.5vw] font-body text-slate-400 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          Transfer files directly between your servers and cloud storage.
        </motion.p>

        <div className="grid grid-cols-2 gap-4">
          {cloudProviders.map((cloud, idx) => (
            <motion.div
              key={cloud.name}
              className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-4 backdrop-blur-md"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1 + idx * 0.15, type: "spring", bounce: 0.4 }}
            >
              <svg className="w-8 h-8" style={{ color: cloud.color }} fill="currentColor" viewBox="0 0 24 24">
                <path d={cloud.icon} />
              </svg>
              <span className="font-display font-medium text-white text-[1.2vw]">{cloud.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
