import React, { Suspense, lazy } from 'react';

const Dithering = lazy(() => 
  import('@paper-design/shaders-react').then((mod) => ({ default: mod.Dithering }))
);

export default function DitheringBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen transition-opacity duration-1000">
      <Suspense fallback={<div className="absolute inset-0 bg-transparent" />}>
        {/* @ts-ignore - The component might not have fully typed props exported */}
        <Dithering
          colorBack="#00000000" // Transparent
          colorFront="#3B82F6"  // Blue accent
          shape="warp"
          type="4x4"
          speed={0.3}
          className="w-full h-full"
          minPixelRatio={1}
        />
      </Suspense>
    </div>
  );
}
