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
  Camera,
  Eye,
  Plus,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMines } from "@/hooks/useMines";
import { useSession } from "@/hooks/useSession";
import { complianceService } from "@/lib/complianceService";
import { defaultZones } from "@/lib/inspectionService";
import { downloadCSV } from "@/lib/exportUtils";
import type { MineGisData, ZoneGisData } from "@/components/gis/InteractiveMap";

interface SitePhoto {
  id: string;
  mineId: string;
  title: string;
  location: string;
  zone: string;
  date: string;
  imageUrl: string;
  description: string;
}

// Realistic Indian coal mine photography (Jharia, Talcher, Korba, Raniganj)
const INDIAN_MINE_SITE_PHOTOS: SitePhoto[] = [
  {
    id: "in-photo-1",
    mineId: "default",
    title: "Jharia Opencast Colliery — HEMM Excavation Bench",
    location: "Dhanbad, Jharkhand",
    zone: "Zone C",
    date: "2026-09-19",
    imageUrl: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1200&q=80",
    description: "Heavy Earth Moving Machinery (HEMM) shovel-dumper loading at the active coal bench with slope stability radar in place.",
  },
  {
    id: "in-photo-2",
    mineId: "default",
    title: "Talcher Coalfields — Haul Road Dust Suppression Mist",
    location: "Angul, Odisha",
    zone: "Zone B",
    date: "2026-09-17",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    description: "Continuous pressurized misting cannons and water tankers suppressing airborne particulate dust along the primary heavy transport incline.",
  },
  {
    id: "in-photo-3",
    mineId: "default",
    title: "Korba Colliery — Rail Wagon Loadout & Rapid Stockpile",
    location: "Korba, Chhattisgarh",
    zone: "Zone D",
    date: "2026-09-14",
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
    description: "Automated silo wagon loading terminal with real-time gross weight calibration and environmental perimeter barriers.",
  },
  {
    id: "in-photo-4",
    mineId: "default",
    title: "Raniganj Colliery — Underground Seam Gallery & Ventilation",
    location: "Asansol, West Bengal",
    zone: "Zone A",
    date: "2026-09-11",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    description: "Intake airway ventilation shaft and steel arch prop support structure inspected under CMR 2017 Chapter IX safety norms.",
  },
];

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

  // Photos state for Mine Manager
  const [photos, setPhotos] = useState<SitePhoto[]>(INDIAN_MINE_SITE_PHOTOS);
  const [selectedZoneTab, setSelectedZoneTab] = useState("all");
  const [previewPhoto, setPreviewPhoto] = useState<SitePhoto | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadZone, setUploadZone] = useState("Zone A");
  const [uploadDate, setUploadDate] = useState("2026-09-23");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadImageSrc, setUploadImageSrc] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!uploadTitle.trim()) errs.title = "Please provide a photo caption";
    if (!uploadImageSrc) errs.image = "Please select an image";
    if (Object.keys(errs).length > 0) {
      setUploadErrors(errs);
      return;
    }

    const newPhoto: SitePhoto = {
      id: `photo-${Date.now()}`,
      mineId: managerMine?.id || "default",
      title: uploadTitle,
      location: managerMine?.location || "Jharkhand",
      zone: uploadZone,
      date: uploadDate || new Date().toISOString().split("T")[0],
      imageUrl: uploadImageSrc || "",
      description: uploadDescription || "Audited during scheduled colliery inspection.",
    };

    setPhotos((prev) => [newPhoto, ...prev]);
    setIsUploadOpen(false);
    toast.success("Site audit photo uploaded and geo-tagged successfully!");
  };

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
            {/* SITE AUDIT IMAGERY GALLERY FOR MINE MANAGER */}
            <Card className="border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <Camera className="h-5 w-5 text-yellow-600" />
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        Site Audit Imagery Gallery — Indian Collieries
                      </h2>
                      <Badge className="bg-yellow-600/10 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800 text-xs">
                        Geo-Tagged Photographic Evidence
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      High-resolution photographic documentation from operational sectors, pit benches, ventilation shafts, and dispatch sidings.
                    </p>
                  </div>

                  <Button
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white gap-1.5 self-start sm:self-auto"
                    onClick={() => {
                      setUploadImageSrc(null);
                      setUploadTitle("");
                      setUploadDescription("");
                      setUploadErrors({});
                      setIsUploadOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" /> Upload Site Photo
                  </Button>
                </div>

                {/* Zone Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mb-6 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-semibold text-gray-400 mr-2">Filter by Sector:</span>
                  <button
                    onClick={() => setSelectedZoneTab("all")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedZoneTab === "all"
                        ? "bg-yellow-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    All Sectors ({photos.length})
                  </button>
                  {LOCAL_MINE_A_ZONES.map((z) => {
                    const count = photos.filter((p) => p.zone === z.name).length;
                    return (
                      <button
                        key={z.name}
                        onClick={() => setSelectedZoneTab(z.name)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          selectedZoneTab === z.name
                            ? "bg-yellow-600 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                        }`}
                      >
                        {z.name} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Photos Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {photos
                    .filter((p) => selectedZoneTab === "all" || p.zone === selectedZoneTab)
                    .map((photo) => (
                      <div
                        key={photo.id}
                        className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                      >
                        <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.imageUrl}
                            alt={photo.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <Badge className="absolute top-2 left-2 bg-black/70 text-white text-[10px] backdrop-blur-xs font-medium">
                            {photo.zone}
                          </Badge>
                          <Badge className="absolute bottom-2 right-2 bg-yellow-600/90 text-white text-[10px] backdrop-blur-xs">
                            {photo.location}
                          </Badge>
                        </div>

                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1">
                              <Calendar className="h-3 w-3" />
                              <span>{photo.date}</span>
                            </div>
                            <h3 className="font-bold text-xs text-gray-900 dark:text-gray-100 line-clamp-1">
                              {photo.title}
                            </h3>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                              {photo.description}
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewPhoto(photo)}
                            className="mt-3 w-full text-xs font-medium gap-1 h-7 border-gray-200 dark:border-gray-800 hover:bg-yellow-50 dark:hover:bg-yellow-950/30"
                          >
                            <Eye className="h-3 w-3" /> Inspect Photo
                          </Button>
                        </div>
                      </div>
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

      {/* Upload Site Photo Modal Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={(open) => !open && setIsUploadOpen(false)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-950 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Upload Mine Site Photo</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              Add operational photographs with zone classification and audit notes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="upload-title" className="text-sm font-medium">Photo Caption / Title *</Label>
              <Input
                id="upload-title"
                placeholder="e.g. Ventilation Intake Fan 2"
                value={uploadTitle}
                onChange={(e) => {
                  setUploadTitle(e.target.value);
                  if (uploadErrors.title) setUploadErrors((p) => ({ ...p, title: "" }));
                }}
              />
              {uploadErrors.title && <p className="text-xs text-red-600 font-medium">{uploadErrors.title}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="upload-zone" className="text-sm font-medium">Zone Location *</Label>
                <select
                  id="upload-zone"
                  value={uploadZone}
                  onChange={(e) => setUploadZone(e.target.value)}
                  className="h-9 w-full rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[2px] focus-visible:ring-yellow-600/20"
                >
                  {LOCAL_MINE_A_ZONES.map((z) => (
                    <option key={z.name} value={z.name}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="upload-date" className="text-sm font-medium">Date Taken</Label>
                <input
                  id="upload-date"
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="h-9 w-full rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[2px] focus-visible:ring-yellow-600/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="upload-file" className="text-sm font-medium">Select Image File *</Label>
              <input
                id="upload-file"
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="h-9 w-full rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-yellow-50 file:text-yellow-700 dark:file:bg-yellow-950/30 dark:file:text-yellow-400 hover:file:bg-yellow-100"
              />
              {uploadErrors.image && <p className="text-xs text-red-600 font-medium">{uploadErrors.image}</p>}
            </div>

            {uploadImageSrc && (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={uploadImageSrc} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="upload-desc" className="text-sm font-medium">Description & Findings</Label>
              <textarea
                id="upload-desc"
                rows={2}
                placeholder="Safety or operational observations..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                className="w-full min-h-[60px] rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[2px] focus-visible:ring-yellow-600/20"
              />
            </div>

            <DialogFooter className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                Upload Photo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Dialog */}
      <Dialog open={!!previewPhoto} onOpenChange={(open) => !open && setPreviewPhoto(null)}>
        <DialogContent className="sm:max-w-2xl bg-white dark:bg-gray-950 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
          {previewPhoto && (
            <div>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-lg font-bold">{previewPhoto.title}</DialogTitle>
                    <p className="text-xs text-muted-foreground">{previewPhoto.location}</p>
                  </div>
                  <Badge className="bg-yellow-600 text-white">{previewPhoto.zone}</Badge>
                </div>
                <DialogDescription className="text-xs text-gray-500 mt-1">
                  Logged on {previewPhoto.date}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 rounded-xl overflow-hidden aspect-video w-full bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewPhoto.imageUrl}
                  alt={previewPhoto.title}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Operational Observation</p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {previewPhoto.description}
                </p>
              </div>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setPreviewPhoto(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}