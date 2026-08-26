"use client";

import { useState, useEffect } from "react";
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
import { complianceService } from "@/lib/complianceService";
import { inspectionService } from "@/lib/inspectionService";
import { downloadCSV } from "@/lib/exportUtils";
import type { MineGisData } from "@/components/gis/InteractiveMap";

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
    )
  }
);

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

export default function GISPage() {
  const [mines, setMines] = useState<MineGisData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  
  // Toggles for map layers
  const [activeLayers, setActiveLayers] = useState({
    mines: true,
    zones: true,
    satellite: false,
  });

  const loadMinesData = () => {
    const list = complianceService.getMines().map(mine => {
      const coords = inspectionService.getFallbackCoordinates(mine.id);
      return {
        ...mine,
        latitude: coords.lat,
        longitude: coords.lng
      };
    });
    setMines(list);
  };

  useEffect(() => {
    loadMinesData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    const toastId = toast.loading("Recalculating geographic coordinates...");
    setTimeout(() => {
      loadMinesData();
      setIsRefreshing(false);
      toast.dismiss(toastId);
      toast.success("GIS map refreshed successfully!");
    }, 1000);
  };

  const handleExport = () => {
    try {
      const headers = [
        "Mine ID", 
        "Mine Name", 
        "State Location", 
        "Latitude", 
        "Longitude", 
        "Risk Status", 
        "Risk Score", 
        "Compliance Score", 
        "Active Workers", 
        "Mine Type", 
        "Status"
      ];
      const rows = mines.map(m => [
        m.id,
        m.name,
        m.location,
        m.latitude,
        m.longitude,
        m.riskStatus,
        m.riskScore,
        m.complianceScore,
        m.workersOnSite,
        m.type,
        m.status
      ]);
      const dateStr = new Date().toISOString().split("T")[0];
      downloadCSV(headers, rows, `coalgov360-gis-mines-${dateStr}.csv`);
      toast.success("GIS coordinates report exported successfully!");
    } catch (e) {
      toast.error("Unable to export map data.");
    }
  };

  return (
    <>
      <Header />
      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Layers className="h-6 w-6 text-yellow-600" />
              GIS Mapping
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Interactive map with mine locations, risk zones, and satellite imagery
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Export Map
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowLayersMenu(!showLayersMenu)}
              className={showLayersMenu ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 border-yellow-200" : ""}
            >
              <Filter className="mr-2 h-4 w-4" /> Layers
            </Button>
            <Button 
              size="sm" 
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Map Container Card */}
        <Card className="relative overflow-hidden border border-gray-200 dark:border-gray-800 shadow-md">
          <div className="relative">
            {/* Custom Interactive Leaflet Map Layer */}
            <div className="h-[500px] w-full">
              <InteractiveMap mines={mines} activeLayers={activeLayers} />
            </div>

            {/* Floating Map Layers Control menu */}
            {showLayersMenu && (
              <div className="absolute right-4 top-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xl z-20 w-48 font-sans">
                <p className="text-xs font-semibold uppercase text-gray-400 mb-2.5">Map Layers</p>
                <div className="space-y-3 text-sm">
                  <label className="flex items-center gap-2.5 cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={activeLayers.mines}
                      onChange={(e) => setActiveLayers(prev => ({ ...prev, mines: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-700 text-yellow-600 focus:ring-yellow-500 h-4 w-4 accent-yellow-600"
                    />
                    Mine Locations
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={activeLayers.zones}
                      onChange={(e) => setActiveLayers(prev => ({ ...prev, zones: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-700 text-yellow-600 focus:ring-yellow-500 h-4 w-4 accent-yellow-600"
                    />
                    Risk Zones
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={activeLayers.satellite}
                      onChange={(e) => setActiveLayers(prev => ({ ...prev, satellite: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-700 text-yellow-600 focus:ring-yellow-500 h-4 w-4 accent-yellow-600"
                    />
                    Satellite Imagery
                  </label>
                </div>
              </div>
            )}

            {/* Map Legend Overlay */}
            <div className="absolute left-4 bottom-4 bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 rounded-2xl p-3 shadow-lg z-10 font-sans backdrop-blur">
              <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Risk Legend</p>
              <div className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span> Critical</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span> High Risk</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shrink-0"></span> At Risk</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0"></span> Low Risk</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0"></span> Safe</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Dynamic Mine Info Cards List */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mines.map((mine) => (
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
      </main>
    </>
  );
}