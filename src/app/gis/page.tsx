"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Layers,
  MapPin,
  Filter,
  Download,
  RefreshCw,
  Loader2,
  Camera,
  Plus,
  Calendar,
  Eye,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useMines } from "@/hooks/useMines";
import { useSession } from "@/hooks/useSession";
import { complianceService } from "@/lib/complianceService";
import { inspectionService, defaultZones } from "@/lib/inspectionService";
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

interface SitePhoto {
  id: string;
  mineId: string;
  title: string;
  zone: string;
  date: string;
  imageUrl: string;
  description: string;
}

// Curated high-resolution industrial mining site photographs
const DEFAULT_PHOTOS: SitePhoto[] = [
  {
    id: "photo-1",
    mineId: "default",
    title: "Ventilation Airflow & Fan Station 1",
    zone: "Zone A",
    date: "2026-09-18",
    imageUrl: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1200&q=80",
    description: "Primary intake fan housing inspected for vibration telemetry, bearing temperature, and dust accumulation.",
  },
  {
    id: "photo-2",
    mineId: "default",
    title: "Main Incline Haul Ramp & Sprinkler Corridor",
    zone: "Zone B",
    date: "2026-09-15",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    description: "Grading and high-pressure dust suppression mist nozzles verified along the primary transport incline ramp.",
  },
  {
    id: "photo-3",
    mineId: "default",
    title: "Coal Face Seam Extraction Bench",
    zone: "Zone C",
    date: "2026-09-10",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    description: "Bench stabilization and rock bolt integrity verification across open face seam extraction bench.",
  },
  {
    id: "photo-4",
    mineId: "default",
    title: "Stockpile Storage & Rail Loading Terminal",
    zone: "Zone D",
    date: "2026-09-08",
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
    description: "Perimeter water misting curtains and conveyor tripper operating within standard environmental clearance limits.",
  },
];

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
  const { session } = useSession();
  const isMineManager = session?.role === "MINE_MANAGER";
  const canUploadPhotos = session?.role === "MINE_MANAGER" || session?.role === "ADMIN" || session?.role === "INSPECTOR";
  const { data: dbMines = [], isLoading, refetch } = useMines();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);

  // Toggles for map layers: Default satellite to true for MINE_MANAGER so they get satellite aerial view
  const [activeLayers, setActiveLayers] = useState({
    mines: true,
    zones: true,
    satellite: false,
  });

  // MINE_MANAGER Site Photos state
  const [photos, setPhotos] = useState<SitePhoto[]>(DEFAULT_PHOTOS);
  const [selectedZoneTab, setSelectedZoneTab] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<SitePhoto | null>(null);

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadZone, setUploadZone] = useState("Zone A");
  const [uploadDate, setUploadDate] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadImageSrc, setUploadImageSrc] = useState("");
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  // Manager's specific mine
  const managerMine = useMemo(() => {
    if (!isMineManager) return null;
    return dbMines.find((m) => m.id === session?.mineId) || dbMines[0] || null;
  }, [isMineManager, dbMines, session]);

  const managerZones = useMemo(() => {
    if (managerMine?.zones && managerMine.zones.length > 0) {
      return managerMine.zones;
    }
    return defaultZones;
  }, [managerMine]);

  // Load persisted photos from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storageKey = `suraksha_site_photos_${session?.mineId || "default"}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPhotos(parsed);
          }
        } catch {
          // fallback
        }
      }
    }
    setUploadDate(new Date().toISOString().split("T")[0]);
  }, [session]);

  const handleSavePhotos = (newList: SitePhoto[]) => {
    setPhotos(newList);
    if (typeof window !== "undefined") {
      const storageKey = `suraksha_site_photos_${session?.mineId || "default"}`;
      localStorage.setItem(storageKey, JSON.stringify(newList));
    }
  };

  const handleOpenUpload = () => {
    setUploadTitle("");
    setUploadZone(managerZones[0] || "Zone A");
    setUploadDate(new Date().toISOString().split("T")[0]);
    setUploadDescription("");
    setUploadImageSrc("");
    setUploadErrors({});
    setIsUploadOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      setUploadImageSrc(result);
      if (uploadErrors.image) {
        setUploadErrors((prev) => ({ ...prev, image: "" }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!uploadTitle.trim()) errs.title = "Photo caption/title is required";
    if (!uploadImageSrc) errs.image = "Please choose an image file";
    if (!uploadZone) errs.zone = "Zone is required";

    if (Object.keys(errs).length > 0) {
      setUploadErrors(errs);
      toast.error("Please fill in required photo details.");
      return;
    }

    const newPhoto: SitePhoto = {
      id: `photo-${Date.now()}`,
      mineId: session?.mineId || "default",
      title: uploadTitle.trim(),
      zone: uploadZone,
      date: uploadDate || new Date().toISOString().split("T")[0],
      imageUrl: uploadImageSrc,
      description: uploadDescription.trim() || "Operational audit photograph logged by Mine Manager.",
    };

    const updated = [newPhoto, ...photos];
    handleSavePhotos(updated);
    setIsUploadOpen(false);
    toast.success("Site photo added to gallery successfully!");
  };

  const filteredPhotos = useMemo(() => {
    if (selectedZoneTab === "all") return photos;
    return photos.filter((p) => p.zone.toLowerCase().includes(selectedZoneTab.toLowerCase()));
  }, [photos, selectedZoneTab]);

  const allMinesGisData: MineGisData[] = useMemo(() => {
    if (dbMines && dbMines.length > 0) {
      return dbMines.map((m) => {
        const coords = stateCoords[m.location] || inspectionService.getFallbackCoordinates(m.id);
        return {
          id: m.id,
          name: m.name,
          location: m.location,
          riskScore: m.risk_score,
          riskStatus: m.risk_status,
          complianceScore: m.compliance_score,
          lastInspection: m.last_inspection || "2026-08-15",
          pendingViolations: 0,
          workersOnSite: m.workers_on_site,
          type: m.type,
          status: m.status,
          latitude: coords.lat,
          longitude: coords.lng,
        };
      });
    }
    return complianceService.getMines().map((mine) => {
      const coords = inspectionService.getFallbackCoordinates(mine.id);
      return {
        ...mine,
        latitude: coords.lat,
        longitude: coords.lng,
      };
    });
  }, [dbMines]);

  // For single mine mode, scope GIS data strictly to the manager's mine
  const singleMineGisData = useMemo(() => {
    if (!managerMine) return allMinesGisData.slice(0, 1);
    const coords = stateCoords[managerMine.location] || inspectionService.getFallbackCoordinates(managerMine.id);
    return [
      {
        id: managerMine.id,
        name: managerMine.name,
        location: managerMine.location,
        riskScore: managerMine.risk_score,
        riskStatus: managerMine.risk_status,
        complianceScore: managerMine.compliance_score,
        lastInspection: managerMine.last_inspection || "2026-08-15",
        pendingViolations: 0,
        workersOnSite: managerMine.workers_on_site,
        type: managerMine.type,
        status: managerMine.status,
        latitude: coords.lat,
        longitude: coords.lng,
      },
    ];
  }, [managerMine, allMinesGisData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const toastId = toast.loading("Recalculating geographic coordinates...");
    try {
      await refetch();
      toast.dismiss(toastId);
      toast.success("GIS data refreshed successfully!");
    } catch {
      toast.dismiss(toastId);
      toast.error("Failed to refresh GIS data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    try {
      const headers = ["ID", "Name", "Location", "Latitude", "Longitude", "Risk Status", "Risk Score"];
      const rows = (isMineManager ? singleMineGisData : allMinesGisData).map((m) => [
        m.id,
        m.name,
        m.location,
        m.latitude,
        m.longitude,
        m.riskStatus,
        m.riskScore,
      ]);
      const dateStr = new Date().toISOString().split("T")[0];
      downloadCSV(headers, rows, `suraksha-gis-${dateStr}.csv`);
      toast.success("GIS report exported successfully!");
    } catch {
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
              GIS & Operational Mapping
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isMineManager
                ? `High-resolution satellite GIS survey, operational zones, and site imagery for ${managerMine?.name || session?.mineName || "your mine"}`
                : "Interactive national map with mine locations, risk zones, and satellite imagery"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canUploadPhotos && (
              <Button
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                onClick={handleOpenUpload}
              >
                <Plus className="mr-2 h-4 w-4" /> Upload Site Photo
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLayersMenu(!showLayersMenu)}
              className={showLayersMenu ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 border-yellow-200" : ""}
            >
              <Filter className="mr-2 h-4 w-4" /> Map Layers
            </Button>
            <Button
              size="sm"
              variant="outline"
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

        {/* Interactive GIS Map Container */}
        <Card className="relative overflow-hidden border border-gray-200 dark:border-gray-800 shadow-md mb-6">
          <div className="relative">
            {/* Custom Interactive Leaflet Map Layer */}
            <div className="h-[480px] w-full">
              <InteractiveMap
                mines={isMineManager ? singleMineGisData : allMinesGisData}
                activeLayers={activeLayers}
                singleMineMode={isMineManager}
                center={isMineManager ? [23.6102, 85.2799] : undefined}
                zoom={isMineManager ? 14 : 5}
                zonesList={isMineManager ? LOCAL_MINE_A_ZONES : []}
              />
            </div>

            {/* Floating Map Layers Control menu */}
            {showLayersMenu && (
              <div className="absolute right-4 top-4 bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xl z-20 w-52 font-sans backdrop-blur">
                <p className="text-xs font-semibold uppercase text-gray-400 mb-2.5">Map Layers</p>
                <div className="space-y-3 text-sm">
                  <label className="flex items-center gap-2.5 cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={activeLayers.satellite}
                      onChange={(e) => setActiveLayers((prev) => ({ ...prev, satellite: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-700 text-yellow-600 focus:ring-yellow-500 h-4 w-4 accent-yellow-600"
                    />
                    Satellite Aerial Imagery
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={activeLayers.zones}
                      onChange={(e) => setActiveLayers((prev) => ({ ...prev, zones: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-700 text-yellow-600 focus:ring-yellow-500 h-4 w-4 accent-yellow-600"
                    />
                    {isMineManager ? "Local Pit Zones" : "Macro Risk Zones"}
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={activeLayers.mines}
                      onChange={(e) => setActiveLayers((prev) => ({ ...prev, mines: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-700 text-yellow-600 focus:ring-yellow-500 h-4 w-4 accent-yellow-600"
                    />
                    Mine Location Marker
                  </label>
                </div>
              </div>
            )}

            {/* Map Legend Overlay */}
            <div className="absolute left-4 bottom-4 bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 rounded-2xl p-3 shadow-lg z-10 font-sans backdrop-blur">
              <p className="text-xs font-semibold uppercase text-gray-400 mb-2">
                {isMineManager ? "Operational Zones" : "Risk Legend"}
              </p>
              {isMineManager ? (
                <div className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span> Zone A (Ventilation)</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shrink-0"></span> Zone B (Haul Ramp)</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span> Zone C (Extraction Face)</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0"></span> Zone D (Stockpile Yard)</div>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span> Critical</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span> High Risk</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shrink-0"></span> At Risk</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0"></span> Low Risk</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0"></span> Safe</div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* SITE PHOTO GALLERY & OPERATIONAL PROFILE */}
        <div className="space-y-6">
            {/* Operational Profile Card */}
            <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-yellow-600 shrink-0" />
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {managerMine?.name || session?.mineName || "Mine A (Jharkhand)"}
                      </h2>
                      <Badge className={getRiskColor(managerMine?.risk_status || "medium")}>
                        {managerMine?.risk_status?.toUpperCase() || "SAFE"}
                      </Badge>
                    </div>
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

            {/* Gallery Header & Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-bold">Site Audit Imagery Gallery</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedZoneTab("all")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    selectedZoneTab === "all"
                      ? "bg-yellow-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  All Zones ({photos.length})
                </button>
                {managerZones.map((z: string) => (
                  <button
                    key={z}
                    onClick={() => setSelectedZoneTab(z)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      selectedZoneTab === z
                        ? "bg-yellow-600 text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Cards Grid */}
            {filteredPhotos.length === 0 ? (
              <Card className="p-12 text-center text-gray-500 border-dashed border-gray-200 dark:border-gray-800">
                <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-800 dark:text-gray-200">No site photos for this zone</p>
                <p className="text-xs text-gray-500 mt-1">Upload a photo to start tracking visual audit logs.</p>
                {canUploadPhotos && (
                  <Button size="sm" className="mt-4 bg-yellow-600 text-white" onClick={handleOpenUpload}>
                    <Plus className="h-4 w-4 mr-1.5" /> Upload Photo
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {filteredPhotos.map((photo) => (
                  <Card
                    key={photo.id}
                    className="overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col justify-between hover:shadow-md transition-shadow group"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <Badge className="bg-black/75 backdrop-blur-md text-white border-0 text-xs">
                          {photo.zone}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="text-xs bg-black/75 backdrop-blur-md text-gray-200 px-2.5 py-1 rounded-full flex items-center gap-1 font-mono">
                          <Calendar className="h-3 w-3" /> {photo.date}
                        </span>
                      </div>
                    </div>

                    <CardContent className="p-4 flex-1">
                      <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1">
                        {photo.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed line-clamp-2">
                        {photo.description}
                      </p>
                    </CardContent>

                    <div className="p-4 pt-0 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => setPreviewPhoto(photo)}
                      >
                        <Eye className="h-3.5 w-3.5" /> View Photo
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

        {/* MULTI-MINE CARDS LIST (ADMIN, CORPORATE, INSPECTOR, AUTHORITY) */}
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
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                >
                  {managerZones.map((z: string) => (
                    <option key={z} value={z}>{z}</option>
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
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
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
                className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-yellow-50 file:text-yellow-700 dark:file:bg-yellow-950/30 dark:file:text-yellow-400 hover:file:bg-yellow-100"
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
                className="w-full min-h-[60px] rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
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
                  <DialogTitle className="text-lg font-bold">{previewPhoto.title}</DialogTitle>
                  <Badge className="bg-yellow-600 text-white">{previewPhoto.zone}</Badge>
                </div>
                <DialogDescription className="text-xs text-gray-500">
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