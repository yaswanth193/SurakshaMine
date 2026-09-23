"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  MapPin,
  Filter,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useMines } from "@/hooks/useMines";
import { useSession } from "@/hooks/useSession";
import { complianceService } from "@/lib/complianceService";
import { defaultZones } from "@/lib/inspectionService";
import { downloadCSV } from "@/lib/exportUtils";
import type { MineGisData, ZoneGisData } from "@/components/gis/InteractiveMap";

// Load react-leaflet map dynamically to bypass Next.js SSR window/document undefined issues
const InteractiveMap = dynamic(
  () => import("@/components/gis/InteractiveMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="text-center text-gray-500 flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
          <span className="text-sm font-medium">Loading interactive geographic maps...</span>
        </div>
      </div>
    ),
  }
);

const LOCAL_MINE_A_ZONES: ZoneGisData[] = [
  { name: "Zone A", lat: 23.6142, lng: 85.2750, color: "#3b82f6", desc: "Ventilation Shaft 1 & Atmospheric Gas Telemetry" },
  { name: "Zone B", lat: 23.6080, lng: 85.2830, color: "#eab308", desc: "Main Haul Ramp & Transport Incline Corridor" },
  { name: "Zone C", lat: 23.6160, lng: 85.2860, color: "#ef4444", desc: "Extraction Face & Highwall Rock Stabilization" },
  { name: "Zone D", lat: 23.6050, lng: 85.2760, color: "#22c55e", desc: "Coal Stockpile Yard & Rail Wagon Siding" },
];

const getRiskColor = (risk: string) => {
  const colors = {
    critical: "bg-red-600 text-white",
    high: "bg-red-500 text-white",
    medium: "bg-yellow-500 text-white",
    low: "bg-orange-400 text-white",
    safe: "bg-green-500 text-white",
  };
  return colors[risk as keyof typeof colors] || "bg-gray-500 text-white";
};

const stateCoords: Record<string, { lat: number; lng: number }> = {
  Jharkhand: { lat: 23.6102, lng: 85.2799 },
  Odisha: { lat: 20.9517, lng: 85.0985 },
  "Madhya Pradesh": { lat: 22.9734, lng: 78.6569 },
  Chhattisgarh: { lat: 21.2787, lng: 81.8661 },
  "West Bengal": { lat: 23.6102, lng: 87.2799 },
  Telangana: { lat: 18.1124, lng: 79.0193 },
};

export default function GISPage() {
  const router = useRouter();
  const { session } = useSession();

  // Regulatory Authority does not have GIS access; redirect to regulations
  useEffect(() => {
    if (session?.role === "REGULATORY_AUTHORITY") {
      router.replace("/regulations");
    }
  }, [session, router]);

  const isMineManager = session?.role === "MINE_MANAGER";
  const { data: dbMines = [], isLoading, refetch } = useMines();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);

  // Toggles for map layers: Default satellite to true for MINE_MANAGER so they get satellite aerial view
  const [activeLayers, setActiveLayers] = useState({
    mines: true,
    zones: true,
    satellite: false,
  });

  // Manager's specific mine
  const managerMine = useMemo(() => {
    if (!isMineManager) return null;
    return dbMines.find((m) => m.id === session?.mineId) || dbMines[0] || null;
  }, [isMineManager, dbMines, session]);

  // Handle layer toggle
  const toggleLayer = (layer: "mines" | "zones" | "satellite") => {
    setActiveLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("GIS telemetry and spatial data refreshed");
    }, 600);
  };

  // Convert dbMines to MineGisData for multi-mine mode
  const allMinesGisData: MineGisData[] = useMemo(() => {
    return dbMines.map((mine) => {
      const stateKey = Object.keys(stateCoords).find((k) =>
        mine.location?.toLowerCase().includes(k.toLowerCase())
      );
      const coords = stateKey ? stateCoords[stateKey] : { lat: 23.6102, lng: 85.2799 };

      const riskStatus: "safe" | "low" | "medium" | "high" | "critical" =
        (mine.risk_status as any) || "safe";

      return {
        id: mine.id,
        name: mine.name,
        location: mine.location || "India",
        latitude: coords.lat,
        longitude: coords.lng,
        riskStatus,
        riskScore: mine.risk_score ?? 50,
        complianceScore: mine.compliance_score ?? 85,
        workersOnSite: mine.workers_on_site ?? 250,
        type: mine.type || "underground",
        status: mine.status || "active",
      };
    });
  }, [dbMines]);

  // Export GIS coordinates as CSV
  const handleExportCoordinates = () => {
    if (isMineManager && managerMine) {
      const headers = ["Zone Name", "Latitude", "Longitude", "Description"];
      const rows = LOCAL_MINE_A_ZONES.map((z) => [z.name, z.lat, z.lng, z.desc]);
      downloadCSV(headers, rows, `${managerMine.name.replace(/\s+/g, "_")}_GIS_Zones.csv`);
      toast.success("Exported mine operational zones CSV");
    } else {
      const headers = ["Mine ID", "Name", "Location", "Latitude", "Longitude", "Compliance", "Risk Status", "Workers"];
      const rows = allMinesGisData.map((m) => [
        m.id,
        m.name,
        m.location,
        m.latitude,
        m.longitude,
        `${m.complianceScore}%`,
        m.riskStatus,
        m.workersOnSite,
      ]);
      downloadCSV(headers, rows, "CoalGov360_All_Mines_GIS.csv");
      toast.success("Exported national mine spatial data CSV");
    }
  };

  return (
    <>
      <Header />
      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Page Header Banner */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Geographic Information System</h1>
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-300">
                Live Spatial Layer
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isMineManager
                ? `Operational zoning, satellite monitoring, and hazard boundaries for ${managerMine?.name || "your mine"}.`
                : "National spatial telemetry, multi-mine risk boundaries, and environmental geographic mapping."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCoordinates}
              className="gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* GIS Map Canvas with Floating Layer Control Bar */}
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
          {/* Map Layer Toolbar */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-1.5 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-md">
            <Button
              variant={activeLayers.satellite ? "default" : "ghost"}
              size="sm"
              className={`h-8 text-xs font-semibold ${
                activeLayers.satellite
                  ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                  : "text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => toggleLayer("satellite")}
            >
              🛰️ Satellite
            </Button>

            <Button
              variant={activeLayers.mines ? "secondary" : "ghost"}
              size="sm"
              className={`h-8 text-xs ${activeLayers.mines ? "bg-gray-200 dark:bg-gray-800 font-semibold" : "text-gray-600 dark:text-gray-400"}`}
              onClick={() => toggleLayer("mines")}
            >
              Mine Bounds
            </Button>

            <Button
              variant={activeLayers.zones ? "secondary" : "ghost"}
              size="sm"
              className={`h-8 text-xs ${activeLayers.zones ? "bg-gray-200 dark:bg-gray-800 font-semibold" : "text-gray-600 dark:text-gray-400"}`}
              onClick={() => toggleLayer("zones")}
            >
              Safety Sectors
            </Button>
          </div>

          {/* Interactive Leaflet Map Instance */}
          <div className="h-[540px] w-full">
            {isMineManager ? (
              <InteractiveMap
                mines={[]}
                singleMineMode={true}
                center={[23.6102, 85.2799]}
                zonesList={LOCAL_MINE_A_ZONES}
                activeLayers={activeLayers}
              />
            ) : (
              <InteractiveMap
                mines={allMinesGisData}
                activeLayers={activeLayers}
              />
            )}
          </div>
        </div>

        {/* SINGLE-MINE DETAILS (MINE MANAGER) */}
        {isMineManager && (
          <div className="space-y-6">
            {/* Operational Zones Banner */}
            <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-yellow-600" />
                      {managerMine?.name || "Mine A (Jharia Opencast Colliery)"}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                      <span>Coordinates: 23.6102° N, 85.2799° E</span>
                      <span>·</span>
                      <span>Elevation: 320m AMSL</span>
                      <span>·</span>
                      <span>Location: {managerMine?.location || "Jharkhand"}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="bg-gray-50 dark:bg-gray-800/60 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
                      <span className="text-gray-400 font-medium">Compliance:</span>{" "}
                      <span className="font-bold text-gray-900 dark:text-white">
                        {managerMine?.compliance_score || 88}%
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/60 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
                      <span className="text-gray-400 font-medium">Workers:</span>{" "}
                      <span className="font-bold text-gray-900 dark:text-white">
                        {managerMine?.workers_on_site || 342} on site
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-gray-400 mr-1">
                    Mapped Production Sectors:
                  </span>
                  {LOCAL_MINE_A_ZONES.map((z) => (
                    <Badge
                      key={z.name}
                      variant="outline"
                      className="text-xs font-medium bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    >
                      <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: z.color }}></span>
                      {z.name} — {z.desc.split("&")[0].trim()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* MULTI-MINE CARDS LIST (ADMIN, CORPORATE, INSPECTOR) */}
        {!isMineManager && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allMinesGisData.map((mine) => (
              <Card key={mine.id} className="hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-yellow-600 shrink-0" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-50">{mine.name}</h3>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{mine.location}</p>
                      <p className="text-xs text-gray-400 font-mono mt-1">
                        {mine.latitude.toFixed(4)}° N, {mine.longitude.toFixed(4)}° E
                      </p>
                    </div>
                    <Badge className={`${getRiskColor(mine.riskStatus)} shrink-0`}>
                      {mine.riskStatus}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}