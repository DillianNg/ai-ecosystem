import { getBundledData } from "@/lib/data";
import { LayerCard } from "@/components/home/LayerCard";

export function LayerGrid() {
  const { layers } = getBundledData();

  return (
    <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {layers.map((layer) => (
        <LayerCard key={layer.id} layer={layer} />
      ))}
    </section>
  );
}
