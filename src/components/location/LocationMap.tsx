"use client";

import { useMemo, useState, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import type { Layer } from "@/types/ecosystem";
import { COMPANY_LOCATIONS } from "@/data/company-locations";
import { CompanyInfoCard } from "@/components/ui/CompanyInfoCard";
import { LAYER_ACCENTS } from "@/lib/constants";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface MarkerData {
  id: string;
  name: string;
  company: Parameters<typeof CompanyInfoCard>[0]["company"];
  layerId: string;
  coordinates: [number, number];
}

interface ClusterData {
  key: string;
  coordinates: [number, number];
  markers: MarkerData[];
}

function clusterMarkers(markers: MarkerData[], zoom: number): ClusterData[] {
  const cellDeg = zoom < 1.5 ? 8 : zoom < 2.5 ? 4 : 1.5;
  const map = new Map<string, MarkerData[]>();

  for (const m of markers) {
    const cx = Math.round(m.coordinates[0] / cellDeg) * cellDeg;
    const cy = Math.round(m.coordinates[1] / cellDeg) * cellDeg;
    const key = `${cx},${cy}`;
    const arr = map.get(key) ?? [];
    arr.push(m);
    map.set(key, arr);
  }

  return Array.from(map.entries()).map(([key, ms]) => ({
    key,
    coordinates: [
      ms.reduce((s, m) => s + m.coordinates[0], 0) / ms.length,
      ms.reduce((s, m) => s + m.coordinates[1], 0) / ms.length,
    ] as [number, number],
    markers: ms,
  }));
}

export function LocationMap({ layers }: { layers: Layer[] }) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);
  const [selected, setSelected] = useState<{
    company: MarkerData["company"];
    layerId: string;
  } | null>(null);

  const markers: MarkerData[] = useMemo(
    () =>
      layers.flatMap((layer) =>
        layer.companies
          .filter((c) => COMPANY_LOCATIONS[c.id])
          .map((c) => ({
            id: c.id,
            name: c.name,
            company: c,
            layerId: layer.id,
            coordinates: COMPANY_LOCATIONS[c.id],
          })),
      ),
    [layers],
  );

  const clusters = useMemo(() => clusterMarkers(markers, zoom), [markers, zoom]);

  const handleMoveEnd = useCallback(
    ({ zoom: z, coordinates }: { zoom: number; coordinates: [number, number] }) => {
      setZoom(z);
      setCenter(coordinates);
    },
    [],
  );

  const handleClusterClick = useCallback((cluster: ClusterData) => {
    if (cluster.markers.length === 1) {
      const m = cluster.markers[0];
      setSelected({ company: m.company, layerId: m.layerId });
    } else {
      setCenter(cluster.coordinates);
      setZoom((z) => Math.min(z * 2.5, 8));
    }
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <ComposableMap
        projection="geoNaturalEarth1"
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup zoom={zoom} center={center} onMoveEnd={handleMoveEnd} maxZoom={8}>
          {/* Grayscale world geography */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: { fill: "#0f0f0f", stroke: "#1e1e1e", strokeWidth: 0.3, outline: "none" },
                    hover:   { fill: "#161616", stroke: "#2a2a2a", strokeWidth: 0.3, outline: "none" },
                    pressed: { fill: "#1a1a1a", outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Company clusters and single markers */}
          {clusters.map((cluster) => {
            const isMulti = cluster.markers.length > 1;
            const r = isMulti
              ? Math.min(4 + Math.sqrt(cluster.markers.length) * 2.5, 14) / zoom
              : 3.5 / zoom;

            return (
              <Marker
                key={cluster.key}
                coordinates={cluster.coordinates}
                onClick={() => handleClusterClick(cluster)}
              >
                {isMulti ? (
                  <>
                    <circle
                      r={r}
                      fill="rgba(255,255,255,0.08)"
                      stroke="rgba(255,255,255,0.35)"
                      strokeWidth={0.8 / zoom}
                      className="cursor-pointer"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{
                        fill: "rgba(255,255,255,0.7)",
                        fontSize: Math.max(4, 7 / zoom),
                        fontFamily: "var(--font-geist-sans), system-ui",
                        fontWeight: 500,
                        pointerEvents: "none",
                      }}
                    >
                      {cluster.markers.length}
                    </text>
                  </>
                ) : (
                  <circle
                    r={r}
                    fill="rgba(255,255,255,0.8)"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={0.5 / zoom}
                    className="cursor-pointer"
                    style={{
                      filter: `drop-shadow(0 0 ${3 / zoom}px rgba(255,255,255,0.5))`,
                    }}
                  />
                )}
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Zoom controls — text-only, context style */}
      <div className="absolute right-6 top-6 flex flex-col gap-1">
        {[
          { label: "+", action: () => setZoom((z) => Math.min(z * 1.5, 8)), title: "Zoom in" },
          { label: "−", action: () => setZoom((z) => Math.max(z / 1.5, 1)), title: "Zoom out" },
          { label: "⊙", action: () => { setZoom(1); setCenter([0, 20]); }, title: "Reset" },
        ].map(({ label, action, title }) => (
          <button
            key={title}
            type="button"
            onClick={action}
            title={title}
            aria-label={title}
            className="flex h-8 w-8 items-center justify-center border border-white/6 bg-black/80 text-sm text-white/30 transition hover:border-white/12 hover:text-white/70"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Layer legend */}
      <div className="pointer-events-none absolute bottom-6 left-6 flex flex-col gap-1.5">
        <p className="mb-2 text-[10px] uppercase tracking-[0.35em] text-white/20">
          Layers
        </p>
        {layers.map((layer) => {
          const a = LAYER_ACCENTS[layer.id] ?? LAYER_ACCENTS.infrastructure;
          return (
            <div key={layer.id} className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${a.from} ${a.to}`} />
              <span className="text-[11px] text-white/25">{layer.name}</span>
            </div>
          );
        })}
        <p className="mt-3 text-[9px] uppercase tracking-[0.3em] text-white/10">
          Click cluster to zoom · marker to inspect
        </p>
      </div>

      {/* Detail card */}
      {selected && (
        <CompanyInfoCard
          company={selected.company}
          layerId={selected.layerId}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
