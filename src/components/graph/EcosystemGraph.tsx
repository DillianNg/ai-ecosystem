"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { GraphNode, GraphEdge } from "@/lib/ecosystem-utils";

interface EcosystemGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface SimNode extends GraphNode {
  x: number; y: number;
  vx: number; vy: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimEdge { source: SimNode; target: SimNode; }

// Grayscale palette — Obsidian aesthetic
const LAYER_HUE: Record<string, number> = {
  infrastructure: 210,
  model: 270,
  application: 160,
  integration: 40,
  security: 0,
  monetization: 300,
};

function nodeColor(node: GraphNode, alpha = 1) {
  const hue = LAYER_HUE[node.layerIds?.[0] ?? "infrastructure"] ?? 270;
  if (node.type === "layer") return `hsla(${hue},8%,85%,${alpha})`;
  return `hsla(${hue},5%,65%,${alpha})`;
}
function nodeGlow(node: GraphNode) {
  const hue = LAYER_HUE[node.layerIds?.[0] ?? "infrastructure"] ?? 270;
  return `hsla(${hue},40%,75%,0.7)`;
}
function edgeColor(edge: SimEdge, highlighted: boolean) {
  if (highlighted) return "rgba(255,255,255,0.35)";
  return "rgba(255,255,255,0.06)";
}

export function EcosystemGraph({ nodes, edges }: EcosystemGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<{ nodes: SimNode[]; edges: SimEdge[] }>({ nodes: [], edges: [] });
  const rafRef = useRef<number>(0);
  const stateRef = useRef({
    hovered: null as SimNode | null,
    selected: null as SimNode | null,
    drag: null as SimNode | null,
    dragOffset: { x: 0, y: 0 },
    isPanning: false,
    panStart: { mx: 0, my: 0, px: 0, py: 0 },
    pan: { x: 0, y: 0 },
    scale: 1,
    hasDragged: false,
  });

  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null);
  const [hovered, setHovered] = useState<SimNode | null>(null);

  // Build / rebuild simulation when nodes/edges change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2, cy = H / 2;

    const layerNodes = nodes.filter((n) => n.type === "layer");
    const compNodes   = nodes.filter((n) => n.type === "company");

    const nodeMap = new Map<string, SimNode>();
    const simNodes: SimNode[] = [];

    // Layer nodes in ring
    layerNodes.forEach((n, i) => {
      const angle = (i / layerNodes.length) * Math.PI * 2 - Math.PI / 2;
      const r = Math.min(W, H) * 0.26;
      const sn: SimNode = { ...n, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, vx: 0, vy: 0 };
      simNodes.push(sn);
      nodeMap.set(n.id, sn);
    });

    // Company nodes scattered
    compNodes.forEach((n) => {
      const angle = Math.random() * Math.PI * 2;
      const r = 60 + Math.random() * Math.min(W, H) * 0.32;
      const sn: SimNode = { ...n, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, vx: (Math.random()-0.5)*1.5, vy: (Math.random()-0.5)*1.5 };
      simNodes.push(sn);
      nodeMap.set(n.id, sn);
    });

    const simEdges: SimEdge[] = edges
      .map((e) => ({ source: nodeMap.get(e.source)!, target: nodeMap.get(e.target)! }))
      .filter((e) => e.source && e.target);

    simRef.current = { nodes: simNodes, edges: simEdges };
    // Reset camera
    stateRef.current.pan = { x: 0, y: 0 };
    stateRef.current.scale = 1;
  }, [nodes, edges]);

  // Physics + render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true })!;

    // Resize canvas
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let alpha = 1; // simulation cooling

    const tick = () => {
      const { nodes: sNodes, edges: sEdges } = simRef.current;
      const st = stateRef.current;
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;

      // --- Physics ---
      if (alpha > 0.01) {
        // Repulsion
        for (let i = 0; i < sNodes.length; i++) {
          const a = sNodes[i];
          if (a.type === "layer") continue;
          for (let j = 0; j < sNodes.length; j++) {
            if (i === j) continue;
            const b = sNodes[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const distSq = dx*dx + dy*dy + 1;
            const dist = Math.sqrt(distSq);
            const strength = b.type === "layer" ? 5000 : 900;
            a.vx += (dx / dist) * (strength / distSq) * alpha;
            a.vy += (dy / dist) * (strength / distSq) * alpha;
          }
          // Center gravity
          a.vx += (cx - a.x) * 0.002 * alpha;
          a.vy += (cy - a.y) * 0.002 * alpha;
        }
        // Spring edges
        for (const edge of sEdges) {
          const { source: s, target: t } = edge;
          const dx = t.x - s.x, dy = t.y - s.y;
          const dist = Math.sqrt(dx*dx + dy*dy) + 0.01;
          const ideal = t.type === "layer" ? 130 : 90;
          const k = 0.035 * alpha;
          const f = (dist - ideal) * k;
          const fx = (dx / dist) * f, fy = (dy / dist) * f;
          if (s.type !== "layer" && s.fx == null) { s.vx += fx; s.vy += fy; }
          if (t.type !== "layer" && t.fx == null) { t.vx -= fx; t.vy -= fy; }
        }
        // Integrate
        for (const n of sNodes) {
          if (n.type === "layer" || n.fx != null) continue;
          n.vx *= 0.85; n.vy *= 0.85;
          n.x += n.vx; n.y += n.vy;
        }
        alpha *= 0.997;
      }

      // Pinned drag node
      for (const n of sNodes) {
        if (n.fx != null) { n.x = n.fx; n.vx = 0; }
        if (n.fy != null) { n.y = n.fy; n.vy = 0; }
      }

      // --- Render ---
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(st.pan.x, st.pan.y);
      ctx.scale(st.scale, st.scale);

      const hovNode = st.hovered;
      const selNode = st.selected;

      // Collect highlighted node ids
      const highlightedIds = new Set<string>();
      if (hovNode) {
        highlightedIds.add(hovNode.id);
        for (const e of sEdges) {
          if (e.source.id === hovNode.id) highlightedIds.add(e.target.id);
          if (e.target.id === hovNode.id) highlightedIds.add(e.source.id);
        }
      }

      // Edges
      for (const edge of sEdges) {
        const hl = hovNode
          ? edge.source.id === hovNode.id || edge.target.id === hovNode.id
          : false;
        ctx.beginPath();
        ctx.moveTo(edge.source.x, edge.source.y);
        ctx.lineTo(edge.target.x, edge.target.y);
        ctx.strokeStyle = edgeColor(edge, hl);
        ctx.lineWidth = hl ? 1 : 0.5;
        if (!hl) ctx.setLineDash([2, 8]);
        else ctx.setLineDash([]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Nodes
      for (const node of sNodes) {
        const isHov = hovNode?.id === node.id;
        const isSel = selNode?.id === node.id;
        const isDim = hovNode && !highlightedIds.has(node.id);
        const r = node.type === "layer" ? 28 : (isHov ? 18 : 14);
        const baseAlpha = isDim ? 0.2 : 1;
        const color = nodeColor(node, baseAlpha);

        ctx.save();

        // Outer glow (hover / selected / layer)
        if (isHov || isSel || node.type === "layer") {
          ctx.shadowColor = nodeGlow(node);
          ctx.shadowBlur  = isHov ? 28 : (node.type === "layer" ? 18 : 10);
        }

        // Fill
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(
          node.x - r * 0.25, node.y - r * 0.25, r * 0.05,
          node.x, node.y, r
        );
        grad.addColorStop(0, isHov ? `rgba(255,255,255,${0.95 * baseAlpha})` : color);
        grad.addColorStop(1, nodeColor(node, 0.5 * baseAlpha));
        ctx.fillStyle = grad;
        ctx.fill();

        // Stroke
        ctx.strokeStyle = isHov || isSel
          ? `rgba(255,255,255,${0.7 * baseAlpha})`
          : nodeColor(node, 0.3 * baseAlpha);
        ctx.lineWidth = isSel ? 1.5 : 0.75;
        ctx.stroke();

        ctx.restore();

        // Labels
        ctx.save();
        ctx.globalAlpha = isDim ? 0.15 : 1;
        if (node.type === "layer") {
          ctx.font = `500 ${Math.max(9, r * 0.36)}px system-ui`;
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const words = node.label.split(" ");
          if (words.length > 1) {
            ctx.fillText(words[0], node.x, node.y - 6);
            ctx.fillText(words.slice(1).join(" "), node.x, node.y + 7);
          } else {
            ctx.fillText(node.label, node.x, node.y);
          }
        } else if (isHov || isSel) {
          ctx.font = `400 9px system-ui`;
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          const lbl = node.label.length > 14 ? node.label.slice(0, 13) + "…" : node.label;
          ctx.fillText(lbl, node.x, node.y + r + 5);
        }
        ctx.restore();
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  // Coordinate helpers
  const toSim = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const st = stateRef.current;
    return {
      x: (clientX - rect.left - st.pan.x) / st.scale,
      y: (clientY - rect.top  - st.pan.y) / st.scale,
    };
  }, []);

  const hitTest = useCallback((sx: number, sy: number) => {
    const { nodes } = simRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const r = n.type === "layer" ? 30 : 18;
      if ((n.x - sx) ** 2 + (n.y - sy) ** 2 < r * r) return n;
    }
    return null;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const st = stateRef.current;
    if (st.drag) {
      const { x, y } = toSim(e.clientX, e.clientY);
      st.drag.fx = x + st.dragOffset.x;
      st.drag.fy = y + st.dragOffset.y;
      st.hasDragged = true;
      return;
    }
    if (st.isPanning) {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      st.pan.x = st.panStart.px + (e.clientX - rect.left - st.panStart.mx);
      st.pan.y = st.panStart.py + (e.clientY - rect.top  - st.panStart.my);
      return;
    }
    const { x, y } = toSim(e.clientX, e.clientY);
    const found = hitTest(x, y);
    st.hovered = found;
    setHovered(found);
    canvasRef.current!.style.cursor = found ? "pointer" : "grab";
  }, [toSim, hitTest]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = toSim(e.clientX, e.clientY);
    const found = hitTest(x, y);
    const st = stateRef.current;
    st.hasDragged = false;
    if (found) {
      st.drag = found;
      st.dragOffset = { x: found.x - x, y: found.y - y };
    } else {
      st.isPanning = true;
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      st.panStart = { mx: e.clientX - rect.left, my: e.clientY - rect.top, px: st.pan.x, py: st.pan.y };
    }
  }, [toSim, hitTest]);

  const handleMouseUp = useCallback(() => {
    const st = stateRef.current;
    if (st.drag && !st.hasDragged) {
      const node = st.drag;
      st.selected = st.selected?.id === node.id ? null : node;
      setSelectedNode(st.selected);
    }
    if (st.drag) {
      st.drag.fx = null;
      st.drag.fy = null;
      st.drag = null;
    }
    st.isPanning = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current!;
    const rect  = canvas.getBoundingClientRect();
    const st    = stateRef.current;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.88 : 1.12;
    const next  = Math.min(4, Math.max(0.25, st.scale * delta));
    // Zoom toward cursor
    st.pan.x = mx - (mx - st.pan.x) * (next / st.scale);
    st.pan.y = my - (my - st.pan.y) * (next / st.scale);
    st.scale = next;
  }, []);

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ touchAction: "none", cursor: "grab" }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Detail panel */}
      {selectedNode && (
        <div className="absolute bottom-6 left-6 max-w-[220px] rounded-xl border border-white/10 bg-black/80 p-4 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/30">
                {selectedNode.type === "layer" ? "Layer" : selectedNode.category}
              </p>
              <h4 className="mt-0.5 text-sm font-medium text-white">{selectedNode.label}</h4>
            </div>
            <button
              onClick={() => { stateRef.current.selected = null; setSelectedNode(null); }}
              className="text-white/20 hover:text-white/60 transition"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {selectedNode.valuation && selectedNode.valuation !== "N/A" && (
            <p className="mt-2 text-xs text-white/40">{selectedNode.valuation}</p>
          )}
          {selectedNode.website && (
            <a
              href={selectedNode.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-xs text-white/40 hover:text-white/80 transition"
            >
              Visit site →
            </a>
          )}
        </div>
      )}

      {/* Hint */}
      <p className="pointer-events-none absolute bottom-4 right-4 text-[9px] tracking-widest text-white/15 uppercase">
        scroll to zoom · drag to pan · click to inspect
      </p>
    </div>
  );
}
