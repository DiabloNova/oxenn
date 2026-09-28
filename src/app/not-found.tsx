"use client";

import React from 'react';
import Link from 'next/link';
import { AmbientSpheres } from "@/components/backgrounds/AmbientSpheres";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[var(--background)] text-[var(--text-primary)] relative overflow-hidden">
      <AmbientSpheres />
      <div className="text-center z-10 max-w-md mx-auto space-y-6">
        <h1 className="text-9xl font-black text-gradient-brand font-display">404</h1>
        <h2 className="text-2xl font-bold">Page Not Found</h2>
        <p className="text-[var(--text-secondary)] text-sm">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] text-white text-sm font-bold shadow-lg hover:scale-[1.02] transition-transform"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
