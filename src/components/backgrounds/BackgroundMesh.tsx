import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const BackgroundMesh = ({
  colors = ['#38bdf8', '#818cf8', '#c084fc'],
  opacity = 0.15,
  className = '',
}: {
  colors?: string[];
  opacity?: number;
  className?: string;
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none -z-10 ${className}`}>
      <div
        className="absolute w-[120%] h-[120%] -top-[10%] -left-[10%] opacity-40 mix-blend-screen"
        style={{ opacity }}
      >
        {colors.map((color, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-[100px]"
            style={{
              backgroundColor: color,
              width: `${Math.random() * 40 + 30}%`,
              height: `${Math.random() * 40 + 30}%`,
              left: `${Math.random() * 60 + 20}%`,
              top: `${Math.random() * 60 + 20}%`,
            }}
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    x: [0, Math.random() * 100 - 50, 0],
                    y: [0, Math.random() * 100 - 50, 0],
                  }
            }
            transition={{
              duration: Math.random() * 10 + 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>
    </div>
  );
};
