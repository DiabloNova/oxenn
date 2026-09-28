"use client";

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const AmbientSpheres = ({
  className = '',
}: {
  className?: string;
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none -z-10 ${className}`}>
      <motion.div
        className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-30 bg-[#38bdf8]"
        animate={prefersReducedMotion ? {} : {
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-20 bg-[#818cf8]"
        animate={prefersReducedMotion ? {} : {
          x: [0, -40, 0],
          y: [0, -50, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-[40%] left-[20%] w-[30vw] h-[30vw] rounded-full blur-[90px] opacity-15 bg-[#c084fc]"
        animate={prefersReducedMotion ? {} : {
          x: [0, 60, 0],
          y: [0, -40, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};
