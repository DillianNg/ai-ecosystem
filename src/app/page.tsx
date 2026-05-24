import { getBundledData } from "@/lib/data";
import { ParticleField } from "@/components/home/ParticleField";
import { EcosystemGraphSection } from "@/components/graph/EcosystemGraphSection";

export default function HomePage() {
  const { layers } = getBundledData();

  return (
    <div className="bg-black">
      {/* SECTION 1 — HERO */}
      <section className="snap-section relative flex h-screen w-full items-center justify-center overflow-hidden bg-black">
        <ParticleField />

        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(120,80,255,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Hero text */}
        <div className="relative z-10 text-center">
          <p
            className="mb-6 text-xs font-medium uppercase tracking-[0.4em] text-white/30 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Interactive Knowledge Map
          </p>
          <h1
            className="text-[clamp(2.5rem,8vw,7rem)] font-thin leading-none tracking-tight text-white animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            AI Ecosystem
            <br />
            <span className="font-light text-white/60">Mapping</span>
          </h1>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float">
          <svg
            className="h-6 w-6 text-white/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </section>

      {/* SECTION 2 — FULLSCREEN GRAPH */}
      <section className="snap-section relative min-h-screen w-full overflow-hidden bg-black px-4 py-20 sm:px-8">
        <EcosystemGraphSection layers={layers} />
      </section>
    </div>
  );
}
