import type { EcosystemData, Layer } from "@/types/ecosystem";
import ecosystemJson from "@/data/ecosystem.json";
import { withBasePath } from "@/lib/utils";

const bundled = ecosystemJson as EcosystemData;

let cached: EcosystemData | null = null;

export function getBundledData(): EcosystemData {
  return bundled;
}

export async function fetchEcosystemData(): Promise<EcosystemData> {
  if (cached) return cached;

  try {
    const res = await fetch(withBasePath("/data.json"), {
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as EcosystemData;
    cached = data;
    return data;
  } catch {
    cached = bundled;
    return bundled;
  }
}

export function getLayerById(id: string): Layer | undefined {
  return bundled.layers.find((l) => l.id === id);
}

export function getAllLayerIds(): string[] {
  return bundled.layers.map((l) => l.id);
}
