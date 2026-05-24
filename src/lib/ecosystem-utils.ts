import type { Company, Layer } from "@/types/ecosystem";
import { getBundledData } from "@/lib/data";

/** Return all companies across all layers, deduplicated by id */
export function getAllCompanies(): Company[] {
  const { layers } = getBundledData();
  const seen = new Set<string>();
  const result: Company[] = [];
  for (const layer of layers) {
    for (const company of layer.companies) {
      if (!seen.has(company.id)) {
        seen.add(company.id);
        // ensure layers array is populated
        const enriched: Company = {
          ...company,
          layers: company.layers?.length ? company.layers : [layer.id],
        };
        result.push(enriched);
      }
    }
  }
  return result;
}

/** Filter companies by a specific approach id */
export function filterByApproach(approach: string): Company[] {
  const companies = getAllCompanies();
  if (!approach || approach === "all") return companies;
  return companies.filter(
    (c) => c.approaches?.includes(approach) ?? false,
  );
}

/** Filter companies by a specific layer id */
export function filterByLayer(layerId: string): Company[] {
  const companies = getAllCompanies();
  if (!layerId || layerId === "all") return companies;
  return companies.filter((c) => c.layers?.includes(layerId));
}

/** Build graph relationships: nodes and edges for the node graph */
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

export function buildGraphData(
  layers: Layer[],
  filterApproach?: string,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seenCompanies = new Set<string>();

  // add layer nodes
  for (const layer of layers) {
    nodes.push({
      id: `layer-${layer.id}`,
      type: "layer",
      label: layer.name,
      layerIds: [layer.id],
    });
  }

  // add company nodes + edges
  for (const layer of layers) {
    for (const company of layer.companies) {
      // approach filter
      if (
        filterApproach &&
        filterApproach !== "all" &&
        company.approaches &&
        !company.approaches.includes(filterApproach)
      ) {
        continue;
      }

      if (!seenCompanies.has(company.id)) {
        seenCompanies.add(company.id);
        const companyLayers = company.layers?.length
          ? company.layers
          : [layer.id];
        nodes.push({
          id: company.id,
          type: "company",
          label: company.name,
          layerIds: companyLayers,
          category: company.category,
          valuation: company.valuation,
          website: company.website,
          logo: company.logo,
        });
      }

      // edge: company -> layer
      edges.push({
        source: company.id,
        target: `layer-${layer.id}`,
      });
    }
  }

  return { nodes, edges };
}
