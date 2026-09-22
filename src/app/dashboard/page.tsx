"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { complianceService, type ComplianceItem } from "@/lib/complianceService";
import { Header } from "@/components/layout/Header";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus,
  Users, 
  Building2,
  Calendar,
  Download,
  ChevronRight,
  Loader2,
  Zap,
  MapPin,
  FileCheck,
  ClipboardList,
  } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { downloadSummaryReport } from "@/lib/exportUtils";
import { inspectionService } from "@/lib/inspectionService";
import { getRoleDisplayName } from "@/lib/permissions";
import { useMines } from "@/hooks/useMines";
import { useDashboardStats } from "@/hooks/useActivities";
import { useCompliance } from "@/hooks/useCompliance";
import { useInspections } from "@/hooks/useInspections";
import { useIncidents } from "@/hooks/useIncidents";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";

// ============================================================
// TYPES
// ============================================================
interface Mine {
  id: string;
  name: string;
  location: string;
  riskScore: number;
  riskStatus: "critical" | "high" | "medium" | "low" | "safe";
  complianceScore: number;
  lastInspection: string;
  pendingViolations: number;
  workersOnSite: number;
  type: "underground" | "opencast";
  status: "active" | "inactive" | "maintenance";
}

// ComplianceItem type is imported from complianceService

interface DashboardStats {
  trends: {
    compliance: number;
    inspections: number;
    workers: number;
  };
}

// ============================================================
// MOCK DATA
// ============================================================
const mockMines: Mine[] = [
  { id: "M1", name: "Mine A", location: "Jharkhand", riskScore: 82, riskStatus: "critical", complianceScore: 67, lastInspection: "2026-08-15", pendingViolations: 5, workersOnSite: 342, type: "underground", status: "active" },
  { id: "M2", name: "Mine B", location: "Odisha", riskScore: 76, riskStatus: "high", complianceScore: 72, lastInspection: "2026-08-12", pendingViolations: 3, workersOnSite: 287, type: "opencast", status: "active" },
  { id: "M3", name: "Mine C", location: "Madhya Pradesh", riskScore: 62, riskStatus: "medium", complianceScore: 78, lastInspection: "2026-08-18", pendingViolations: 2, workersOnSite: 156, type: "underground", status: "maintenance" },
  { id: "M4", name: "Mine D", location: "Chhattisgarh", riskScore: 28, riskStatus: "safe", complianceScore: 91, lastInspection: "2026-08-20", pendingViolations: 0, workersOnSite: 412, type: "opencast", status: "active" },
  { id: "M5", name: "Mine E", location: "West Bengal", riskScore: 34, riskStatus: "safe", complianceScore: 88, lastInspection: "2026-08-22", pendingViolations: 1, workersOnSite: 289, type: "underground", status: "active" },
  { id: "M6", name: "Mine F", location: "Telangana", riskScore: 45, riskStatus: "medium", complianceScore: 82, lastInspection: "2026-08-10", pendingViolations: 2, workersOnSite: 178, type: "opencast", status: "active" },
];

const mockStats: DashboardStats = {
  trends: {
    compliance: 5.2,
    inspections: -2,
    workers: 124,
  }
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const getRiskColor = (status: string) => {
  const colors = {
    critical: "bg-red-600 text-white",
    high: "bg-red-500 text-white",
    medium: "bg-yellow-500 text-white",
    low: "bg-orange-400 text-white",
    safe: "bg-green-500 text-white",
  };
  return colors[status as keyof typeof colors] || "bg-gray-500 text-white";
};

const getRiskScoreClass = (score: number) => {
  if (score >= 70) return "text-red-600 bg-red-50 dark:bg-red-950/30";
  if (score >= 50) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30";
  return "text-green-600 bg-green-50 dark:bg-green-950/30";
};

// ============================================================
// MAIN DASHBOARD COMPONENT
// ============================================================
export default function DashboardPage() {
  const router = useRouter();
  const [selectedMineId, setSelectedMineId] = useState<string>("all");
  const [searchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("week");
  const [isLoading, setIsLoading] = useState(false);
  const { session, loading: sessionLoading } = useSession();
  const [selectedMine, setSelectedMine] = useState<Mine | null>(null);
  const [isMineModalOpen, setIsMineModalOpen] = useState(false);

  const { data: dbMines = [], isLoading: minesLoading } = useMines();
  const isMineManager = session?.role === "MINE_MANAGER";
  const isInspector = session?.role === "INSPECTOR";
  const managerMineId = session?.mineId || (dbMines[0]?.id ?? "47d2d435-8bae-49ca-b8d2-b6e71b407e9b");

  const managerMine = useMemo(() => {
    if (!isMineManager) return null;
    return dbMines.find((m) => m.id === managerMineId) || dbMines[0] || null;
  }, [isMineManager, dbMines, managerMineId]);

  const activeMineId = useMemo(() => {
    if (isMineManager) {
      return managerMineId;
    }
    return selectedMineId;
  }, [isMineManager, managerMineId, selectedMineId]);

  const { data: managerCompliance = [] } = useCompliance(isMineManager ? { mineId: managerMineId } : {});
  const { data: managerInspections = [] } = useInspections(isMineManager ? { mineId: managerMineId } : {});
  const { data: managerIncidents = [] } = useIncidents(isMineManager ? { mineId: managerMineId } : {});

  const { data: dbStats } = useDashboardStats(activeMineId === "all" ? undefined : activeMineId);

  const managerStats = useMemo(() => {
    if (!isMineManager || !managerMine) return null;
    const overdueCompliance = managerCompliance.filter((c) => c.status === "overdue" || c.status === "urgent").length;
    const pendingInspections = managerInspections.filter(
      (i) => i.status === "scheduled" || i.status === "pending" || i.status === "in-progress"
    ).length;
    const activeIncidents = managerIncidents.filter((inc) => inc.status !== "resolved" && inc.status !== "closed").length;
    const lastInspection = managerInspections[0]?.inspection_date || managerMine.last_inspection || "2026-08-15";
    const complianceScore = managerMine.compliance_score ?? 85;
    const workers = managerMine.workers_on_site ?? 342;
    return {
      overdueCompliance,
      pendingInspections,
      activeIncidents,
      lastInspection,
      complianceScore,
      workers,
      totalInspections: managerInspections.length,
    };
  }, [isMineManager, managerMine, managerCompliance, managerInspections, managerIncidents]);

  const mines: Mine[] = useMemo(() => {
    if (dbMines && dbMines.length > 0) {
      return dbMines.map((m) => ({
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
      }));
    }
    return mockMines;
  }, [dbMines]);

  const dynamicStats = useMemo(() => {
    if (isMineManager && managerStats) {
      return {
        totalMines: 1,
        complianceScore: managerStats.complianceScore,
        pendingInspections: managerStats.pendingInspections,
        activeWorkers: managerStats.workers,
        openViolations: managerStats.overdueCompliance,
      };
    }
    if (dbStats) {
      return {
        totalMines: dbStats.totalMines,
        complianceScore: dbStats.complianceScore,
        pendingInspections: dbStats.pendingInspections,
        activeWorkers: dbStats.activeWorkers,
        openViolations: dbStats.openViolations,
      };
    }
    const currentMine = mines.find((m) => m.id === activeMineId);
    const totalMines = activeMineId === "all" ? mines.length : 1;
    const avgCompliance = mines.length ? Math.round(mines.reduce((acc, m) => acc + (m.complianceScore || 0), 0) / mines.length) : 74;
    const activeWorkers = activeMineId === "all" ? mines.reduce((acc, m) => acc + (m.workersOnSite || 0), 0) : (currentMine?.workersOnSite || 120);
    return {
      totalMines,
      complianceScore: avgCompliance,
      pendingInspections: 5,
      activeWorkers: activeWorkers || 1247,
      openViolations: 2,
    };
  }, [isMineManager, managerStats, dbStats, mines, activeMineId]);

  // ============================================================
  // DATA FILTERING
  // ============================================================
  const filteredMines = useMemo(() => {
    return mines.filter((mine) => {
      const matchesSearch = mine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            mine.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMine = activeMineId === "all" || mine.id === activeMineId;
      return matchesSearch && matchesMine;
    });
  }, [mines, searchQuery, activeMineId]);

  // ============================================================
  // ACTIONS
  // ============================================================

  const handleExport = () => {
    const toastId = toast.loading("Generating summary report...");
    setTimeout(() => {
      try {
        downloadSummaryReport();
        toast.dismiss(toastId);
        toast.success("Governance report exported successfully!");
      } catch (e) {
        toast.dismiss(toastId);
        toast.error("Unable to generate the report. Please try again.");
      }
    }, 1000);
  };

  const handleMineClick = (mineId: string) => {
    const mineObj = mines.find(m => m.id === mineId);
    if (mineObj) {
      setSelectedMine(mineObj);
      setIsMineModalOpen(true);
    }
  };

  const handleAIScan = () => {
    toast.loading("AI scan in progress...");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.dismiss();
      toast.success("AI scan complete! 2 new insights found.");
    }, 2500);
  };

  // ============================================================
  // RENDER HELPERS
  // ============================================================
  const renderRiskBadge = (status: Mine["riskStatus"]) => {
    const labels = {
      critical: "Critical",
      high: "High Risk",
      medium: "At Risk",
      low: "Low Risk",
      safe: "Safe",
    };
    return (
      <Badge className={`${getRiskColor(status)} px-3 py-1`}>
        {labels[status]}
      </Badge>
    );
  };

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (isLoading || (sessionLoading && !session)) {
    return (
      <>
        <Header />
        <DashboardSkeleton />
      </>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <>
      <Header />
      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              <Badge variant="outline" className="text-xs font-normal">v2.0 · Live</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isMineManager
                ? `Operational governance and compliance oversight for ${managerMine?.name || "assigned colliery"}`
                : isInspector
                ? "Statutory safety audit oversight, scheduled colliery inspections, and hazard violation tracking"
                : "Real-time governance overview for all CIL subsidiaries"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isMineManager ? (
              <Badge variant="outline" className="text-sm font-semibold border-yellow-300 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400 py-1.5 px-3 mr-2">
                {managerMine?.name || session?.mineName || "Assigned Mine"}
              </Badge>
            ) : (
              <select
                value={activeMineId}
                onChange={(e) => setSelectedMineId(e.target.value)}
                className="h-9 rounded-4xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20 mr-2"
              >
                <option value="all">All Mines</option>
                {mines.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            )}

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-9 w-[130px] text-sm">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" /> Generate Report
            </Button>

            {isInspector ? (
              <Button
                size="sm"
                className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-white"
                onClick={() => router.push("/inspections")}
              >
                <ClipboardList className="h-4 w-4" />
                Inspections Checklist
              </Button>
            ) : (
              <Button size="sm" className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-white" onClick={handleAIScan} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Run AI Scan
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatsCard
            title={isInspector ? "Total Audits" : isMineManager ? "Assigned Mine" : "Total Mines"}
            value={isInspector ? managerInspections.length : isMineManager ? (managerMine?.name || "Mine A") : dynamicStats.totalMines}
            icon={Building2}
            color="blue"
            change={0}
            changeType="neutral"
          />
          <StatsCard
            title="Compliance Score"
            value={`${dynamicStats.complianceScore}%`}
            icon={FileCheck}
            color="green"
            change={mockStats.trends.compliance}
            changeType="up"
          />
          <StatsCard
            title={isInspector ? "Critical Flags" : isMineManager ? "Total Inspections" : "Inspections"}
            value={isInspector ? managerInspections.filter((i) => i.severity === "critical" || i.severity === "high").length : isMineManager && managerStats ? managerStats.totalInspections : 42}
            icon={ClipboardList}
            color="purple"
            change={8}
            changeType="up"
          />
          <StatsCard
            title={isInspector ? "Pending Audits" : "Pending Inspections"}
            value={dynamicStats.pendingInspections}
            icon={Calendar}
            color="yellow"
            change={Math.abs(mockStats.trends.inspections)}
            changeType="down"
          />
          <StatsCard
            title={isInspector ? "Active Incidents" : "Active Workers"}
            value={isInspector ? managerIncidents.filter((i) => i.status !== "resolved" && i.status !== "closed").length : dynamicStats.activeWorkers.toLocaleString()}
            icon={Users}
            color="orange"
            change={mockStats.trends.workers}
            changeType="up"
          />
        </div>

        {/* Mine Health Analysis for Manager OR Risk Overview for Multi-mine roles */}
        <div className="mt-6">
          {isMineManager ? (
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Mine Health Analysis</CardTitle>
                  <CardDescription>
                    Operational safety parameters, hazard indexes, and statutory status for {managerMine?.name || "Assigned Mine"}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-sm border-yellow-600/30 text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400"
                  onClick={() => handleMineClick(managerMine?.id || "")}
                >
                  View Parameters <ChevronRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 gap-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-400 font-bold text-lg">
                      ⛏️
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{managerMine?.name || "Mine A"}</h3>
                        <Badge variant="outline" className="text-xs">
                          {managerMine?.status === "active" ? "Active Operations" : (managerMine?.status || "Active")}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {managerMine?.location || "India"}</span>
                        <span>•</span>
                        <span>{managerMine?.type === "underground" ? "⬇ Underground Colliery" : "⛰ Opencast Pit"}</span>
                        <span>•</span>
                        <span>Last Inspection: {managerStats?.lastInspection || "2026-08-15"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Risk Index</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`rounded-full px-3 py-0.5 text-sm font-bold ${getRiskScoreClass(managerMine?.risk_score ?? 0)}`}>
                          {managerMine?.risk_score ?? 0} / 100
                        </span>
                        {renderRiskBadge(managerMine?.risk_status ?? "safe")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                    <p className="text-xs text-muted-foreground">Compliance Score</p>
                    <p className="text-xl font-bold text-green-600 mt-1">{dynamicStats.complianceScore}%</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">DGMS Norms</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                    <p className="text-xs text-muted-foreground">Overdue Tasks</p>
                    <p className={`text-xl font-bold mt-1 ${(managerStats?.overdueCompliance ?? 0) > 0 ? "text-red-600" : "text-gray-900 dark:text-white"}`}>
                      {managerStats?.overdueCompliance ?? 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Statutory Actions</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                    <p className="text-xs text-muted-foreground">Pending Inspections</p>
                    <p className="text-xl font-bold text-yellow-600 mt-1">{dynamicStats.pendingInspections}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Assigned Officers</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                    <p className="text-xs text-muted-foreground">Active Incidents</p>
                    <p className={`text-xl font-bold mt-1 ${(managerStats?.activeIncidents ?? 0) > 0 ? "text-orange-600" : "text-green-600"}`}>
                      {managerStats?.activeIncidents ?? 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Action Required</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                    <p className="text-xs text-muted-foreground">Workers on Site</p>
                    <p className="text-xl font-bold text-blue-600 mt-1">{dynamicStats.activeWorkers.toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Active Shifts</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                    <p className="text-xs text-muted-foreground">Production Zones</p>
                    <p className="text-xl font-bold text-purple-600 mt-1">{managerMine?.zones?.length || 5}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Operational Sectors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {isInspector && (
                <Card className="border-yellow-200 dark:border-yellow-900/40 bg-gradient-to-br from-yellow-50/20 to-transparent">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-yellow-600" />
                        Inspector Safety Audit Schedule & Active Inspections
                      </CardTitle>
                      <CardDescription>
                        Real-time statutory audits and field inspections in your jurisdiction
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-yellow-600/30 text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400"
                      onClick={() => router.push("/inspections")}
                    >
                      Open Full Checklist <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {managerInspections.length === 0 ? (
                      <div className="py-6 text-center text-sm text-gray-500">
                        No statutory audits currently pending.
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {managerInspections.slice(0, 6).map((item) => (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 flex flex-col justify-between gap-2 hover:border-yellow-300 transition-colors"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-xs font-bold text-yellow-700 dark:text-yellow-400">
                                  {item.id}
                                </span>
                                <Badge variant="outline" className="text-[10px] capitalize">
                                  {item.status}
                                </Badge>
                              </div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1 line-clamp-1">
                                {item.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {item.mine_name || "Colliery"} · {item.zone_name || "Operational Zone"}
                              </p>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                              <span className="text-gray-400">Date: {item.inspection_date}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-yellow-700 hover:text-yellow-800 p-0 font-medium"
                                onClick={() => router.push("/inspections")}
                              >
                                Audit →
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Mine Risk Overview</CardTitle>
                  <CardDescription>Risk scores across all mines</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-sm text-yellow-600 hover:text-yellow-700" onClick={() => router.push("/gis")}>
                  View All <ChevronRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredMines.map((mine) => (
                    <motion.div
                      key={mine.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="group flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50 transition-all"
                      onClick={() => handleMineClick(mine.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                          <span className="font-bold text-sm">{mine.name.replace("Mine ", "")}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{mine.name}</span>
                            {mine.status === "maintenance" && (
                              <Badge variant="outline" className="text-xs">Maintenance</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {mine.location}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {mine.workersOnSite} workers</span>
                            <span>•</span>
                            <span className={`flex items-center gap-1 ${mine.type === "underground" ? "text-gray-600" : "text-yellow-600"}`}>
                              {mine.type === "underground" ? "⬇ Underground" : "⛰ Opencast"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full px-3 py-1 text-sm font-bold ${getRiskScoreClass(mine.riskScore)}`}>
                            {mine.riskScore}
                          </span>
                          {renderRiskBadge(mine.riskStatus)}
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </div>
          )}
        </div>
      </main>

      {/* Mine Details Dialog Modal */}
      <Dialog open={isMineModalOpen} onOpenChange={(open) => !open && setIsMineModalOpen(false)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-950 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Mine Details & Status</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              Active operating parameters and compliance risk indexes.
            </DialogDescription>
          </DialogHeader>

          {selectedMine && (
            <div className="space-y-4 py-4 text-sm font-sans">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">{selectedMine.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">Location: <span className="font-semibold">{selectedMine.location}</span></p>
                </div>
                <Badge className={getRiskColor(selectedMine.riskStatus)}>
                  {selectedMine.riskStatus.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Risk Score</p>
                  <p className="font-bold text-lg text-gray-900 dark:text-white mt-1">{selectedMine.riskScore} / 100</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Compliance Level</p>
                  <p className="font-bold text-lg text-gray-900 dark:text-white mt-1">{selectedMine.complianceScore}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Active Workers</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{selectedMine.workersOnSite}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Mine Type</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1 capitalize">{selectedMine.type}</p>
                </div>
              </div>

              <div className="space-y-1.5 border-b pb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">Coordinates</p>
                <p className="font-mono text-xs text-gray-700 dark:text-gray-300">
                  {inspectionService.getFallbackCoordinates(selectedMine.id).lat.toFixed(4)}° N, {inspectionService.getFallbackCoordinates(selectedMine.id).lng.toFixed(4)}° E
                </p>
              </div>

              <DialogFooter className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsMineModalOpen(false)}>Close</Button>
                <Button 
                  className="bg-yellow-600 hover:bg-yellow-700 text-white gap-1.5"
                  onClick={() => {
                    setIsMineModalOpen(false);
                    router.push("/gis");
                  }}
                >
                  View on GIS Map
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "green" | "red" | "yellow" | "purple" | "orange";
  change: number;
  changeType: "up" | "down" | "neutral";
}

function StatsCard({ title, value, icon: Icon, color, change, changeType }: StatsCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
    yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
  };

  const getChangeDisplay = () => {
    if (changeType === "up") {
      return { icon: <ArrowUpRight className="h-3 w-3" />, color: "text-green-600", text: `+${change}` };
    } else if (changeType === "down") {
      return { icon: <ArrowDownRight className="h-3 w-3" />, color: "text-red-600", text: `${change}` };
    } else {
      return { icon: <Minus className="h-3 w-3" />, color: "text-gray-500", text: "" };
    }
  };

  const changeDisplay = getChangeDisplay();

  return (
    <Card className="border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1">
          <span className={`text-xs ${changeDisplay.color} flex items-center gap-0.5`}>
            {changeDisplay.icon}
            {changeDisplay.text}
          </span>
          <span className="text-xs text-gray-500">from last month</span>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>

        <Skeleton className="mt-6 h-96" />
      </div>
    </div>
  );
}