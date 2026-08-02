import { useEffect, useRef } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { AnimatePresence, motion } from 'framer-motion';

import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';

export const SCENE_DURATIONS = {
  intro: 6000,
  protocols: 8000,
  terminal: 10000,
  files: 9000,
  security: 8000,
  outro: 8000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  intro: Scene1,
  protocols: Scene2,
  terminal: Scene3,
  files: Scene4,
  security: Scene5,
  outro: Scene6,
};

const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let cumulativeMs = 0;
  for (const [key, ms] of Object.entries(SCENE_DURATIONS)) {
    out[key] = cumulativeMs / 1000;
    cumulativeMs += ms;
  }
  return out;
})();

const AUDIO_SEEK_EPSILON_SEC = 0.18;

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentScene, currentSceneKey } = useVideoPlayer({ durations, loop });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
    if (Math.abs(audio.currentTime - targetTime) > AUDIO_SEEK_EPSILON_SEC) {
      audio.currentTime = targetTime;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted]);

  return (
    <>
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
                sceneIndex === 0 ? 'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.15) 0%, transparent 60%)' :
                sceneIndex === 1 ? 'radial-gradient(circle at 20% 80%, rgba(139,92,246,0.15) 0%, transparent 60%)' :
                sceneIndex === 2 ? 'radial-gradient(circle at 80% 20%, rgba(16,185,129,0.15) 0%, transparent 60%)' :
                sceneIndex === 3 ? 'radial-gradient(circle at 50% 80%, rgba(6,182,212,0.15) 0%, transparent 60%)' :
                sceneIndex === 4 ? 'radial-gradient(circle at 50% 20%, rgba(139,92,246,0.15) 0%, transparent 60%)' :
                'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.2) 0%, transparent 70%)'
            }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />

          {/* Floating cross-scene continuity elements */}
          <motion.div
            className="absolute w-[30vw] h-[30vw] rounded-full border border-white/5 pointer-events-none"
            animate={{
              x: sceneIndex === 0 ? '50vw' : sceneIndex === 1 ? '10vw' : sceneIndex === 2 ? '80vw' : sceneIndex === 3 ? '20vw' : '50vw',
              y: sceneIndex === 0 ? '50vh' : sceneIndex === 1 ? '80vh' : sceneIndex === 2 ? '20vh' : sceneIndex === 3 ? '70vh' : '50vh',
              scale: sceneIndex % 2 === 0 ? 1 : 1.5,
              rotate: sceneIndex * 45
            }}
            style={{ translateX: '-50%', translateY: '-50%' }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-[20vw] h-[20vw] rounded-full border border-[var(--color-primary)]/10 pointer-events-none"
            animate={{
              x: sceneIndex === 0 ? '30vw' : sceneIndex === 1 ? '80vw' : sceneIndex === 2 ? '20vw' : sceneIndex === 3 ? '80vw' : '30vw',
              y: sceneIndex === 0 ? '30vh' : sceneIndex === 1 ? '20vh' : sceneIndex === 2 ? '80vh' : sceneIndex === 3 ? '20vh' : '30vh',
              scale: sceneIndex % 2 === 0 ? 1.5 : 1,
              rotate: sceneIndex * -60
            }}
            style={{ translateX: '-50%', translateY: '-50%' }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />
        </div>

        {/* Foreground Scenes */}
        <AnimatePresence mode="popLayout">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
      </div>

      {/* Audio */}
      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`}
        preload="auto"
        autoPlay
        muted={muted}
      />
    </>
  );
}
