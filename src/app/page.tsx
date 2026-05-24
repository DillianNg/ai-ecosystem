import { getBundledData } from "@/lib/data";
import { HeroSection } from "@/components/home/HeroSection";
import { EcosystemGraphSection } from "@/components/graph/EcosystemGraphSection";

export default function HomePage() {
  const { layers } = getBundledData();

  return (
    <div className="bg-black">
      <HeroSection />
      <section className="relative min-h-screen w-full overflow-hidden bg-black px-4 py-16 sm:px-8">
        <EcosystemGraphSection layers={layers} />
      </section>
    </div>
  );
}
