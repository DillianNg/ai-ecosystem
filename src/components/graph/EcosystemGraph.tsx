"use client";

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

/* ── Nearest node (for hover / click) ── */
function findNearest(nodes: SNode[], x: number, y: number, maxDist: number): SNode | null {
  let best: SNode | null = null;
  let bestD = maxDist * maxDist;
  for (const n of nodes) {
    const d = (n.x - x) ** 2 + (n.y - y) ** 2;
    const r = n.radius + 4;
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
    alpha: 1,
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
    const compNodes  = nodes.filter(n => n.type === "company");
    const map = new Map<string, SNode>();
    const sNodes: SNode[] = [];

    // Layer hubs pinned in a ring — centered perfectly on canvas
    layerNodes.forEach((n, i) => {
      const angle = (i / layerNodes.length) * Math.PI * 2 - Math.PI / 2;
      const r = Math.min(W, H) * 0.25;
      const sn: SNode = {
        ...n,
        x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r,
        vx: 0, vy: 0,
        fx: cx + Math.cos(angle) * r, fy: cy + Math.sin(angle) * r,
        radius: 26, targetOpacity: 1, currentOpacity: 1, labelOpacity: 1,
      };
      sNodes.push(sn); map.set(n.id, sn);
    });

    // Companies scattered near their layer hub
    compNodes.forEach(n => {
      const layerHub = map.get(`layer-${n.layerIds?.[0] ?? "model"}`);
      const bx = layerHub ? layerHub.x : cx;
      const by = layerHub ? layerHub.y : cy;
      const angle = Math.random() * Math.PI * 2;
      const dist  = 40 + Math.random() * 120;
      const sn: SNode = {
        ...n,
        x: bx + Math.cos(angle) * dist, y: by + Math.sin(angle) * dist,
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
      canvas.width  = w * dpr;
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

        // Subtle ambient float (keeps the graph alive when cooled)
        a.vx += Math.sin(st.time * 0.3 + a.x * 0.01) * 0.015;
        a.vy += Math.cos(st.time * 0.25 + a.y * 0.01) * 0.015;

        // Center gravity — ensures graph stays centered
        a.vx += (cx - a.x) * 0.0008 * alpha;
        a.vy += (cy - a.y) * 0.0008 * alpha;

        // Repulsion from all nodes
        for (const b of sn) {
          if (a === b) continue;
          const dx = a.x - b.x, dy = a.y - b.y;
          const distSq = dx * dx + dy * dy + 1;
          const dist   = Math.sqrt(distSq);
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
        const k  = 0.025 * alpha;
        const f  = (dist - ideal) * k;
        const fx = (dx / dist) * f, fy = (dy / dist) * f;
        if (s.type !== "layer" && s.fx == null) { s.vx += fx; s.vy += fy; }
        if (t.type !== "layer" && t.fx == null) { t.vx -= fx; t.vy -= fy; }
      }

      // Integrate with velocity decay + soft boundary
      for (const n of sn) {
        if (n.type === "layer") continue;
        if (n.fx != null) { n.x = n.fx; n.vx = 0; }
        if (n.fy != null) { n.y = n.fy; n.vy = 0; }
        if (n.fx != null) continue;

        // Soft boundary — elastic push back from canvas edge
        const BOUNDARY = Math.min(W, H) * 0.46;
        const nr = Math.sqrt((n.x - cx) ** 2 + (n.y - cy) ** 2);
        if (nr > BOUNDARY) {
          const overflow = nr - BOUNDARY;
          n.vx -= ((n.x - cx) / nr) * overflow * 0.06;
          n.vy -= ((n.y - cy) / nr) * overflow * 0.06;
        }

        n.vx *= 0.92;
        n.vy *= 0.92;
        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (speed > 5) { n.vx = (n.vx / speed) * 5; n.vy = (n.vy / speed) * 5; }
        n.x += n.vx;
        n.y += n.vy;
      }

      // Cool — but never fully stop (ambient float keeps it alive)
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
        n.targetOpacity  = isActive ? 1 : 0.15;
        n.currentOpacity += (n.targetOpacity - n.currentOpacity) * 0.12;
        const showLabel = n.type === "layer"
          || n.id === hovNode?.id
          || n.id === st.selected?.id
          || (activeIds.has(n.id) && activeIds.size > 0);
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
        const opacity = isActive
          ? 0.4
          : Math.min(e.source.currentOpacity, e.target.currentOpacity) * 0.1;
        ctx.beginPath();
        ctx.moveTo(e.source.x, e.source.y);
        ctx.lineTo(e.target.x, e.target.y);
        ctx.strokeStyle = `rgba(255,255,255,${opacity})`;
        ctx.lineWidth   = isActive ? 1.2 : 0.4;
        if (!isActive) { ctx.setLineDash([2, 7]); } else { ctx.setLineDash([]); }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Nodes
      for (const n of sn) {
        const isHov = n.id === hovNode?.id;
        const isSel = n.id === st.selected?.id;
        const r  = n.type === "layer" ? n.radius : (isHov ? n.radius + 5 : n.radius);
        const h  = hue(n);
        const op = n.currentOpacity;

        ctx.save();

        // Glow
        if (isHov || isSel || n.type === "layer") {
          ctx.shadowColor = `hsla(${h},30%,80%,${isHov ? 0.6 : 0.25})`;
          ctx.shadowBlur  = isHov ? 30 : (n.type === "layer" ? 16 : 8);
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
        ctx.lineWidth   = isSel ? 1.5 : 0.6;
        ctx.stroke();
        ctx.restore();

        // Labels
        if (n.labelOpacity > 0.01) {
          ctx.save();
          ctx.globalAlpha = n.labelOpacity;
          if (n.type === "layer") {
            ctx.font         = `500 ${Math.max(8, r * 0.35)}px system-ui`;
            ctx.fillStyle    = "#fff";
            ctx.textAlign    = "center";
            ctx.textBaseline = "middle";
            const words = n.label.split(" ");
            if (words.length > 1) {
              ctx.fillText(words[0], n.x, n.y - 5);
              ctx.fillText(words.slice(1).join(" "), n.x, n.y + 7);
            } else {
              ctx.fillText(n.label, n.x, n.y);
            }
          } else {
            ctx.font         = "400 8px system-ui";
            ctx.fillStyle    = "rgba(255,255,255,0.85)";
            ctx.textAlign    = "center";
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
    const st   = stRef.current;
    return {
      x: (cx - rect.left - st.pan.x) / st.scale,
      y: (cy - rect.top  - st.pan.y) / st.scale,
    };
  }, []);

  /* ── Mouse handlers ── */
  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const st = stRef.current;
    const { x, y } = toSim(e.clientX, e.clientY);

    if (st.drag) {
      st.drag.fx = x + st.dragOffset.x;
      st.drag.fy = y + st.dragOffset.y;
      st.hasDragged = true;
      st.alpha = Math.max(st.alpha, 0.3);
      return;
    }
    if (st.isPanning) {
      const rect = canvasRef.current!.getBoundingClientRect();
      st.pan.x = st.panStart.px + (e.clientX - rect.left - st.panStart.mx);
      st.pan.y = st.panStart.py + (e.clientY - rect.top  - st.panStart.my);
      return;
    }

    const { nodes: sn, edges: se } = simRef.current;
    const found = findNearest(sn, x, y, 40);
    if (found) {
      st.hover    = found;
      st.hoverEdge = null;
      canvasRef.current!.style.cursor = "pointer";
    } else {
      const edgeHit = findNearestEdge(se, x, y, 8 / st.scale);
      st.hover    = null;
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
        st.selected = st.selected?.id === st.drag.id ? null : st.drag;
        setSelectedNode(st.selected);
      }
      st.drag.fx = null;
      st.drag.fy = null;
      st.drag    = null;
      st.alpha   = Math.max(st.alpha, 0.4);
    }
    st.isPanning = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const st   = stRef.current;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx   = e.clientX - rect.left, my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const next  = Math.min(5, Math.max(0.2, st.scale * delta));
    st.pan.x  = mx - (mx - st.pan.x) * (next / st.scale);
    st.pan.y  = my - (my - st.pan.y) * (next / st.scale);
    st.scale  = next;
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
        <div
          className="absolute bottom-6 left-6 max-w-[260px] rounded-xl border border-white/8 bg-black/90 p-5 backdrop-blur-xl animate-fade-in-up"
          style={{ animationDuration: "0.3s" }}
        >
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
            <p className="mt-2 text-xs text-white/30">
              Funding: <span className="text-white/60">{selectedNode.valuation}</span>
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedNode.layerIds?.map(lid => (
              <span key={lid} className="rounded-full border border-white/8 px-2 py-0.5 text-[8px] uppercase tracking-wider text-white/30">
                {lid}
              </span>
            ))}
          </div>
          {selectedNode.website && (
            <a
              href={selectedNode.website}
              target="_blank"
              rel="noopener noreferrer"
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
    </div>
  );
}
