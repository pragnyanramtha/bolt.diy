import React from 'react';
import { classNames } from '~/utils/classNames';

export function CTASection() {
  return (
    <section className="py-2 w-full flex justify-center items-center px-4 md:px-0 select-none">
      <div className="w-full max-w-4xl relative mt-[10vh]">
        <div className="relative z-10 px-6 max-w-3xl mx-auto text-center flex flex-col items-center py-12">
          {/* Headline */}
          <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-5 animate-fade-in bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-white/90 dark:to-white/40 bg-clip-text text-transparent drop-shadow-sm leading-[1.05]">
            Build stunning websites, <br />
            <span className="text-gray-500 dark:text-white/60">effortlessly.</span>
          </h2>

          {/* Description */}
          <p className="text-gray-500 dark:text-white/60 text-lg md:text-xl max-w-2xl mb-2 leading-relaxed font-light animate-fade-in animation-delay-200">
            Experience the next generation of web development. <br className="hidden md:block" />
            Create, iterate, and deploy with a few lines of prompt.
          </p>
        </div>
      </div>
    </section>
  );
}
