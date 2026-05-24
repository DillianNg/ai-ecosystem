"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import type { Layer } from "@/types/ecosystem";
import type { ArchitectureApproach, HumanLoopStep } from "@/types/dashboard";
import { LAYER_ACCENTS } from "@/lib/constants";

export interface LayerVisualizationProps {
  approach: ArchitectureApproach;
  layers: Layer[];
  humanLoopSteps: HumanLoopStep[];
}

const motionConfig = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

function orderLayers(layers: Layer[], order: string[]): Layer[] {
  const map = new Map(layers.map((l) => [l.id, l]));
  return order.map((id) => map.get(id)).filter((l): l is Layer => Boolean(l));
}

function LayerBlock({ layer, className = "", style }: { layer: Layer; className?: string; style?: CSSProperties }) {
  const accent = LAYER_ACCENTS[layer.id] ?? LAYER_ACCENTS.infrastructure;
  return (
    <motion.div
      layout
      layoutId={`layer-${layer.id}`}
      style={style}
      className={`group relative overflow-hidden rounded-xl border border-white/8 bg-white/3 p-4 transition hover:bg-white/6 ${className}`}
    >
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent.from} ${accent.to} opacity-40`} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-white/80">{layer.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-white/30">{layer.description}</p>
        </div>
        <Link
          href={`/layers/${layer.id}/`}
          className="shrink-0 text-xs text-white/25 transition hover:text-white/60"
        >
          Explore →
        </Link>
      </div>
    </motion.div>
  );
}

function FunnelVisualization({ layers }: { layers: Layer[] }) {
  const count = layers.length;
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 py-2">
      {layers.map((layer, index) => {
        const widthPercent = 100 - index * (55 / Math.max(count - 1, 1));
        return (
          <motion.div
            key={layer.id} layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.06, duration: 0.35 }}
            className="w-full" style={{ maxWidth: `${widthPercent}%` }}
          >
            <LayerBlock layer={layer} />
          </motion.div>
        );
      })}
    </div>
  );
}

function StackedColumn({ title, layers, delayOffset = 0 }: { title: string; layers: Layer[]; delayOffset?: number }) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <p className="mb-2 text-center text-[10px] uppercase tracking-[0.3em] text-white/25">{title}</p>
      <div className="flex flex-1 flex-col-reverse gap-2">
        {layers.map((layer, index) => (
          <motion.div key={layer.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delayOffset + index * 0.05, duration: 0.35 }}>
            <LayerBlock layer={layer} className="min-h-[4.5rem]" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StackedVisualization({ approach, layers }: { approach: ArchitectureApproach; layers: Layer[] }) {
  const primary = orderLayers(layers, approach.layerOrder);
  const alternate = orderLayers(layers, approach.alternateLayerOrder ?? approach.layerOrder);
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <StackedColumn title={approach.primaryLabel ?? "Infrastructure First"} layers={primary} />
      <StackedColumn title={approach.alternateLabel ?? "Data First"} layers={alternate} delayOffset={0.08} />
    </div>
  );
}

function ActorIcon({ actor }: { actor: HumanLoopStep["actor"] }) {
  const colors: Record<string, string> = { human: "text-amber-400", machine: "text-sky-400", collaboration: "text-violet-400" };
  const bg: Record<string, string> = { human: "bg-amber-500/10 ring-amber-500/20", machine: "bg-sky-500/10 ring-sky-500/20", collaboration: "bg-violet-500/10 ring-violet-500/20" };
  return (
    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg[actor]} ring-1 ${colors[actor]}`}>
      {actor === "human" && <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
      {actor === "machine" && <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
      {actor === "collaboration" && <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
    </span>
  );
}

function HumanLoopVisualization({ steps, contextLayers }: { steps: HumanLoopStep[]; contextLayers: Layer[] }) {
  const actorLabel: Record<HumanLoopStep["actor"], string> = { human: "Human", machine: "AI / System", collaboration: "Collaboration" };
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-stretch lg:justify-center">
        {steps.map((step, index) => (
          <motion.div key={step.id} layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.07, duration: 0.35 }} className="relative flex flex-1 min-w-[200px] max-w-sm flex-col">
            <article className="flex h-full flex-col rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="flex items-start gap-3">
                <ActorIcon actor={step.actor} />
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/25">{actorLabel[step.actor]}</p>
                  <h3 className="mt-0.5 text-sm font-medium text-white">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/35">{step.summary}</p>
                </div>
              </div>
            </article>
          </motion.div>
        ))}
      </div>
      {contextLayers.length > 0 && (
        <div>
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-white/25">Supporting stack layers</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {contextLayers.map((layer) => (<LayerBlock key={layer.id} layer={layer} />))}
          </div>
        </div>
      )}
    </div>
  );
}

export function LayerVisualization({ approach, layers, humanLoopSteps }: LayerVisualizationProps) {
  const ordered = orderLayers(layers, approach.layerOrder);
  return (
    <LayoutGroup>
      <AnimatePresence mode="wait">
        <motion.div key={approach.id} {...motionConfig} className="rounded-xl border border-white/5 bg-white/2 p-4 sm:p-6">
          {approach.visualizationType === "funnel" && <FunnelVisualization layers={ordered} />}
          {approach.visualizationType === "stacked" && <StackedVisualization approach={approach} layers={layers} />}
          {approach.visualizationType === "human-loop" && <HumanLoopVisualization steps={humanLoopSteps} contextLayers={ordered} />}
        </motion.div>
      </AnimatePresence>
    </LayoutGroup>
  );
}
