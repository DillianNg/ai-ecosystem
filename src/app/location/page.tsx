import type { Metadata } from "next";
import { getBundledData } from "@/lib/data";
import { LocationMap } from "@/components/location/LocationMap";

export const metadata: Metadata = {
  title: "Location",
  description: "Global map of AI ecosystem companies by headquarters — zoom in to explore regions.",
};

export default function LocationPage() {
  const { layers } = getBundledData();
  return (
    // Full viewport minus the 56px fixed header — same pattern as /graph/
    <div className="bg-black" style={{ height: "calc(100vh - 56px)" }}>
      <LocationMap layers={layers} />
    </div>
  );
}
