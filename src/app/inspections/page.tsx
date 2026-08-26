"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  ClipboardList,
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  Download,
  Filter,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import { inspectionService, defaultZones, type InspectionItem } from "@/lib/inspectionService";
import { complianceService, type Mine } from "@/lib/complianceService";
import { downloadCSV } from "@/lib/exportUtils";

const getStatusBadge = (status: string) => {
  const styles = {
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "in-progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 animate-pulse",
    pending: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    "requires-action": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };
  return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
};

const getSeverityBadge = (severity: string) => {
  const styles = {
    critical: "bg-red-600 text-white",
    high: "bg-red-500 text-white",
    medium: "bg-yellow-500 text-white",
    low: "bg-green-500 text-white",
  };
  return styles[severity as keyof typeof styles] || "bg-gray-500 text-white";
};

export default function InspectionsPage() {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [mines, setMines] = useState<Mine[]>([]);
  const [inspectors, setInspectors] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<InspectionItem | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [mineId, setMineId] = useState("");
  const [zoneName, setZoneName] = useState("");
  const [inspectionType, setInspectionType] = useState<any>("Safety");
  const [inspectorName, setInspectorName] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");
  const [inspectionTime, setInspectionTime] = useState("");
  const [observation, setObservation] = useState("");
  const [severity, setSeverity] = useState<any>("medium");
  const [remarks, setRemarks] = useState("");
  const [evidenceName, setEvidenceName] = useState("");
  
  // Geolocation state
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locationSource, setLocationSource] = useState<"GPS" | "Fallback" | undefined>(undefined);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("");
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setItems(inspectionService.getInspections());
    setMines(complianceService.getMines());
    setInspectors(complianceService.getUsers());
    
    // Set default date/time on loading client
    setInspectionDate(new Date().toISOString().split("T")[0]);
    setInspectionTime(new Date().toTimeString().slice(0, 5));
  }, []);

  const handleExport = () => {
    try {
      const headers = [
        "Inspection ID",
        "Mine Name",
        "Zone Name",
        "Inspection Type",
        "Inspector Name",
        "Inspection Date",
        "Inspection Time",
        "Severity",
        "Status",
        "Observation Findings",
        "Latitude",
        "Longitude",
        "GPS Source"
      ];
      const rows = filteredData.map(item => [
        item.id,
        item.mineName,
        item.zoneName,
        item.inspectionType,
        item.inspectorName,
        item.inspectionDate,
        item.inspectionTime,
        item.severity,
        item.status,
        item.observation,
        item.latitude || "",
        item.longitude || "",
        item.locationSource || ""
      ]);
      const dateStr = new Date().toISOString().split("T")[0];
      downloadCSV(headers, rows, `coalgov360-inspections-${dateStr}.csv`);
      toast.success("Inspections report exported successfully!");
    } catch (e) {
      toast.error("Unable to export inspection data.");
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setInspectionDate(new Date().toISOString().split("T")[0]);
    setInspectionTime(new Date().toTimeString().slice(0, 5));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTitle("");
    setMineId("");
    setZoneName("");
    setInspectionType("Safety");
    setInspectorName("");
    setObservation("");
    setSeverity("medium");
    setRemarks("");
    setEvidenceName("");
    setLatitude(undefined);
    setLongitude(undefined);
    setLocationSource(undefined);
    setGpsStatus("");
    setErrors({});
  };

  const handleCaptureLocation = () => {
    if (!mineId) {
      toast.error("Please select a Mine first to capture location.");
      setErrors(prev => ({ ...prev, mineId: "Select mine before capturing location" }));
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Location services are not supported by this browser.");
      setGpsStatus("Browser geolocation unsupported. Fallback coordinates assigned.");
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
    if (!zoneName) newErrors.zoneName = "Zone Area selection is required";
    if (!inspectorName) newErrors.inspectorName = "Inspector selection is required";
    if (!inspectionDate) newErrors.inspectionDate = "Date is required";
    if (!observation.trim()) newErrors.observation = "Observation findings are required";

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

    const finalTitle = title.trim() || `${inspectionType} Safety Inspection`;

    inspectionService.createInspection({
      title: finalTitle,
      mineId,
      mineName,
      zoneName,
      inspectionType,
      inspectorName,
      inspectionDate,
      inspectionTime: inspectionTime || "12:00",
      observation,
      severity,
      remarks: remarks || undefined,
      evidenceName: evidenceName || undefined,
      latitude: finalLat,
      longitude: finalLng,
      locationSource: finalSource
    });

    setItems(inspectionService.getInspections());
    toast.success("Inspection checklist created successfully!");
    handleCloseModal();
  };

  const filteredData = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.mineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.inspectorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.inspectionType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = inspectionService.calculateStats(items);
  const mineZonesList = mineId ? inspectionService.getZonesForMine(mineId) : defaultZones;

  return (
    <>
      <Header />
      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-yellow-600" />
              Inspections Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Schedule and track mine inspections
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={handleOpenModal}
            >
              <Plus className="mr-2 h-4 w-4" /> New Inspection
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
              <p className="text-sm text-gray-500">Total Inspections</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-600">Scheduled</p>
              <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardContent className="p-4">
              <p className="text-sm text-yellow-600">Active / Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-4">
              <p className="text-sm text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search inspections by inspector, mine, type..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
        </div>

        {/* Inspections Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredData.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-500 dark:text-gray-400 border border-dashed rounded-2xl">
              No matching inspections found.
            </div>
          ) : (
            filteredData.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold leading-tight line-clamp-2">{item.title}</CardTitle>
                    <Badge className={`${getStatusBadge(item.status)} shrink-0`}>
                      {item.status === "requires-action" ? "Requires Action" : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                    <MapPin className="h-3 w-3 text-yellow-600 shrink-0" /> {item.mineName} · <span className="font-semibold text-gray-700 dark:text-gray-300">{item.zoneName}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm border-t pt-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">Inspector:</span>
                      <span className="font-medium">{item.inspectorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">Scheduled:</span>
                      <span className="font-medium">{item.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-semibold">Type:</span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0 font-normal">{item.inspectionType}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-semibold">Severity:</span>
                      <Badge className={`${getSeverityBadge(item.severity)} text-xs px-1.5 py-0`}>
                        {item.severity}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 border-t pt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedInspection(item)}
                    >
                      View Details
                    </Button>
                    <Button size="sm" className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white" onClick={() => toast.info(`Starting audit context for ${item.id}`)}>
                      Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* New Inspection Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-lg rounded-2xl bg-white dark:bg-gray-950 p-6 border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Schedule New Inspection</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Submit environmental and hazard safety audit details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-3">
            <div className="space-y-1">
              <Label htmlFor="title" className="text-sm font-medium">Inspection Title / Audit Name</Label>
              <Input
                id="title"
                placeholder="Quarterly Ventilation Audit (Leave empty for default)"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="mine" className="text-sm font-medium">Mine *</Label>
                <select
                  id="mine"
                  value={mineId}
                  onChange={e => {
                    setMineId(e.target.value);
                    setZoneName(""); // Reset zone when mine changes
                    if (errors.mineId) setErrors(prev => ({ ...prev, mineId: "" }));
                  }}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm transition-colors outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                >
                  <option value="">Select Mine</option>
                  {mines.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                {errors.mineId && <p className="text-xs text-red-600 font-medium">{errors.mineId}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="zone" className="text-sm font-medium">Zone / Operational Area *</Label>
                <select
                  id="zone"
                  value={zoneName}
                  disabled={!mineId}
                  onChange={e => {
                    setZoneName(e.target.value);
                    if (errors.zoneName) setErrors(prev => ({ ...prev, zoneName: "" }));
                  }}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm transition-colors outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Zone</option>
                  {mineZonesList.map((z: string) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
                {errors.zoneName && <p className="text-xs text-red-600 font-medium">{errors.zoneName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="type" className="text-sm font-medium">Inspection Type *</Label>
                <select
                  id="type"
                  value={inspectionType}
                  onChange={e => setInspectionType(e.target.value as any)}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm transition-colors outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                >
                  <option value="Safety">Safety</option>
                  <option value="Environment">Environment</option>
                  <option value="Labour">Labour</option>
                  <option value="Production">Production</option>
                  <option value="Statutory Compliance">Statutory Compliance</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="inspector" className="text-sm font-medium">Inspector *</Label>
                <select
                  id="inspector"
                  value={inspectorName}
                  onChange={e => {
                    setInspectorName(e.target.value);
                    if (errors.inspectorName) setErrors(prev => ({ ...prev, inspectorName: "" }));
                  }}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm transition-colors outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                >
                  <option value="">Select Inspector</option>
                  {inspectors.map(ins => (
                    <option key={ins} value={ins}>{ins}</option>
                  ))}
                </select>
                {errors.inspectorName && <p className="text-xs text-red-600 font-medium">{errors.inspectorName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="date" className="text-sm font-medium">Date *</Label>
                <input
                  id="date"
                  type="date"
                  value={inspectionDate}
                  onChange={e => {
                    setInspectionDate(e.target.value);
                    if (errors.inspectionDate) setErrors(prev => ({ ...prev, inspectionDate: "" }));
                  }}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm transition-colors outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                />
                {errors.inspectionDate && <p className="text-xs text-red-600 font-medium">{errors.inspectionDate}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="time" className="text-sm font-medium">Time</Label>
                <input
                  id="time"
                  type="time"
                  value={inspectionTime}
                  onChange={e => setInspectionTime(e.target.value)}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm transition-colors outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="observation" className="text-sm font-medium">Observation Findings *</Label>
              <textarea
                id="observation"
                rows={2}
                placeholder="Observation details..."
                value={observation}
                onChange={e => {
                  setObservation(e.target.value);
                  if (errors.observation) setErrors(prev => ({ ...prev, observation: "" }));
                }}
                className="w-full min-h-[50px] rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm transition-colors outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
              />
              {errors.observation && <p className="text-xs text-red-600 font-medium">{errors.observation}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="severity" className="text-sm font-medium">Severity *</Label>
                <select
                  id="severity"
                  value={severity}
                  onChange={e => setSeverity(e.target.value as any)}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm transition-colors outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
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
                  {gpsLoading ? "Querying..." : "Capture Location"}
                </Button>
                {gpsStatus && <span className="text-[10px] text-gray-500 font-semibold truncate mt-1">{gpsStatus}</span>}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="evidence" className="text-sm font-medium">Evidence / Photo</Label>
              <input
                id="evidence"
                type="file"
                accept="image/*"
                onChange={e => {
                  if (e.target.files && e.target.files.length > 0) {
                    setEvidenceName(e.target.files[0].name);
                  }
                }}
                className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-base transition-colors outline-none file:mr-4 file:py-0.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-yellow-50 file:text-yellow-700 dark:file:bg-yellow-950/30 dark:file:text-yellow-400 hover:file:bg-yellow-100 md:text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="remarks" className="text-sm font-medium">Remarks</Label>
              <textarea
                id="remarks"
                rows={1}
                placeholder="Additional comments/notes..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 text-sm transition-colors outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
              />
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white">Create Inspection</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inspection Details Dialog Modal */}
      <Dialog open={!!selectedInspection} onOpenChange={() => setSelectedInspection(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl bg-white dark:bg-gray-950 p-6 border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Inspection Details</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Review full parameters captured during the audit.
            </DialogDescription>
          </DialogHeader>
          {selectedInspection && (
            <div className="space-y-4 py-3 text-sm">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-lg text-yellow-600">{selectedInspection.id}</span>
                <Badge className={getStatusBadge(selectedInspection.status)}>
                  {selectedInspection.status === "requires-action" ? "REQUIRES ACTION" : selectedInspection.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Mine Name</p>
                  <p className="font-medium text-gray-950 dark:text-gray-50">{selectedInspection.mineName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Zone / Area</p>
                  <p className="font-medium text-gray-950 dark:text-gray-50">{selectedInspection.zoneName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Inspection Type</p>
                  <p className="font-medium text-gray-950 dark:text-gray-50">{selectedInspection.inspectionType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Inspector Assigned</p>
                  <p className="font-medium text-gray-950 dark:text-gray-50">{selectedInspection.inspectorName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Date & Time</p>
                  <p className="font-medium text-gray-950 dark:text-gray-50">{selectedInspection.inspectionDate} at {selectedInspection.inspectionTime || "12:00"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Severity</p>
                  <Badge className={`${getSeverityBadge(selectedInspection.severity)} px-2 py-0.5 mt-0.5 text-xs capitalize`}>
                    {selectedInspection.severity}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-2 space-y-2">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Observation Findings</p>
                  <p className="mt-1 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                    {selectedInspection.observation}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-2">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Geo-tag Coordinates</p>
                  <p className="font-medium text-xs font-mono mt-0.5 text-gray-800 dark:text-gray-200">
                    {selectedInspection.latitude && selectedInspection.longitude 
                      ? `${selectedInspection.latitude.toFixed(6)}° N, ${selectedInspection.longitude.toFixed(6)}° E`
                      : "Not Geo-tagged"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Location Source</p>
                  <p className="font-medium mt-0.5">
                    {selectedInspection.locationSource ? (
                      <Badge variant="outline" className="text-xs font-normal">
                        {selectedInspection.locationSource}
                      </Badge>
                    ) : "N/A"}
                  </p>
                </div>
              </div>

              {selectedInspection.evidenceName && (
                <div className="border-t pt-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Attached Photo/Evidence</p>
                  <p className="text-sm font-mono mt-1 text-yellow-600 font-medium">📄 {selectedInspection.evidenceName}</p>
                </div>
              )}

              {selectedInspection.remarks && (
                <div className="border-t pt-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Remarks / Notes</p>
                  <p className="mt-1 text-gray-600 dark:text-gray-400 italic">{selectedInspection.remarks}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInspection(null)}>Close Details</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}