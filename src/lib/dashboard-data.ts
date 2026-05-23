import approachesJson from "@/data/architecture-approaches.json";
import type { ArchitectureApproach, ArchitectureApproachesData } from "@/types/dashboard";

const data = approachesJson as ArchitectureApproachesData;

export function getArchitectureApproaches(): ArchitectureApproach[] {
  return data.approaches;
}

export function getHumanLoopSteps() {
  return data.humanLoopSteps;
}

export function getDefaultApproach(): ArchitectureApproach {
  return data.approaches[0];
}
