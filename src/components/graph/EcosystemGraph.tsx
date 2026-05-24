"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { GraphNode, GraphEdge } from "@/lib/ecosystem-utils";


interface EcosystemGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedApproach?: string;
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimEdge {
  source: SimNode;
  target: SimNode;
}

const LAYER_COLORS: Record<string, string> = {
  infrastructure: "#38bdf8",
  model: "#a78bfa",
  application: "#34d399",
  integration: "#fbbf24",
  security: "#f87171",
  monetization: "#e879f9",
};

const LAYER_GLOW: Record<string, string> = {
  infrastructure: "rgba(56,189,248,0.5)",
  model: "rgba(167,139,250,0.5)",
  application: "rgba(52,211,153,0.5)",
  integration: "rgba(251,191,36,0.5)",
  security: "rgba(248,113,113,0.5)",
  monetization: "rgba(232,121,249,0.5)",
};

function getNodeColor(node: GraphNode): string {
  const lid = node.layerIds?.[0] ?? "infrastructure";
  return LAYER_COLORS[lid] ?? "#a78bfa";
}

function getNodeGlow(node: GraphNode): string {
  const lid = node.layerIds?.[0] ?? "infrastructure";
  return LAYER_GLOW[lid] ?? "rgba(167,139,250,0.5)";
}

export function EcosystemGraph({ nodes, edges, selectedApproach }: EcosystemGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const simEdgesRef = useRef<SimEdge[]>([]);
  const animRef = useRef<number>(0);
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragNodeRef = useRef<SimNode | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const isPanningRef = useRef(false);
  const scaleRef = useRef(1);

  const getCanvasCoords = useCallback((e: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left - panRef.current.x) / scaleRef.current;
    const cy = (e.clientY - rect.top - panRef.current.y) / scaleRef.current;
    return { cx, cy };
  }, []);

  const findNodeAt = useCallback((cx: number, cy: number): SimNode | null => {
    for (const node of [...simNodesRef.current].reverse()) {
      const r = node.type === "layer" ? 32 : 18;
      const dx = node.x - cx;
      const dy = node.y - cy;
      if (dx * dx + dy * dy < r * r) return node;
    }
    return null;
  }, []);

  // Build simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width;
    const H = canvas.height;

    // Position layer nodes in a ring
    const layerNodes = nodes.filter((n) => n.type === "layer");
    const companyNodes = nodes.filter((n) => n.type === "company");

    const simNodes: SimNode[] = [];
    const nodeMap = new Map<string, SimNode>();

    layerNodes.forEach((n, i) => {
      const angle = (i / layerNodes.length) * Math.PI * 2 - Math.PI / 2;
      const radius = Math.min(W, H) * 0.28;
      const sn: SimNode = {
        ...n,
        x: W / 2 + Math.cos(angle) * radius,
        y: H / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
      simNodes.push(sn);
      nodeMap.set(n.id, sn);
    });

    companyNodes.forEach((n, i) => {
      const angle = Math.random() * Math.PI * 2;
      const r = 80 + Math.random() * (Math.min(W, H) * 0.35);
      const sn: SimNode = {
        ...n,
        x: W / 2 + Math.cos(angle) * r,
        y: H / 2 + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
      };
      simNodes.push(sn);
      nodeMap.set(n.id, sn);
    });

    const simEdges: SimEdge[] = edges
      .map((e) => ({
        source: nodeMap.get(e.source)!,
        target: nodeMap.get(e.target)!,
      }))
      .filter((e) => e.source && e.target);

    simNodesRef.current = simNodes;
    simEdgesRef.current = simEdges;
  }, [nodes, edges]);

  // Physics + draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;

    function step() {
      const sNodes = simNodesRef.current;
      const sEdges = simEdgesRef.current;
      const W = canvas!.width;
      const H = canvas!.height;
      const cx = W / 2;
      const cy = H / 2;

      // Forces
      for (const node of sNodes) {
        if (node.fx != null) { node.x = node.fx; node.vx = 0; }
        if (node.fy != null) { node.y = node.fy; node.vx = 0; }
        if (node.type === "layer") continue; // layer nodes held in ring, just dampen

        // Center gravity
        node.vx += (cx - node.x) * 0.003;
        node.vy += (cy - node.y) * 0.003;

        // Repulsion from other company nodes
        for (const other of sNodes) {
          if (other === node) continue;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distSq = dx * dx + dy * dy + 1;
          const dist = Math.sqrt(distSq);
          const rep = other.type === "layer" ? 4000 : 800;
          node.vx += (dx / dist) * (rep / distSq);
          node.vy += (dy / dist) * (rep / distSq);
        }
      }

      // Spring edges
      for (const edge of sEdges) {
        const { source, target } = edge;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const ideal = target.type === "layer" ? 140 : 100;
        const k = 0.04;
        const force = (dist - ideal) * k;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (source.type !== "layer" && source.fx == null) { source.vx += fx; source.vy += fy; }
        if (target.type !== "layer" && target.fx == null) { target.vx -= fx; target.vy -= fy; }
      }

      // Integrate + dampen
      for (const node of sNodes) {
        if (node.type === "layer") continue;
        if (node.fx != null) continue;
        node.vx *= 0.88;
        node.vy *= 0.88;
        node.x += node.vx;
        node.y += node.vy;
      }

      // Draw
      ctx!.clearRect(0, 0, W, H);
      ctx!.save();
      ctx!.translate(panRef.current.x, panRef.current.y);
      ctx!.scale(scaleRef.current, scaleRef.current);

      // Edges
      for (const edge of sEdges) {
        const { source, target } = edge;
        const isHighlighted = hoveredNode
          ? hoveredNode === source || hoveredNode === target
          : false;

        const grad = ctx!.createLinearGradient(source.x, source.y, target.x, target.y);
        const color = getNodeColor(target.type === "layer" ? target : source);
        grad.addColorStop(0, color + (isHighlighted ? "cc" : "44"));
        grad.addColorStop(1, color + (isHighlighted ? "88" : "22"));

        ctx!.beginPath();
        ctx!.moveTo(source.x, source.y);
        ctx!.lineTo(target.x, target.y);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = isHighlighted ? 1.5 : 0.8;

        if (!isHighlighted) {
          ctx!.setLineDash([3, 6]);
        } else {
          ctx!.setLineDash([]);
        }
        ctx!.stroke();
        ctx!.setLineDash([]);
      }

      // Nodes
      for (const node of sNodes) {
        const isHovered = hoveredNode === node;
        const isSelected = selectedNode === node;
        const r = node.type === "layer" ? 30 : (isHovered ? 20 : 16);
        const color = getNodeColor(node);
        const glow = getNodeGlow(node);

        // Glow
        if (isHovered || isSelected || node.type === "layer") {
          ctx!.save();
          ctx!.shadowColor = glow;
          ctx!.shadowBlur = node.type === "layer" ? 24 : 16;
          ctx!.beginPath();
          ctx!.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx!.fillStyle = color + (node.type === "layer" ? "33" : "22");
          ctx!.fill();
          ctx!.restore();
        }

        // Node circle
        ctx!.save();
        ctx!.shadowColor = glow;
        ctx!.shadowBlur = isHovered ? 20 : 8;
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, r, 0, Math.PI * 2);

        // Glassmorphism fill
        const grad2 = ctx!.createRadialGradient(node.x - r * 0.3, node.y - r * 0.3, r * 0.1, node.x, node.y, r);
        grad2.addColorStop(0, color + "ee");
        grad2.addColorStop(1, color + "88");
        ctx!.fillStyle = grad2;
        ctx!.fill();

        // Ring
        ctx!.strokeStyle = color;
        ctx!.lineWidth = isSelected ? 2.5 : (isHovered ? 2 : 1.5);
        ctx!.stroke();
        ctx!.restore();

        // Label
        ctx!.save();
        ctx!.fillStyle = node.type === "layer" ? "#ffffff" : "#e2e8f0";
        ctx!.font = node.type === "layer"
          ? `bold ${Math.max(9, r * 0.38)}px system-ui`
          : `${Math.max(8, r * 0.52)}px system-ui`;
        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";

        if (node.type === "layer") {
          // Multi-line for layer names
          const words = node.label.split(" ");
          if (words.length > 1) {
            ctx!.fillText(words[0], node.x, node.y - 6);
            ctx!.fillText(words.slice(1).join(" "), node.x, node.y + 7);
          } else {
            ctx!.fillText(node.label, node.x, node.y);
          }
        } else if (isHovered || isSelected) {
          const maxLen = 12;
          const label = node.label.length > maxLen ? node.label.slice(0, maxLen) + "…" : node.label;
          ctx!.fillText(label, node.x, node.y + r + 12);
        }
        ctx!.restore();
      }

      ctx!.restore();
      frame++;
      animRef.current = requestAnimationFrame(step);
    }

    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [nodes, edges, hoveredNode, selectedNode]);

  // Interaction handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (dragNodeRef.current) {
      const { cx, cy } = getCanvasCoords(e.nativeEvent, canvas);
      dragNodeRef.current.fx = cx + offsetRef.current.x;
      dragNodeRef.current.fy = cy + offsetRef.current.y;
      dragNodeRef.current.x = dragNodeRef.current.fx;
      dragNodeRef.current.y = dragNodeRef.current.fy;
      return;
    }

    if (isPanningRef.current) {
      const rect = canvas.getBoundingClientRect();
      const dx = e.clientX - rect.left - panStartRef.current.x;
      const dy = e.clientY - rect.top - panStartRef.current.y;
      panRef.current = { x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy };
      return;
    }

    const { cx, cy } = getCanvasCoords(e.nativeEvent, canvas);
    const found = findNodeAt(cx, cy);
    setHoveredNode(found);
    canvas.style.cursor = found ? "pointer" : "grab";
  }, [getCanvasCoords, findNodeAt]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { cx, cy } = getCanvasCoords(e.nativeEvent, canvas);
    const found = findNodeAt(cx, cy);

    if (found) {
      dragNodeRef.current = found;
      offsetRef.current = { x: found.x - cx, y: found.y - cy };
      setIsDragging(true);
    } else {
      isPanningRef.current = true;
      const rect = canvas.getBoundingClientRect();
      panStartRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        panX: panRef.current.x,
        panY: panRef.current.y,
      };
    }
  }, [getCanvasCoords, findNodeAt]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (dragNodeRef.current && !isDragging) {
      setSelectedNode((prev) => prev === dragNodeRef.current ? null : dragNodeRef.current);
    }

    if (dragNodeRef.current) {
      dragNodeRef.current.fx = null;
      dragNodeRef.current.fy = null;
    }

    dragNodeRef.current = null;
    isPanningRef.current = false;
    setIsDragging(false);
  }, [isDragging]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || isDragging) return;
    const { cx, cy } = getCanvasCoords(e.nativeEvent, canvas);
    const found = findNodeAt(cx, cy);
    setSelectedNode((prev) => prev?.id === found?.id ? null : found);
  }, [getCanvasCoords, findNodeAt, isDragging]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scaleRef.current = Math.min(3, Math.max(0.3, scaleRef.current * delta));
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-200/60 bg-zinc-950 dark:border-zinc-800/60" style={{ height: 520 }}>
      {/* Background grid */}
      <div className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(139,92,246,0.4) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <canvas
        ref={canvasRef}
        width={1100}
        height={520}
        className="h-full w-full"
        style={{ touchAction: "none" }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Tooltip / detail panel */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 max-w-xs rounded-2xl border border-zinc-700/80 bg-zinc-900/90 p-4 backdrop-blur-lg">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-400">
                {selectedNode.type === "layer" ? "Layer" : selectedNode.category}
              </p>
              <h4 className="mt-0.5 text-sm font-bold text-white">{selectedNode.label}</h4>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {selectedNode.valuation && selectedNode.valuation !== "N/A" && (
            <p className="mt-2 text-xs text-zinc-400">Valuation: <span className="text-white">{selectedNode.valuation}</span></p>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedNode.layerIds?.map((lid) => {
              const color = LAYER_COLORS[lid] ?? "#a78bfa";
              return (
                <span key={lid} className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: color + "22", color }}>
                  {lid}
                </span>
              );
            })}
          </div>
          {selectedNode.website && (
            <a
              href={selectedNode.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-xs font-semibold text-violet-400 hover:text-violet-300"
            >
              Visit site →
            </a>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="pointer-events-none absolute right-3 top-3 flex flex-col gap-1 rounded-xl bg-zinc-900/80 p-2 backdrop-blur-sm">
        {Object.entries(LAYER_COLORS).map(([lid, color]) => (
          <div key={lid} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="text-[9px] capitalize text-zinc-400">{lid}</span>
          </div>
        ))}
      </div>

      {/* Controls hint */}
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-zinc-900/70 px-2 py-1 text-[9px] text-zinc-500 backdrop-blur-sm">
        Scroll to zoom · Drag to pan · Click node for details
      </div>
    </div>
  );
}
