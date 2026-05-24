"use client";

import { useEffect, useRef, useState } from "react";
import { ParticleField } from "./ParticleField";

export function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const progress = Math.min(scrollY / (typeof window !== "undefined" ? window.innerHeight * 0.6 : 800), 1);
  const opacity = 1 - progress * 1.5;
  const translateY = progress * -60;
  const scale = 1 - progress * 0.08;

  const scrollDown = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black"
    >
      <ParticleField />

      {/* Radial ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 animate-pulse-soft"
        style={{
          background: "radial-gradient(ellipse 50% 40% at 50% 55%, rgba(255,255,255,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Hero content with parallax */}
      <div
        className="relative z-10 text-center gpu"
        style={{
          opacity: Math.max(0, opacity),
          transform: `translateY(${translateY}px) scale(${scale})`,
          transition: "none",
        }}
      >
        <p
          className="mb-6 text-[10px] font-medium uppercase tracking-[0.5em] text-white/20 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          Interactive Knowledge Map
        </p>
        <h1
          className="text-[clamp(2.8rem,8vw,7.5rem)] font-extralight leading-[0.95] tracking-tight text-white animate-fade-in-up"
          style={{ animationDelay: "0.5s" }}
        >
          AI Ecosystem
        </h1>
        <p
          className="mt-2 text-[clamp(2rem,5vw,5rem)] font-thin text-white/30 animate-fade-in-up"
          style={{ animationDelay: "0.7s" }}
        >
          Mapping
        </p>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={scrollDown}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-float cursor-pointer border-none bg-transparent"
        aria-label="Scroll to graph"
      >
        <svg className="h-5 w-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </section>
  );
}
