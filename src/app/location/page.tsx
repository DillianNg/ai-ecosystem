import type { Metadata } from "next";
import { getBundledData } from "@/lib/data";
import { LocationMap } from "@/components/location/LocationMap";

export const metadata: Metadata = {
  title: "Location Map",
  description: "Global map of AI ecosystem companies by headquarters — zoom in to explore regions.",
};

export default function LocationPage() {
  const { layers } = getBundledData();
  return (
    <div style={{ height: "calc(100vh - 64px)" }}>
      <LocationMap layers={layers} />
    </div>
  );
}
