import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export default function AnimatedBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ w: 1000, h: 1000 });

  useEffect(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX,
        y: e.clientY,
      });
    };
    
    const handleResize = () => {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#FFFAFA]">
      {/* Base gradient layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFFbeb] via-[#FFFCF0] to-[#FEFce8] opacity-80" />
      
      {/* Animated blobs */}
      <motion.div
        className="absolute w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] bg-[#FEF08A] rounded-full mix-blend-multiply filter blur-[100px] opacity-40"
        animate={{
          x: mousePos.x - (windowSize.w * 0.15),
          y: mousePos.y - (windowSize.h * 0.15),
        }}
        transition={{ type: 'spring', damping: 40, stiffness: 50, mass: 0.5 }}
      />
      <motion.div
        className="absolute w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-[#FDE047] rounded-full mix-blend-multiply filter blur-[120px] opacity-30"
        animate={{
          x: [0, windowSize.w - 600, 0],
          y: [0, windowSize.h - 600, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div
        className="absolute w-[70vw] h-[70vw] max-w-[700px] max-h-[700px] bg-[#FEF9C3] rounded-full mix-blend-overlay filter blur-[100px] opacity-60 right-0 bottom-0"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -200, 0],
          y: [0, -100, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}
