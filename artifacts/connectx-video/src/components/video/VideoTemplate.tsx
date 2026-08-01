import { useVideoPlayer } from '@/lib/video';
import { AnimatePresence, motion } from 'framer-motion';

import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';

const SCENE_DURATIONS = {
  intro: 6000,
  protocols: 8000,
  terminal: 10000,
  files: 9000,
  security: 8000,
  outro: 8000,
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({
    durations: SCENE_DURATIONS,
  });

  return (
    <div
      className="w-full h-screen overflow-hidden relative"
      style={{ backgroundColor: 'var(--color-bg-dark)' }}
    >
      {/* Persistent Background Layer */}
      <div className="absolute inset-0 w-full h-full">
        {/* Background Video */}
        <video
          src={`${import.meta.env.BASE_URL}videos/tech-bg.mp4`}
          autoPlay
          loop
          muted
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          style={{ objectPosition: 'center' }}
        />
        
        {/* Subtle noise overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />

        {/* Dynamic Background Gradient reacting to scenes */}
        <motion.div
          className="absolute inset-0 w-full h-full opacity-50 mix-blend-screen"
          animate={{
            background: 
              currentScene === 0 ? 'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.15) 0%, transparent 60%)' :
              currentScene === 1 ? 'radial-gradient(circle at 20% 80%, rgba(139,92,246,0.15) 0%, transparent 60%)' :
              currentScene === 2 ? 'radial-gradient(circle at 80% 20%, rgba(16,185,129,0.15) 0%, transparent 60%)' :
              currentScene === 3 ? 'radial-gradient(circle at 50% 80%, rgba(6,182,212,0.15) 0%, transparent 60%)' :
              currentScene === 4 ? 'radial-gradient(circle at 50% 20%, rgba(139,92,246,0.15) 0%, transparent 60%)' :
              'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.2) 0%, transparent 70%)'
          }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* Floating cross-scene continuity elements */}
        <motion.div
          className="absolute w-[30vw] h-[30vw] rounded-full border border-white/5 pointer-events-none"
          animate={{
            x: currentScene === 0 ? '50vw' : currentScene === 1 ? '10vw' : currentScene === 2 ? '80vw' : currentScene === 3 ? '20vw' : '50vw',
            y: currentScene === 0 ? '50vh' : currentScene === 1 ? '80vh' : currentScene === 2 ? '20vh' : currentScene === 3 ? '70vh' : '50vh',
            scale: currentScene % 2 === 0 ? 1 : 1.5,
            rotate: currentScene * 45
          }}
          style={{ translateX: '-50%', translateY: '-50%' }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[20vw] h-[20vw] rounded-full border border-[var(--color-primary)]/10 pointer-events-none"
          animate={{
            x: currentScene === 0 ? '30vw' : currentScene === 1 ? '80vw' : currentScene === 2 ? '20vw' : currentScene === 3 ? '80vw' : '30vw',
            y: currentScene === 0 ? '30vh' : currentScene === 1 ? '20vh' : currentScene === 2 ? '80vh' : currentScene === 3 ? '20vh' : '30vh',
            scale: currentScene % 2 === 0 ? 1.5 : 1,
            rotate: currentScene * -60
          }}
          style={{ translateX: '-50%', translateY: '-50%' }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />
      </div>

      {/* Foreground Scenes */}
      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene1 key="scene1" />}
        {currentScene === 1 && <Scene2 key="scene2" />}
        {currentScene === 2 && <Scene3 key="scene3" />}
        {currentScene === 3 && <Scene4 key="scene4" />}
        {currentScene === 4 && <Scene5 key="scene5" />}
        {currentScene === 5 && <Scene6 key="scene6" />}
      </AnimatePresence>
    </div>
  );
}
