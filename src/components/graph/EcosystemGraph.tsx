"use client";

<<<<<<< HEAD
import { useEffect, useRef, useState, useCallback } from "react";
import type { GraphNode, GraphEdge } from "@/lib/ecosystem-utils";

interface EcosystemGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/* ── Simulation node ── */
interface SNode extends GraphNode {
  x: number; y: number; vx: number; vy: number;
  fx: number | null; fy: number | null;
  radius: number;
  targetOpacity: number; currentOpacity: number;
  labelOpacity: number;
}
interface SEdge { source: SNode; target: SNode; }

/* ── Palette (grayscale + subtle hue) ── */
const HUE: Record<string, number> = {
  infrastructure: 210, model: 265, application: 155,
  integration: 38, security: 350, monetization: 295,
};
function hue(n: GraphNode) { return HUE[n.layerIds?.[0] ?? "model"] ?? 265; }

/* ── Quadtree for fast hover ── */
function findNearest(nodes: SNode[], x: number, y: number, maxDist: number): SNode | null {
  let best: SNode | null = null;
  let bestD = maxDist * maxDist;
  for (const n of nodes) {
    const d = (n.x - x) ** 2 + (n.y - y) ** 2;
    const r = n.radius + 4; // tolerance
    if (d < r * r && d < bestD) { bestD = d; best = n; }
  }
  return best;
}

/* ── Edge hit test ── */
function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function findNearestEdge(edges: SEdge[], x: number, y: number, tol: number): SEdge | null {
  let best: SEdge | null = null;
  let bestD = tol;
  for (const e of edges) {
    const d = distToSegment(x, y, e.source.x, e.source.y, e.target.x, e.target.y);
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}

export function EcosystemGraph({ nodes, edges }: EcosystemGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<{ nodes: SNode[]; edges: SEdge[]; map: Map<string, SNode> }>({
    nodes: [], edges: [], map: new Map(),
  });
  const rafRef = useRef(0);
  const stRef = useRef({
    hover: null as SNode | null,
    hoverEdge: null as SEdge | null,
    selected: null as SNode | null,
    drag: null as SNode | null,
    dragOffset: { x: 0, y: 0 },
    hasDragged: false,
    isPanning: false,
    panStart: { mx: 0, my: 0, px: 0, py: 0 },
    pan: { x: 0, y: 0 },
    scale: 1,
    alpha: 1, // simulation energy
    time: 0,
  });

  const [selectedNode, setSelectedNode] = useState<SNode | null>(null);

  /* ── Build simulation ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth || 1100;
    const H = canvas.offsetHeight || 600;
    const cx = W / 2, cy = H / 2;

    const layerNodes = nodes.filter(n => n.type === "layer");
    const compNodes = nodes.filter(n => n.type === "company");
    const map = new Map<string, SNode>();
    const sNodes: SNode[] = [];

    // Layer hubs in ring
    layerNodes.forEach((n, i) => {
      const angle = (i / layerNodes.length) * Math.PI * 2 - Math.PI / 2;
      const r = Math.min(W, H) * 0.25;
      const sn: SNode = {
        ...n, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r,
        vx: 0, vy: 0, fx: cx + Math.cos(angle) * r, fy: cy + Math.sin(angle) * r,
        radius: 26, targetOpacity: 1, currentOpacity: 1, labelOpacity: 1,
      };
      sNodes.push(sn); map.set(n.id, sn);
    });

    // Companies scattered near their layer
    compNodes.forEach(n => {
      const layerHub = map.get(`layer-${n.layerIds?.[0] ?? "model"}`);
      const bx = layerHub ? layerHub.x : cx;
      const by = layerHub ? layerHub.y : cy;
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 120;
      const sn: SNode = {
        ...n, x: bx + Math.cos(angle) * dist, y: by + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
        fx: null, fy: null,
        radius: 10, targetOpacity: 0.7, currentOpacity: 0.7, labelOpacity: 0,
      };
      sNodes.push(sn); map.set(n.id, sn);
    });

    const sEdges: SEdge[] = edges
      .map(e => ({ source: map.get(e.source)!, target: map.get(e.target)! }))
      .filter(e => e.source && e.target);

    simRef.current = { nodes: sNodes, edges: sEdges, map };
    stRef.current.alpha = 1;
    stRef.current.pan = { x: 0, y: 0 };
    stRef.current.scale = 1;
  }, [nodes, edges]);

  /* ── Physics + Render loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true })!;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const tick = () => {
      const { nodes: sn, edges: se } = simRef.current;
      const st = stRef.current;
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      const cx = W / 2, cy = H / 2;
      st.time += 0.016;

      // ── Physics ──
      const alpha = st.alpha;

      for (const a of sn) {
        if (a.type === "layer" || a.fx != null) continue;

        // Subtle ambient float
        a.vx += Math.sin(st.time * 0.3 + a.x * 0.01) * 0.015;
        a.vy += Math.cos(st.time * 0.25 + a.y * 0.01) * 0.015;

        // Center gravity
        a.vx += (cx - a.x) * 0.0008 * alpha;
        a.vy += (cy - a.y) * 0.0008 * alpha;

        // Repulsion from all nodes
        for (const b of sn) {
          if (a === b) continue;
          const dx = a.x - b.x, dy = a.y - b.y;
          const distSq = dx * dx + dy * dy + 1;
          const dist = Math.sqrt(distSq);
          const minDist = a.radius + b.radius + 8;
          if (dist < minDist * 3) {
            const strength = b.type === "layer" ? 3500 : 600;
            const f = (strength / distSq) * alpha;
            a.vx += (dx / dist) * f;
            a.vy += (dy / dist) * f;
            // Hard collision
            if (dist < minDist) {
              const overlap = (minDist - dist) * 0.3;
              a.vx += (dx / dist) * overlap;
              a.vy += (dy / dist) * overlap;
            }
          }
        }
      }

      // Spring edges
      for (const e of se) {
        const { source: s, target: t } = e;
        const dx = t.x - s.x, dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const ideal = t.type === "layer" ? 110 : 80;
        const k = 0.025 * alpha;
        const f = (dist - ideal) * k;
        const fx = (dx / dist) * f, fy = (dy / dist) * f;
        if (s.type !== "layer" && s.fx == null) { s.vx += fx; s.vy += fy; }
        if (t.type !== "layer" && t.fx == null) { t.vx -= fx; t.vy -= fy; }
      }

      // Integrate with velocity decay
      for (const n of sn) {
        if (n.type === "layer") continue;
        if (n.fx != null) { n.x = n.fx; n.vx = 0; }
        if (n.fy != null) { n.y = n.fy; n.vy = 0; }
        if (n.fx != null) continue;
        n.vx *= 0.92;
        n.vy *= 0.92;
        // Clamp velocity
        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (speed > 5) { n.vx = (n.vx / speed) * 5; n.vy = (n.vy / speed) * 5; }
        n.x += n.vx;
        n.y += n.vy;
      }

      // Cool simulation (but never fully stop for ambient float)
      if (st.alpha > 0.03) st.alpha *= 0.999;

      // ── Opacity interpolation ──
      const hovNode = st.hover;
      const hovEdge = st.hoverEdge;
      const activeIds = new Set<string>();
      if (hovNode) {
        activeIds.add(hovNode.id);
        for (const e of se) {
          if (e.source.id === hovNode.id) activeIds.add(e.target.id);
          if (e.target.id === hovNode.id) activeIds.add(e.source.id);
        }
      }
      if (hovEdge) {
        activeIds.add(hovEdge.source.id);
        activeIds.add(hovEdge.target.id);
      }

      for (const n of sn) {
        const isActive = activeIds.size === 0 || activeIds.has(n.id);
        n.targetOpacity = isActive ? 1 : 0.15;
        n.currentOpacity += (n.targetOpacity - n.currentOpacity) * 0.12;
        // Label opacity
        const showLabel = n.type === "layer"
          || n.id === hovNode?.id
          || n.id === st.selected?.id
          || (activeIds.has(n.id) && activeIds.size > 0 && n.type !== "layer");
        const targetLabel = showLabel ? 1 : 0;
        n.labelOpacity += (targetLabel - n.labelOpacity) * 0.1;
      }

      // ── Render ──
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.save();
      ctx.translate(st.pan.x, st.pan.y);
      ctx.scale(st.scale, st.scale);

      // Edges
      for (const e of se) {
        const isActive = (hovNode && (e.source.id === hovNode.id || e.target.id === hovNode.id))
          || (hovEdge === e);
        const opacity = isActive ? 0.4 : Math.min(e.source.currentOpacity, e.target.currentOpacity) * 0.1;
        ctx.beginPath();
        ctx.moveTo(e.source.x, e.source.y);
        ctx.lineTo(e.target.x, e.target.y);
        ctx.strokeStyle = `rgba(255,255,255,${opacity})`;
        ctx.lineWidth = isActive ? 1.2 : 0.4;
        if (!isActive) { ctx.setLineDash([2, 7]); } else { ctx.setLineDash([]); }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Nodes
      for (const n of sn) {
        const isHov = n.id === hovNode?.id;
        const isSel = n.id === st.selected?.id;
        const r = n.type === "layer" ? n.radius : (isHov ? n.radius + 5 : n.radius);
        const h = hue(n);
        const op = n.currentOpacity;

        ctx.save();

        // Glow
        if (isHov || isSel || n.type === "layer") {
          ctx.shadowColor = `hsla(${h},30%,80%,${isHov ? 0.6 : 0.25})`;
          ctx.shadowBlur = isHov ? 30 : (n.type === "layer" ? 16 : 8);
        }

        // Fill
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(n.x - r * 0.2, n.y - r * 0.2, r * 0.05, n.x, n.y, r);
        if (isHov) {
          grad.addColorStop(0, `rgba(255,255,255,${0.95 * op})`);
          grad.addColorStop(1, `hsla(${h},10%,70%,${0.6 * op})`);
        } else {
          grad.addColorStop(0, `hsla(${h},8%,${n.type === "layer" ? 80 : 60}%,${0.9 * op})`);
          grad.addColorStop(1, `hsla(${h},5%,${n.type === "layer" ? 55 : 40}%,${0.5 * op})`);
        }
        ctx.fillStyle = grad;
        ctx.fill();

        // Stroke
        ctx.strokeStyle = `rgba(255,255,255,${(isHov ? 0.5 : 0.12) * op})`;
        ctx.lineWidth = isSel ? 1.5 : 0.6;
        ctx.stroke();
        ctx.restore();

        // Labels
        if (n.labelOpacity > 0.01) {
          ctx.save();
          ctx.globalAlpha = n.labelOpacity;
          if (n.type === "layer") {
            ctx.font = `500 ${Math.max(8, r * 0.35)}px system-ui`;
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const words = n.label.split(" ");
            if (words.length > 1) {
              ctx.fillText(words[0], n.x, n.y - 5);
              ctx.fillText(words.slice(1).join(" "), n.x, n.y + 7);
            } else {
              ctx.fillText(n.label, n.x, n.y);
            }
          } else {
            ctx.font = "400 8px system-ui";
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            const lbl = n.label.length > 16 ? n.label.slice(0, 15) + "…" : n.label;
            ctx.fillText(lbl, n.x, n.y + r + 4);
          }
          ctx.restore();
        }
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  /* ── Input helpers ── */
  const toSim = useCallback((cx: number, cy: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const st = stRef.current;
    return { x: (cx - rect.left - st.pan.x) / st.scale, y: (cy - rect.top - st.pan.y) / st.scale };
  }, []);

  /* ── Mouse handlers ── */
  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const st = stRef.current;
    const { x, y } = toSim(e.clientX, e.clientY);

    if (st.drag) {
      st.drag.fx = x + st.dragOffset.x;
      st.drag.fy = y + st.dragOffset.y;
      st.hasDragged = true;
      st.alpha = Math.max(st.alpha, 0.3); // wake physics
      return;
    }
    if (st.isPanning) {
      const rect = canvasRef.current!.getBoundingClientRect();
      st.pan.x = st.panStart.px + (e.clientX - rect.left - st.panStart.mx);
      st.pan.y = st.panStart.py + (e.clientY - rect.top - st.panStart.my);
      return;
    }

    // Hit test node
    const { nodes: sn, edges: se } = simRef.current;
    const found = findNearest(sn, x, y, 40);
    if (found) {
      st.hover = found;
      st.hoverEdge = null;
      canvasRef.current!.style.cursor = "pointer";
    } else {
      // Hit test edge
      const edgeHit = findNearestEdge(se, x, y, 8 / st.scale);
      st.hover = null;
      st.hoverEdge = edgeHit;
      canvasRef.current!.style.cursor = edgeHit ? "pointer" : "grab";
    }
  }, [toSim]);

  const handleDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const st = stRef.current;
    const { x, y } = toSim(e.clientX, e.clientY);
    const found = findNearest(simRef.current.nodes, x, y, 40);
    st.hasDragged = false;
    if (found) {
      st.drag = found;
      st.dragOffset = { x: found.x - x, y: found.y - y };
    } else {
      st.isPanning = true;
      const rect = canvasRef.current!.getBoundingClientRect();
      st.panStart = { mx: e.clientX - rect.left, my: e.clientY - rect.top, px: st.pan.x, py: st.pan.y };
    }
  }, [toSim]);

  const handleUp = useCallback(() => {
    const st = stRef.current;
    if (st.drag) {
      if (!st.hasDragged) {
        // Click on node
        st.selected = st.selected?.id === st.drag.id ? null : st.drag;
        setSelectedNode(st.selected);
      } else {
        // Release with inertia (node keeps momentum)
      }
      st.drag.fx = null;
      st.drag.fy = null;
      st.drag = null;
      st.alpha = Math.max(st.alpha, 0.4);
    }
    st.isPanning = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const st = stRef.current;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const next = Math.min(5, Math.max(0.2, st.scale * delta));
    st.pan.x = mx - (mx - st.pan.x) * (next / st.scale);
    st.pan.y = my - (my - st.pan.y) * (next / st.scale);
    st.scale = next;
  }, []);

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full gpu"
        style={{ touchAction: "none", cursor: "grab" }}
        onMouseMove={handleMove}
        onMouseDown={handleDown}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onWheel={handleWheel}
      />

      {/* Detail panel */}
      {selectedNode && (
        <div className="absolute bottom-6 left-6 max-w-[260px] rounded-xl border border-white/8 bg-black/90 p-5 backdrop-blur-xl animate-fade-in-up" style={{ animationDuration: "0.3s" }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] text-white/25">
                {selectedNode.type === "layer" ? "Layer" : selectedNode.category}
              </p>
              <h4 className="mt-1 text-sm font-medium text-white">{selectedNode.label}</h4>
            </div>
            <button
              onClick={() => { stRef.current.selected = null; setSelectedNode(null); }}
              className="text-white/15 hover:text-white/50 transition"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {selectedNode.valuation && selectedNode.valuation !== "N/A" && selectedNode.valuation !== "$NaNB" && (
            <p className="mt-2 text-xs text-white/30">Funding: <span className="text-white/60">{selectedNode.valuation}</span></p>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedNode.layerIds?.map(lid => (
              <span key={lid} className="rounded-full border border-white/8 px-2 py-0.5 text-[8px] uppercase tracking-wider text-white/30">
                {lid}
              </span>
            ))}
          </div>
          {selectedNode.website && (
            <a href={selectedNode.website} target="_blank" rel="noopener noreferrer"
              className="mt-3 block text-[11px] text-white/25 hover:text-white/60 transition"
            >
              Visit site →
            </a>
          )}
        </div>
      )}

      <p className="pointer-events-none absolute bottom-4 right-4 text-[8px] tracking-[0.3em] text-white/10 uppercase">
        scroll zoom · drag pan · click inspect
      </p>
=======
import { useCallback, useEffect, useRef, useState } from "react";
import type { Company, Layer } from "@/types/ecosystem";
import { CompanyInfoCard } from "@/components/ui/CompanyInfoCard";
import { LAYER_ACCENTS } from "@/lib/constants";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SimNode {
  id: string;
  company: Company;
  layerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  glowColor: string;
}

interface SimState {
  nodes: SimNode[];
  edges: [number, number][];
  layerLabels: { name: string; x: number; y: number }[];
  alpha: number;
  panX: number;
  panY: number;
  scale: number;
  width: number;
  height: number;
  // interaction
  isPanning: boolean;
  panStartX: number;
  panStartY: number;
  dragStartX: number;
  dragStartY: number;
  dragNodeIdx: number | null;
  lastMouseX: number;
  lastMouseY: number;
}

// ─── Layer glow colors (subtle, kept near grayscale for cinematic look) ──────

const LAYER_GLOW: Record<string, string> = {
  infrastructure: "rgba(56,189,248,0.7)",
  model:          "rgba(167,139,250,0.7)",
  application:    "rgba(52,211,153,0.7)",
  integration:    "rgba(251,191,36,0.7)",
  security:       "rgba(248,113,113,0.7)",
  monetization:   "rgba(232,121,249,0.7)",
};

// ─── Simulation helpers ───────────────────────────────────────────────────────

function layerClusterPositions(count: number, spread: number): [number, number][] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return [Math.cos(angle) * spread, Math.sin(angle) * spread];
  });
}

function initSim(layers: Layer[], width: number, height: number): SimState {
  const nodes: SimNode[] = [];
  const edges: [number, number][] = [];
  const layerLabels: { name: string; x: number; y: number }[] = [];

  const clusterSpread = Math.min(width, height) * 0.28;
  const clusterPositions = layerClusterPositions(layers.length, clusterSpread);

  layers.forEach((layer, li) => {
    const [cx, cy] = clusterPositions[li];
    layerLabels.push({ name: layer.name, x: cx, y: cy - 90 });

    const count = layer.companies.length;
    const nodeStart = nodes.length;

    layer.companies.forEach((company, ci) => {
      const angle = (ci / count) * Math.PI * 2;
      const r = 30 + Math.random() * 50;
      nodes.push({
        id: company.id,
        company,
        layerId: layer.id,
        x: cx + Math.cos(angle) * r + (Math.random() - 0.5) * 20,
        y: cy + Math.sin(angle) * r + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 5,
        glowColor: LAYER_GLOW[layer.id] ?? "rgba(255,255,255,0.6)",
      });
    });

    // Ring edges within layer
    for (let i = 0; i < count; i++) {
      edges.push([nodeStart + i, nodeStart + (i + 1) % count]);
      if (count > 4 && i % 3 === 0) {
        edges.push([nodeStart + i, nodeStart + (i + Math.floor(count / 3)) % count]);
      }
    }
  });

  return {
    nodes,
    edges,
    layerLabels,
    alpha: 1,
    panX: width / 2,
    panY: height / 2,
    scale: 1,
    width,
    height,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    dragStartX: 0,
    dragStartY: 0,
    dragNodeIdx: null,
    lastMouseX: 0,
    lastMouseY: 0,
  };
}

function tickSim(s: SimState) {
  const { nodes, edges, alpha, width, height } = s;
  const n = nodes.length;
  const REPULSION = 4500;
  const SPRING_K = 0.025;
  const REST_LEN = 75;
  const CENTER_K = 0.018;
  const DAMPING = 0.82;
  const MAX_VEL = 12;
  const BOUNDARY = Math.min(width, height) * 0.46;

  // Repulsion between all pairs
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const d2 = Math.max(dx * dx + dy * dy, 4);
      const d = Math.sqrt(d2);
      const f = REPULSION / d2;
      const fx = (f * dx) / d;
      const fy = (f * dy) / d;
      nodes[i].vx += fx;
      nodes[i].vy += fy;
      nodes[j].vx -= fx;
      nodes[j].vy -= fy;
    }
  }

  // Spring forces along edges
  const springAlpha = Math.max(alpha, 0.15);
  for (const [i, j] of edges) {
    const dx = nodes[j].x - nodes[i].x;
    const dy = nodes[j].y - nodes[i].y;
    const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
    const f = (d - REST_LEN) * SPRING_K * springAlpha;
    const fx = (f * dx) / d;
    const fy = (f * dy) / d;
    nodes[i].vx += fx;
    nodes[i].vy += fy;
    nodes[j].vx -= fx;
    nodes[j].vy -= fy;
  }

  // Per-node: center gravity, boundary, damping, integrate
  for (let i = 0; i < n; i++) {
    if (s.dragNodeIdx === i) continue;
    const node = nodes[i];

    // Soft center gravity
    node.vx -= node.x * CENTER_K * Math.max(alpha, 0.05);
    node.vy -= node.y * CENTER_K * Math.max(alpha, 0.05);

    // Elastic boundary
    const r = Math.sqrt(node.x * node.x + node.y * node.y);
    if (r > BOUNDARY) {
      const overflow = r - BOUNDARY;
      const pushF = overflow * 0.08;
      node.vx -= (pushF * node.x) / r;
      node.vy -= (pushF * node.y) / r;
    }

    // Damping + clamp velocity
    node.vx *= DAMPING;
    node.vy *= DAMPING;
    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    if (speed > MAX_VEL) {
      node.vx = (node.vx / speed) * MAX_VEL;
      node.vy = (node.vy / speed) * MAX_VEL;
    }

    node.x += node.vx;
    node.y += node.vy;
  }

  // Cool the simulation (but keep a minimum so it stays alive)
  if (s.alpha > 0.005) s.alpha -= 0.004;
  else s.alpha = 0.005;
}

function renderSim(s: SimState, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const cw = canvas.offsetWidth;
  const ch = canvas.offsetHeight;

  if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.scale(dpr, dpr);
  }

  // Background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cw, ch);

  ctx.save();
  ctx.translate(s.panX, s.panY);
  ctx.scale(s.scale, s.scale);

  // Edges
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 0.6 / s.scale;
  ctx.beginPath();
  for (const [i, j] of s.edges) {
    ctx.moveTo(s.nodes[i].x, s.nodes[i].y);
    ctx.lineTo(s.nodes[j].x, s.nodes[j].y);
  }
  ctx.stroke();

  // Nodes
  for (const node of s.nodes) {
    const { x, y, radius, glowColor } = node;

    // Glow halo
    ctx.shadowBlur = 14 / s.scale;
    ctx.shadowColor = glowColor;
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Layer cluster labels
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  const labelSize = Math.max(9, 11 / s.scale);
  ctx.font = `500 ${labelSize}px system-ui, sans-serif`;
  for (const label of s.layerLabels) {
    ctx.fillText(label.name.toUpperCase(), label.x, label.y);
  }

  ctx.restore();
}

// ─── Hit testing ─────────────────────────────────────────────────────────────

function hitTest(s: SimState, screenX: number, screenY: number): number {
  const wx = (screenX - s.panX) / s.scale;
  const wy = (screenY - s.panY) / s.scale;
  const HIT_RADIUS = 12 / s.scale;
  for (let i = 0; i < s.nodes.length; i++) {
    const dx = s.nodes[i].x - wx;
    const dy = s.nodes[i].y - wy;
    if (dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS) return i;
  }
  return -1;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EcosystemGraph({ layers }: { layers: Layer[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<SimState | null>(null);
  const rafRef = useRef<number>(0);
  const [selected, setSelected] = useState<{ company: Company; layerId: string } | null>(null);

  // Init + animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.offsetWidth || window.innerWidth;
    const h = canvas.offsetHeight || window.innerHeight - 64;
    simRef.current = initSim(layers, w, h);

    const loop = () => {
      if (simRef.current) {
        tickSim(simRef.current);
        renderSim(simRef.current, canvas);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [layers]);

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(() => {
      if (!simRef.current) return;
      simRef.current.width = canvas.offsetWidth;
      simRef.current.height = canvas.offsetHeight;
      simRef.current.panX = canvas.offsetWidth / 2;
      simRef.current.panY = canvas.offsetHeight / 2;
    });
    obs.observe(canvas);
    return () => obs.disconnect();
  }, []);

  // Mouse: pan + node drag
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!simRef.current) return;
    const s = simRef.current;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const idx = hitTest(s, sx, sy);
    if (idx >= 0) {
      s.dragNodeIdx = idx;
    } else {
      s.isPanning = true;
      s.panStartX = e.clientX - s.panX;
      s.panStartY = e.clientY - s.panY;
    }
    // Track initial position for click-vs-drag detection
    s.lastMouseX = e.clientX;
    s.lastMouseY = e.clientY;
    s.dragStartX = e.clientX;
    s.dragStartY = e.clientY;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!simRef.current) return;
    const s = simRef.current;
    if (s.isPanning) {
      s.panX = e.clientX - s.panStartX;
      s.panY = e.clientY - s.panStartY;
    } else if (s.dragNodeIdx !== null) {
      const dx = (e.clientX - s.lastMouseX) / s.scale;
      const dy = (e.clientY - s.lastMouseY) / s.scale;
      s.nodes[s.dragNodeIdx].x += dx;
      s.nodes[s.dragNodeIdx].y += dy;
      s.nodes[s.dragNodeIdx].vx = dx * 2;
      s.nodes[s.dragNodeIdx].vy = dy * 2;
      s.alpha = Math.max(s.alpha, 0.3);
    }
    s.lastMouseX = e.clientX;
    s.lastMouseY = e.clientY;
  }, []);

  const onMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!simRef.current) return;
      const s = simRef.current;
      // Use dragStart (mousedown position) to distinguish click from drag
      const didntMove =
        Math.abs(e.clientX - s.dragStartX) < 5 &&
        Math.abs(e.clientY - s.dragStartY) < 5;
      if (didntMove && s.dragNodeIdx === null) {
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const idx = hitTest(s, e.clientX - rect.left, e.clientY - rect.top);
        if (idx >= 0) {
          const node = s.nodes[idx];
          setSelected({ company: node.company, layerId: node.layerId });
        } else {
          setSelected(null);
        }
      }
      s.isPanning = false;
      s.dragNodeIdx = null;
    },
    [],
  );

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!simRef.current) return;
    const s = simRef.current;
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const wx = (mx - s.panX) / s.scale;
    const wy = (my - s.panY) / s.scale;
    s.scale = Math.max(0.3, Math.min(4, s.scale * factor));
    s.panX = mx - wx * s.scale;
    s.panY = my - wy * s.scale;
  }, []);

  const resetView = useCallback(() => {
    if (!simRef.current) return;
    const s = simRef.current;
    s.panX = s.width / 2;
    s.panY = s.height / 2;
    s.scale = 1;
  }, []);

  const accent = selected
    ? (LAYER_ACCENTS[selected.layerId] ?? LAYER_ACCENTS.infrastructure)
    : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      />

      {/* Layer legend */}
      <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-1.5">
        {layers.map((layer) => {
          const a = LAYER_ACCENTS[layer.id] ?? LAYER_ACCENTS.infrastructure;
          return (
            <div key={layer.id} className="flex items-center gap-2 text-xs text-zinc-500">
              <span
                className={`h-2 w-2 rounded-full bg-gradient-to-r ${a.from} ${a.to}`}
              />
              {layer.name}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <button
          type="button"
          onClick={resetView}
          className="rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-zinc-400 backdrop-blur-sm transition hover:border-white/20 hover:text-zinc-200"
        >
          Reset view
        </button>
        <span className="rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-zinc-600 backdrop-blur-sm">
          Scroll to zoom · Drag to pan
        </span>
      </div>

      {/* Info card */}
      {selected && accent && (
        <CompanyInfoCard
          company={selected.company}
          layerId={selected.layerId}
          onClose={() => setSelected(null)}
        />
      )}
>>>>>>> 27c4452 (Add force-directed graph, location map, and company info card system.)
    </div>
  );
}
