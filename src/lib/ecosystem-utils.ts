import type { Company, Layer } from "@/types/ecosystem";
import { getBundledData } from "@/lib/data";

/** All companies across all layers, deduplicated by id */
export function getAllCompanies(): Company[] {
  const { layers } = getBundledData();
  const seen = new Set<string>();
  const result: Company[] = [];
  for (const layer of layers) {
    for (const company of layer.companies) {
      if (!seen.has(company.id)) {
        seen.add(company.id);
        result.push({
          ...company,
          layers: company.layers?.length ? company.layers : [layer.id],
        });
      }
    }
  }
  return result;
}

export function filterByApproach(approach: string): Company[] {
  const all = getAllCompanies();
  if (!approach || approach === "all") return all;
  return all.filter(c => c.approaches?.includes(approach));
}

export function filterByLayer(layerId: string): Company[] {
  const all = getAllCompanies();
  if (!layerId || layerId === "all") return all;
  return all.filter(c => c.layers?.includes(layerId));
}

/* ── Graph data types ── */
export interface GraphNode {
  id: string;
  type: "company" | "layer";
  label: string;
  layerIds: string[];
  category?: string;
  valuation?: string;
  website?: string;
  logo?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

/** Build graph nodes + edges from layers, optionally filtered by approach */
export function buildGraphData(
  layers: Layer[],
  filterApproach?: string,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seenCompanies = new Set<string>();

  // Layer hub nodes
  for (const layer of layers) {
    nodes.push({
      id: `layer-${layer.id}`,
      type: "layer",
      label: layer.name,
      layerIds: [layer.id],
    });
  }

  // Company nodes + edges
  for (const layer of layers) {
    for (const company of layer.companies) {
      if (
        filterApproach && filterApproach !== "all" &&
        company.approaches && !company.approaches.includes(filterApproach)
      ) continue;

      if (!seenCompanies.has(company.id)) {
        seenCompanies.add(company.id);
        const valStr = company.valuation;
        nodes.push({
          id: company.id,
          type: "company",
          label: company.name,
          layerIds: company.layers?.length ? company.layers : [layer.id],
          category: company.category,
          valuation: valStr,
          website: company.website,
          logo: company.logo,
        });
      }
      edges.push({ source: company.id, target: `layer-${layer.id}` });
    }
  }

  return { nodes, edges };
}
