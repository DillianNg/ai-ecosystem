export type ArchitectureApproachId =
  | "value-chain"
  | "infrastructure-data"
  | "human-in-loop";

export type VisualizationType = "funnel" | "stacked" | "human-loop";

export interface ArchitectureApproach {
  id: ArchitectureApproachId;
  label: string;
  description: string;
  visualizationType: VisualizationType;
  layerOrder: string[];
  /** Second column layer order for infrastructure-data comparison */
  alternateLayerOrder?: string[];
  alternateLabel?: string;
  primaryLabel?: string;
}

export interface HumanLoopStep {
  id: string;
  title: string;
  summary: string;
  actor: "human" | "machine" | "collaboration";
}

export interface ArchitectureApproachesData {
  approaches: ArchitectureApproach[];
  humanLoopSteps: HumanLoopStep[];
}
