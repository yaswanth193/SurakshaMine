"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Plus,
  Search,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Download,
  Filter,
  Flame,
  Droplets,
  Wind,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import { incidentService, type IncidentItem } from "@/lib/incidentService";
import { complianceService, type Mine } from "@/lib/complianceService";
import { downloadCSV } from "@/lib/exportUtils";
import { inspectionService, mineZones, defaultZones } from "@/lib/inspectionService";

const getStatusBadge = (status: string) => {
  const styles = {
    reported: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 animate-pulse",
    investigating: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    "action-required": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    closed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };
  return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
};

const getSeverityBadge = (severity: string) => {
  const styles = {
    critical: "bg-red-700 text-white",
    high: "bg-red-600 text-white",
    medium: "bg-yellow-500 text-white",
    low: "bg-green-500 text-white",
  };
  return styles[severity as keyof typeof styles] || "bg-gray-500 text-white";
};

const getTypeIcon = (type: string) => {
  const icons = {
    fire: Flame,
    water: Droplets,
    gas: Wind,
    mechanical: AlertCircle,
    injury: Users,
    "safety incident": Users,
    "near miss": AlertTriangle,
    "environmental incident": Droplets,
    "operational incident": AlertCircle,
    "labour incident": Users,
    "other": AlertTriangle
  };
  const normalized = type.toLowerCase();
  return icons[normalized as keyof typeof icons] || AlertTriangle;
};

export default function IncidentsPage() {
  const [items, setItems] = useState<IncidentItem[]>([]);
  const [mines, setMines] = useState<Mine[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [incidentType, setIncidentType] = useState("Safety Incident");
  const [mineId, setMineId] = useState("");
  const [zoneName, setZoneName] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [severity, setSeverity] = useState<any>("medium");
  const [description, setDescription] = useState("");
  const [reportedBy, setReportedBy] = useState("Admin Kumar");
  const [immediateAction, setImmediateAction] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [evidenceName, setEvidenceName] = useState("");

  // Geolocation state
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locationSource, setLocationSource] = useState<"GPS" | "Fallback" | undefined>(undefined);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setItems(incidentService.getIncidents());
    setMines(complianceService.getMines());
    
    setIncidentDate(new Date().toISOString().split("T")[0]);
    setIncidentTime(new Date().toTimeString().slice(0, 5));
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIncidentDate(new Date().toISOString().split("T")[0]);
    setIncidentTime(new Date().toTimeString().slice(0, 5));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTitle("");
    setIncidentType("Safety Incident");
    setMineId("");
    setZoneName("");
    setDescription("");
    setSeverity("medium");
    setImmediateAction("");
    setRootCause("");
    setEvidenceName("");
    setLatitude(undefined);
    setLongitude(undefined);
    setLocationSource(undefined);
    setGpsStatus("");
    setErrors({});
  };

  const handleCaptureLocation = () => {
    if (!mineId) {
      toast.error("Please select a Mine first to capture GPS coordinates.");
      setErrors(prev => ({ ...prev, mineId: "Select mine before capturing location" }));
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Location services are not supported by this browser.");
      setGpsStatus("Browser geolocation unsupported. Fallback coordinates assigned.");
      // Fallback
      const coords = inspectionService.getFallbackCoordinates(mineId);
      setLatitude(coords.lat);
      setLongitude(coords.lng);
      setLocationSource("Fallback");
      return;
    }

    setGpsLoading(true);
    setGpsStatus("Querying satellite coordinates...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationSource("GPS");
        setGpsLoading(false);
        setGpsStatus(`GPS capture success: ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`);
        toast.success("GPS location captured successfully!");
      },
      (error) => {
        setGpsLoading(false);
        const coords = inspectionService.getFallbackCoordinates(mineId);
        setLatitude(coords.lat);
        setLongitude(coords.lng);
        setLocationSource("Fallback");

        let reason = "Fallback coordinates assigned.";
        if (error.code === error.PERMISSION_DENIED) {
          reason = "Location permission denied. Fallback coordinates assigned.";
          toast.warning("Location access denied. Using mine coordinates.");
        } else {
          reason = "GPS sensor error. Fallback coordinates assigned.";
          toast.error("Failed to query GPS sensor.");
        }
        setGpsStatus(reason);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!mineId) newErrors.mineId = "Mine selection is required";
    if (!zoneName) newErrors.zoneName = "Zone Location is required";
    if (!description.trim()) newErrors.description = "Incident description is required";
    if (!reportedBy.trim()) newErrors.reportedBy = "Reporter name is required";
    if (!incidentDate) newErrors.incidentDate = "Date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }

    let finalLat = latitude;
    let finalLng = longitude;
    let finalSource = locationSource;

    if (finalLat === undefined || finalLng === undefined) {
      const coords = inspectionService.getFallbackCoordinates(mineId);
      finalLat = coords.lat;
      finalLng = coords.lng;
      finalSource = "Fallback";
    }

    const mineObj = mines.find(m => m.id === mineId);
    const mineName = mineObj ? mineObj.name : "Unknown Mine";

    const finalTitle = title.trim() || `${incidentType} at ${mineName}`;

    incidentService.createIncident({
      title: finalTitle,
      type: incidentType,
      mineId,
      mineName,
      zoneName,
      incidentDate,
      incidentTime: incidentTime || "12:00",
      severity,
      description,
      reportedBy,
      immediateAction: immediateAction || undefined,
      rootCause: rootCause || undefined,
      evidenceName: evidenceName || undefined,
      latitude: finalLat,
      longitude: finalLng,
      locationSource: finalSource
    });

    setItems(incidentService.getIncidents());
    toast.success("Incident logged successfully!");
    handleCloseModal();
  };

  const handleExport = () => {
    try {
      const headers = [
        "Incident ID",
        "Incident Title",
        "Incident Type",
        "Mine Name",
        "Zone Location",
        "Report Date",
        "Time",
        "Severity",
        "Status",
        "Reported By",
        "Description",
        "Immediate Action Taken",
        "Root Cause",
        "Latitude",
        "Longitude",
        "GPS Source"
      ];
      const rows = filteredData.map(item => [
        item.id,
        item.title,
        item.type,
        item.mineName,
        item.zoneName,
        item.incidentDate,
        item.incidentTime,
        item.severity,
        item.status,
        item.reportedBy,
        item.description,
        item.immediateAction || "",
        item.rootCause || "",
        item.latitude || "",
        item.longitude || "",
        item.locationSource || ""
      ]);
      const dateStr = new Date().toISOString().split("T")[0];
      downloadCSV(headers, rows, `coalgov360-incidents-${dateStr}.csv`);
      toast.success("Incident logs exported successfully!");
    } catch (e) {
      toast.error("Unable to export incident data.");
    }
  };

  const handleResolveIncident = (id: string) => {
    const parsed = localStorage.getItem("coalgov360_incidents") 
      ? JSON.parse(localStorage.getItem("coalgov360_incidents")!) as IncidentItem[]
      : [];
      
    const updated = parsed.map(item => {
      if (item.id === id) {
        return { ...item, status: "resolved" as const };
      }
      return item;
    });

    localStorage.setItem("coalgov360_incidents", JSON.stringify(updated));
    setItems(incidentService.getIncidents());
    toast.success("Incident status set to Resolved!");
  };

  const filteredData = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.mineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = incidentService.calculateStats(items);
  const mineZonesList = mineId ? (mineZones[mineId] || defaultZones) : defaultZones;

  return (
    <>
      <Header />
      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              Incident Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track and manage safety incidents across all mines
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={handleOpenModal}
            >
              <Plus className="mr-2 h-4 w-4" /> Report Incident
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Total Incidents</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="p-4">
              <p className="text-sm text-red-600">Active</p>
              <p className="text-2xl font-bold text-red-600">{stats.active}</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-4">
              <p className="text-sm text-green-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="p-4">
              <p className="text-sm text-red-600">High / Critical</p>
              <p className="text-2xl font-bold text-red-600">{stats.high}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search incidents by name, mine, type..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
        </div>

        {/* Incidents Table List */}
        <Card>
          <CardContent className="p-0">
            <div className="rounded-lg overflow-hidden">
              <div className="grid grid-cols-6 gap-4 bg-gray-50 p-3 text-xs font-medium text-gray-500 dark:bg-gray-800">
                <span className="col-span-2">Incident</span>
                <span>Type</span>
                <span>Severity</span>
                <span>Status</span>
                <span className="text-right">Action</span>
              </div>
              {filteredData.length === 0 ? (
                <div className="p-8 text-center text-gray-500 border-t">
                  No incidents logged matching criteria.
                </div>
              ) : (
                filteredData.map((item) => {
                  const Icon = getTypeIcon(item.type);
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-6 gap-4 border-t p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="col-span-2">
                        <p className="font-medium text-sm flex items-center gap-2">
                          <Icon className="h-4 w-4 text-yellow-600 shrink-0" />
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-yellow-600 shrink-0" /> {item.mineName} · <span className="font-semibold">{item.zoneName}</span>
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm capitalize">{item.type}</span>
                      </div>
                      <div className="flex items-center">
                        <Badge className={getSeverityBadge(item.severity)}>
                          {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <Badge className={getStatusBadge(item.status)}>
                          {item.status === "action-required" ? "Action Required" : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8"
                          onClick={() => setSelectedIncident(item)}
                        >
                          View
                        </Button>
                        {item.status !== "resolved" && item.status !== "closed" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-green-600"
                            onClick={() => handleResolveIncident(item.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Report Incident Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-lg rounded-2xl bg-white dark:bg-gray-950 p-6 border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Report Mine Incident</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Record safety, environmental, or mechanical anomalies.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="title" className="text-sm font-medium">Incident Name / Summary</Label>
              <Input
                id="title"
                placeholder="Brief summary (e.g. Belt Conveyor slip)"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="type" className="text-sm font-medium">Incident Type *</Label>
                <select
                  id="type"
                  value={incidentType}
                  onChange={e => setIncidentType(e.target.value)}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                >
                  <option value="Safety Incident">Safety Incident</option>
                  <option value="Near Miss">Near Miss</option>
                  <option value="Environmental Incident">Environmental Incident</option>
                  <option value="Operational Incident">Operational Incident</option>
                  <option value="Labour Incident">Labour Incident</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="mine" className="text-sm font-medium">Mine Name *</Label>
                <select
                  id="mine"
                  value={mineId}
                  onChange={e => {
                    setMineId(e.target.value);
                    setZoneName("");
                    if (errors.mineId) setErrors(prev => ({ ...prev, mineId: "" }));
                  }}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                >
                  <option value="">Select Mine</option>
                  {mines.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                {errors.mineId && <p className="text-xs text-red-600 font-medium">{errors.mineId}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="zone" className="text-sm font-medium">Zone Location *</Label>
                <select
                  id="zone"
                  value={zoneName}
                  disabled={!mineId}
                  onChange={e => {
                    setZoneName(e.target.value);
                    if (errors.zoneName) setErrors(prev => ({ ...prev, zoneName: "" }));
                  }}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Zone</option>
                  {mineZonesList.map((z: string) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
                {errors.zoneName && <p className="text-xs text-red-600 font-medium">{errors.zoneName}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="reportedBy" className="text-sm font-medium">Reported By *</Label>
                <Input
                  id="reportedBy"
                  value={reportedBy}
                  onChange={e => {
                    setReportedBy(e.target.value);
                    if (errors.reportedBy) setErrors(prev => ({ ...prev, reportedBy: "" }));
                  }}
                />
                {errors.reportedBy && <p className="text-xs text-red-600 font-medium">{errors.reportedBy}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="date" className="text-sm font-medium">Incident Date *</Label>
                <input
                  id="date"
                  type="date"
                  value={incidentDate}
                  onChange={e => {
                    setIncidentDate(e.target.value);
                    if (errors.incidentDate) setErrors(prev => ({ ...prev, incidentDate: "" }));
                  }}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                />
                {errors.incidentDate && <p className="text-xs text-red-600 font-medium">{errors.incidentDate}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="time" className="text-sm font-medium">Time</Label>
                <input
                  id="time"
                  type="time"
                  value={incidentTime}
                  onChange={e => setIncidentTime(e.target.value)}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
              <textarea
                id="description"
                rows={2}
                placeholder="Details of the anomaly..."
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors(prev => ({ ...prev, description: "" }));
                }}
                className="w-full min-h-[50px] rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
              />
              {errors.description && <p className="text-xs text-red-600 font-medium">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="immediateAction" className="text-sm font-medium">Immediate Action Taken</Label>
                <input
                  id="immediateAction"
                  placeholder="e.g. Power supply isolated"
                  value={immediateAction}
                  onChange={e => setImmediateAction(e.target.value)}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="rootCause" className="text-sm font-medium">Root Cause (Observed)</Label>
                <input
                  id="rootCause"
                  placeholder="e.g. Insulation degradation"
                  value={rootCause}
                  onChange={e => setRootCause(e.target.value)}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="severity" className="text-sm font-medium">Severity *</Label>
                <select
                  id="severity"
                  value={severity}
                  onChange={e => setSeverity(e.target.value as any)}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="space-y-1 flex flex-col justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  disabled={gpsLoading}
                  onClick={handleCaptureLocation}
                  className="h-9 rounded-4xl gap-1 text-xs"
                >
                  <Navigation className={`h-3 w-3 ${gpsLoading ? "animate-spin text-yellow-600" : ""}`} /> 
                  {gpsLoading ? "Capturing..." : "Capture Location"}
                </Button>
                {gpsStatus && <span className="text-[10px] text-gray-500 font-semibold truncate mt-1">{gpsStatus}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="evidence" className="text-sm font-medium">Evidence Photo</Label>
                <input
                  id="evidence"
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      setEvidenceName(e.target.files[0].name);
                    }
                  }}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-xs outline-none file:mr-3 file:py-0.5 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-yellow-50 file:text-yellow-700 dark:file:bg-yellow-950/30 dark:file:text-yellow-400 hover:file:bg-yellow-100"
                />
              </div>
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white">Create Incident</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Incident Details Dialog Modal */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl bg-white dark:bg-gray-950 p-6 border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Incident Details</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Full log parameters captured for safety audits.
            </DialogDescription>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4 py-3 text-sm">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-lg text-yellow-600">{selectedIncident.id}</span>
                <Badge className={getStatusBadge(selectedIncident.status)}>
                  {selectedIncident.status === "action-required" ? "ACTION REQUIRED" : selectedIncident.status.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Incident Summary</p>
                  <p className="font-medium text-gray-950 dark:text-gray-50">{selectedIncident.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Incident Type</p>
                  <p className="font-medium text-gray-950 dark:text-gray-50 capitalize">{selectedIncident.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Mine Name</p>
                  <p className="font-medium text-gray-950 dark:text-gray-50">{selectedIncident.mineName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Zone Location</p>
                  <p className="font-medium text-gray-950 dark:text-gray-50">{selectedIncident.zoneName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Report Date & Time</p>
                  <p className="font-medium text-gray-950 dark:text-gray-50">{selectedIncident.incidentDate} at {selectedIncident.incidentTime || "12:00"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Reported By</p>
                  <p className="font-medium text-gray-950 dark:text-gray-50">{selectedIncident.reportedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Severity</p>
                  <Badge className={`${getSeverityBadge(selectedIncident.severity)} px-2 py-0.5 mt-0.5 text-xs capitalize`}>
                    {selectedIncident.severity}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-2 space-y-2">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Observation Findings</p>
                  <p className="mt-1 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                    {selectedIncident.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-2">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Immediate Action Taken</p>
                  <p className="font-medium mt-0.5">{selectedIncident.immediateAction || "None recorded"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Observed Root Cause</p>
                  <p className="font-medium mt-0.5">{selectedIncident.rootCause || "Under Investigation"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-2">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Geo-tag Coordinates</p>
                  <p className="font-medium text-xs font-mono mt-0.5 text-gray-800 dark:text-gray-200">
                    {selectedIncident.latitude && selectedIncident.longitude
                      ? `${selectedIncident.latitude.toFixed(6)}° N, ${selectedIncident.longitude.toFixed(6)}° E`
                      : "Not Geo-tagged"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Location Source</p>
                  <p className="font-medium mt-0.5">
                    {selectedIncident.locationSource ? (
                      <Badge variant="outline" className="text-xs font-normal">
                        {selectedIncident.locationSource}
                      </Badge>
                    ) : "N/A"}
                  </p>
                </div>
              </div>

              {selectedIncident.evidenceName && (
                <div className="border-t pt-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Attached Photo/Evidence</p>
                  <p className="text-sm font-mono mt-1 text-yellow-600 font-medium">📄 {selectedIncident.evidenceName}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedIncident(null)}>Close Details</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}