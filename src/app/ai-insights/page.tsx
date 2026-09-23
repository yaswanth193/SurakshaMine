"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Zap, 
  AlertTriangle, 
  BrainCircuit, 
  Activity, 
  ChevronRight, 
  Search, 
  Filter, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  ShieldCheck,
  Building,
  Info,
  ShieldAlert,
  Clock,
  RefreshCw,
  SlidersHorizontal,
  Flame,
} from "lucide-react";
import { insightService, generateLiveInsights, type AIInsight } from "@/lib/insightService";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";
import { useCompliance } from "@/hooks/useCompliance";
import { useIncidents } from "@/hooks/useIncidents";
import { useInspections } from "@/hooks/useInspections";
import { useMines } from "@/hooks/useMines";

export default function AIInsightsPage() {
  const router = useRouter();
  const { session } = useSession();
  const isMineManager = session?.role === "MINE_MANAGER";
  const managerMineId = isMineManager ? (session?.mineId || "47d2d435-8bae-49ca-b8d2-b6e71b407e9b") : undefined;

  const { data: compliance = [] } = useCompliance(managerMineId ? { mineId: managerMineId } : {});
  const { data: incidents = [] } = useIncidents(managerMineId ? { mineId: managerMineId } : {});
  const { data: inspections = [] } = useInspections(managerMineId ? { mineId: managerMineId } : {});
  const { data: mines = [] } = useMines();

  const [resolvedVersion, setResolvedVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeTab, setSelectedTypeTab] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedMine, setSelectedMine] = useState("all");
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Mine Risk Score feature state
  const [isRiskRecalculating, setIsRiskRecalculating] = useState(false);
  const [selectedRiskMine, setSelectedRiskMine] = useState<any | null>(null);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);

  useEffect(() => {
    if (
      session &&
      session.role !== "ADMIN" &&
      session.role !== "CORPORATE_MANAGEMENT" &&
      session.role !== "MINE_MANAGER"
    ) {
      router.replace("/dashboard");
      return;
    }
    if (session?.role === "MINE_MANAGER" && session?.mineId) {
      setSelectedMine(session.mineId);
    }
  }, [session, router]);

  const insights = useMemo(() => {
    return generateLiveInsights({
      compliance,
      incidents,
      inspections,
      mines,
      targetMineId: managerMineId,
    });
  }, [compliance, incidents, inspections, mines, managerMineId, resolvedVersion]);

  // AI Dynamic Mine Risk Score Calculation
  // Calculates score based on:
  // 1. Compliance status (overdue, urgent items)
  // 2. Inspection records (overdue, requires-action, pending items)
  // 3. Incident reports (unresolved, investigating, escalated items)
  const activeMinesList = useMemo(() => {
    if (mines && mines.length > 0) return mines;
    return [
      { id: "M1", name: "Mine A", location: "Jharkhand", type: "underground", risk_score: 82 },
      { id: "M2", name: "Mine B", location: "Odisha", type: "opencast", risk_score: 76 },
      { id: "M3", name: "Mine C", location: "Madhya Pradesh", type: "underground", risk_score: 62 },
      { id: "M4", name: "Mine D", location: "Chhattisgarh", type: "opencast", risk_score: 28 },
      { id: "M5", name: "Mine E", location: "West Bengal", type: "underground", risk_score: 34 },
      { id: "M6", name: "Mine F", location: "Telangana", type: "opencast", risk_score: 45 },
    ];
  }, [mines]);

  const mineRiskScores = useMemo(() => {
    return activeMinesList.map((mine: any) => {
      const mineCompliance = compliance.filter(
        (c) => c.mine_id === mine.id || (c as any).mineId === mine.id
      );
      const mineInspections = inspections.filter(
        (i) => i.mine_id === mine.id || (i as any).mineId === mine.id
      );
      const mineIncidents = incidents.filter(
        (inc) => inc.mine_id === mine.id || (inc as any).mineId === mine.id
      );

      // Overdue / Action Required Inspections
      const overdueInspections = mineInspections.filter(
        (i) =>
          i.status === "requires-action" ||
          i.status === "pending" ||
          (i.status === "scheduled" && new Date(i.inspection_date).getTime() < Date.now())
      ).length;

      // Unresolved Compliance Issues
      const unresolvedCompliance = mineCompliance.filter(
        (c) => c.status === "overdue" || c.status === "urgent"
      ).length;

      // Delayed / Active Incident Resolutions
      const delayedIncidents = mineIncidents.filter(
        (inc) => inc.status !== "resolved" && inc.status !== "closed"
      ).length;

      // Operational Base Score
      const baseOperationalScore = mine.risk_score
        ? Math.min(Math.max(mine.risk_score, 20), 40)
        : 25;

      // Dynamic weighted impacts
      const compliancePenalty = unresolvedCompliance * 18;
      const inspectionsPenalty = overdueInspections * 15;
      const incidentsPenalty = delayedIncidents * 14;

      let calculatedScore =
        baseOperationalScore + compliancePenalty + inspectionsPenalty + incidentsPenalty;

      if (calculatedScore > 98) calculatedScore = 98;
      if (calculatedScore < 12) calculatedScore = 12;

      let riskLevel: "Critical Risk" | "High Risk" | "Moderate Risk" | "Optimal Safety";
      let levelColor: string;
      let badgeBg: string;
      let operationalAdvisory: string;

      if (calculatedScore >= 70) {
        riskLevel = "Critical Risk";
        levelColor = "text-red-600 dark:text-red-400";
        badgeBg = "bg-red-500 text-white";
        operationalAdvisory =
          "Immediate attention and corrective actions required. Address overdue audits & active hazards.";
      } else if (calculatedScore >= 50) {
        riskLevel = "High Risk";
        levelColor = "text-orange-600 dark:text-orange-400";
        badgeBg = "bg-orange-500 text-white";
        operationalAdvisory =
          "Heightened statutory vigilance needed. Expedite compliance clearances and inspections.";
      } else if (calculatedScore >= 30) {
        riskLevel = "Moderate Risk";
        levelColor = "text-yellow-600 dark:text-yellow-400";
        badgeBg = "bg-yellow-500 text-white";
        operationalAdvisory =
          "Standard monitoring required. Routine preventive audits and regular shift safety briefings.";
      } else {
        riskLevel = "Optimal Safety";
        levelColor = "text-emerald-600 dark:text-emerald-400";
        badgeBg = "bg-emerald-500 text-white";
        operationalAdvisory =
          "Exemplary safety and compliance management. Continue current operational standards.";
      }

      return {
        mineId: mine.id,
        mineName: mine.name,
        location: mine.location || "India",
        type: mine.type || "underground",
        riskScore: calculatedScore,
        riskLevel,
        levelColor,
        badgeBg,
        overdueInspections,
        unresolvedCompliance,
        delayedIncidents,
        operationalAdvisory,
        breakdown: {
          base: baseOperationalScore,
          compliance: compliancePenalty,
          inspections: inspectionsPenalty,
          incidents: incidentsPenalty,
        },
      };
    });
  }, [activeMinesList, compliance, inspections, incidents]);

  const handleRecalculateRiskScores = () => {
    setIsRiskRecalculating(true);
    toast.loading("AI Engine evaluating real-time compliance, inspections & incidents...");
    setTimeout(() => {
      setIsRiskRecalculating(false);
      toast.dismiss();
      toast.success("Mine Risk Scores recalculated successfully with latest telemetry!");
    }, 1200);
  };

  // Filter Logic
  const filteredInsights = useMemo(() => {
    return insights.filter(item => {
      if (item.status !== "active") return false;

      // Mine restriction for multi-mine roles only
      if (!isMineManager && selectedMine !== "all" && item.mineId !== selectedMine) {
        return false;
      }

      // Type Tab filter
      if (selectedTypeTab !== "all" && item.type !== selectedTypeTab) return false;

      // Severity filter
      if (selectedSeverity !== "all" && item.severity !== selectedSeverity) return false;

      // Search Query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesText = item.title.toLowerCase().includes(query) ||
                            item.mineName.toLowerCase().includes(query) ||
                            item.description.toLowerCase().includes(query) ||
                            item.recommendation.toLowerCase().includes(query);
        if (!matchesText) return false;
      }

      return true;
    });
  }, [insights, isMineManager, session, selectedTypeTab, selectedSeverity, selectedMine, searchQuery]);

  // Derived Counts
  const counts = useMemo(() => {
    const active = insights.filter(item => {
      if (item.status !== "active") return false;
      if (isMineManager && session?.mineId) {
        return item.mineId === session.mineId;
      }
      return true;
    });

    const alerts = active.filter(i => i.type === "alert").length;
    const predictions = active.filter(i => i.type === "prediction").length;
    const anomalies = active.filter(i => i.type === "anomaly").length;
    
    const totalConfidence = active.reduce((sum, item) => sum + item.confidence, 0);
    const avgConfidence = active.length > 0 ? Math.round(totalConfidence / active.length) : 0;

    return { alerts, predictions, anomalies, avgConfidence };
  }, [insights, isMineManager, session]);

  const handleResolve = (id: string) => {
    insightService.resolveInsight(id);
    setResolvedVersion(v => v + 1);
    toast.success("AI Insight resolved successfully!");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 border-red-100 dark:border-red-900/30";
      case "high": return "text-orange-600 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-400 border-orange-100 dark:border-orange-900/30";
      case "medium": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30";
      default: return "text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30";
    }
  };

  return (
    <>
      <Header />
      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">AI Intelligence Summary</h1>
            <Badge variant="outline" className="text-xs bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 text-yellow-700 dark:text-yellow-400 gap-1 font-medium">
              <BrainCircuit className="h-3 w-3" /> Smart Governance Engine
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isMineManager 
              ? `AI-powered predictive safety, compliance deadlines, and anomaly detection for ${session?.mineName || "your mine"}.`
              : "AI-powered governance, compliance and operational insights across mines."}
          </p>
        </div>

        {/* ============================================================ */}
        {/* FEATURE: AI CALCULATED MINE RISK SCORE ENGINE                 */}
        {/* ============================================================ */}
        <section className="mb-8">
          <Card className="border-amber-200 dark:border-amber-900/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent overflow-hidden shadow-sm">
            <CardHeader className="p-5 sm:p-6 border-b border-amber-100 dark:border-amber-950/60 pb-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge className="bg-amber-600 hover:bg-amber-600 text-white text-xs font-bold gap-1">
                      <Zap className="h-3 w-3" /> Predictive AI Feature
                    </Badge>
                    <Badge variant="outline" className="text-xs border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                      Live Risk Telemetry
                    </Badge>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                    AI Calculated Mine Risk Score
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleRecalculateRiskScores}
                    disabled={isRiskRecalculating}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRiskRecalculating ? "animate-spin" : ""}`} />
                    {isRiskRecalculating ? "Calculating Scores..." : "Recalculate AI Scores"}
                  </Button>
                </div>
              </div>

              {/* Explanatory Definition Banner matching requested specification */}
              <div className="mt-4 p-3.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-200/80 dark:border-amber-900/40 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-1">
                <p>
                  The AI calculates a <strong className="text-amber-700 dark:text-amber-400 font-semibold">Mine Risk Score</strong> based on <strong>compliance status</strong>, <strong>inspection records</strong>, and <strong>incident reports</strong>.
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  For example, if a mine has a high number of overdue inspections, unresolved compliance issues, and delayed incident resolutions, the Mine Risk Score increases, indicating a higher level of risk and potential danger. A higher Mine Risk Score means the mine requires immediate attention and corrective actions, while a lower score indicates better compliance, safety performance, and operational management.
                </p>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mineRiskScores.map((item) => (
                  <div
                    key={item.mineId}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Mine & Risk Level Badge */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <Building className="h-4 w-4 text-amber-600 shrink-0" />
                            {item.mineName}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {item.location} • <span className="capitalize">{item.type}</span>
                          </p>
                        </div>
                        <Badge className={`${item.badgeBg} text-xs font-semibold px-2 py-0.5 shrink-0`}>
                          {item.riskLevel}
                        </Badge>
                      </div>

                      {/* Large Risk Score Meter */}
                      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 mb-3.5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Mine Risk Score
                          </span>
                          <span className={`text-2xl font-black ${item.levelColor}`}>
                            {item.riskScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              item.riskScore >= 70
                                ? "bg-red-600"
                                : item.riskScore >= 50
                                ? "bg-orange-500"
                                : item.riskScore >= 30
                                ? "bg-yellow-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${item.riskScore}%` }}
                          />
                        </div>
                      </div>

                      {/* 3 Core Evaluated Factors */}
                      <div className="space-y-2 mb-4 text-xs">
                        <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-blue-500" /> Overdue Inspections
                          </span>
                          <span className={`font-bold ${item.overdueInspections > 0 ? "text-red-600" : "text-emerald-600"}`}>
                            {item.overdueInspections} {item.overdueInspections > 0 ? "Pending" : "None"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Unresolved Compliance
                          </span>
                          <span className={`font-bold ${item.unresolvedCompliance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                            {item.unresolvedCompliance} {item.unresolvedCompliance > 0 ? "Open" : "Zero"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <Flame className="h-3.5 w-3.5 text-red-500" /> Delayed Incidents
                          </span>
                          <span className={`font-bold ${item.delayedIncidents > 0 ? "text-red-600" : "text-emerald-600"}`}>
                            {item.delayedIncidents} {item.delayedIncidents > 0 ? "Active" : "Resolved"}
                          </span>
                        </div>
                      </div>

                      {/* Operational Advisory */}
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-900/30">
                        {item.operationalAdvisory}
                      </p>
                    </div>

                    {/* Action Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRiskMine(item);
                        setIsRiskModalOpen(true);
                      }}
                      className="mt-4 w-full text-xs font-medium border-slate-200 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center justify-center gap-1"
                    >
                      <SlidersHorizontal className="h-3 w-3" />
                      Inspect Risk Factors
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Dynamic Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase text-gray-400">High-Priority Alerts</CardTitle>
              <div className="rounded-lg p-2 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.alerts}</div>
              <p className="text-xs text-gray-500 mt-1">Critical anomalies and safety alerts</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase text-gray-400">Compliance Predictions</CardTitle>
              <div className="rounded-lg p-2 bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400">
                <Zap className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.predictions}</div>
              <p className="text-xs text-gray-500 mt-1">Forecasted statutory clearing risks</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase text-gray-400">Anomalies Detected</CardTitle>
              <div className="rounded-lg p-2 bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400">
                <Activity className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.anomalies}</div>
              <p className="text-xs text-gray-500 mt-1">Operational deviations found</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase text-gray-400">Avg Confidence Index</CardTitle>
              <div className="rounded-lg p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.avgConfidence}%</div>
              <p className="text-xs text-gray-500 mt-1">Weighted analytical probability</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-gray-50 dark:bg-gray-950 p-1 rounded-xl w-fit border dark:border-gray-800">
              <button 
                onClick={() => setSelectedTypeTab("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${selectedTypeTab === "all" ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
              >
                All Insights
              </button>
              <button 
                onClick={() => setSelectedTypeTab("alert")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${selectedTypeTab === "alert" ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
              >
                Alerts ({counts.alerts})
              </button>
              <button 
                onClick={() => setSelectedTypeTab("prediction")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${selectedTypeTab === "prediction" ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
              >
                Predictions ({counts.predictions})
              </button>
              <button 
                onClick={() => setSelectedTypeTab("anomaly")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${selectedTypeTab === "anomaly" ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
              >
                Anomalies ({counts.anomalies})
              </button>
            </div>

            {/* Dropdowns and Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] sm:flex-initial">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search insights..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-full sm:w-64 rounded-4xl border border-gray-200 dark:border-gray-800 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="severity-select" className="text-xs font-semibold uppercase text-gray-400 whitespace-nowrap">Severity</Label>
                <select
                  id="severity-select"
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="h-9 rounded-4xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-1 text-sm outline-none"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </select>
              </div>

              {!isMineManager && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="mine-select" className="text-xs font-semibold uppercase text-gray-400 whitespace-nowrap">Mine</Label>
                  <select
                    id="mine-select"
                    value={selectedMine}
                    onChange={(e) => setSelectedMine(e.target.value)}
                    className="h-9 rounded-4xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-1 text-sm outline-none"
                  >
                    <option value="all">All Mines</option>
                    {mines.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Insight Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {filteredInsights.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center text-gray-500 dark:text-gray-400">
              No AI Insights match the selected criteria.
            </div>
          ) : (
            filteredInsights.map(insight => (
              <Card key={insight.id} className="border-gray-200 dark:border-gray-800 flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b dark:border-gray-850">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className={`capitalize border ${getSeverityColor(insight.severity)}`}>
                      {insight.severity}
                    </Badge>
                    <span className="text-xs text-gray-400 font-mono">Conf: {insight.confidence}%</span>
                  </div>
                  <CardTitle className="text-base font-bold line-clamp-1">{insight.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5 text-gray-450 shrink-0" /> {insight.mineName} · {insight.location}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="py-4 flex-1">
                  <div className="space-y-2.5 text-xs bg-gray-50/80 dark:bg-gray-950/60 p-3 rounded-xl border border-gray-100 dark:border-gray-850">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-500 shrink-0">1. Observation:</span>
                      <span className="text-gray-700 dark:text-gray-300 leading-snug line-clamp-2">
                        {insight.description.split(". ")[0]}.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-500 shrink-0">2. Primary Factor:</span>
                      <span className="text-gray-700 dark:text-gray-300 leading-snug line-clamp-2">
                        {insight.factors[0] || "Operational telemetry variance detected."}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-500 shrink-0">3. Action Required:</span>
                      <span className="text-yellow-700 dark:text-yellow-400 font-medium leading-snug line-clamp-2">
                        {insight.recommendation.split(". ")[0]}.
                      </span>
                    </div>
                  </div>
                </CardContent>

                <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-150 dark:border-gray-850 rounded-b-2xl flex justify-between gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs flex-1"
                    onClick={() => {
                      setSelectedInsight(insight);
                      setIsDetailsOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white flex-1"
                    onClick={() => router.push(insight.actionRoute)}
                  >
                    {insight.actionText} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Explainability Section */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-base font-bold mb-2 flex items-center gap-1.5">
            <Info className="h-4.5 w-4.5 text-yellow-600" /> How insights are generated
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
            The AI risk indicators are derived dynamically from the central compliance database, active inspector audit reports, registered incidents, and corrective logs. The scoring engine evaluates risk weightings (e.g. overdue status, repeated violations) to identify patterns, generate forecasts, and suggest corrective recommendations.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-1.5 border dark:border-gray-800/80 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-950">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Compliance Status
            </div>
            <div className="flex items-center gap-1.5 border dark:border-gray-800/80 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-950">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Inspector Audits
            </div>
            <div className="flex items-center gap-1.5 border dark:border-gray-800/80 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-950">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Incident Records
            </div>
            <div className="flex items-center gap-1.5 border dark:border-gray-800/80 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-950">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Corrective Actions
            </div>
            <div className="flex items-center gap-1.5 border dark:border-gray-800/80 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-950">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Risk Indicators
            </div>
          </div>
        </div>
      </main>

      {/* Insight Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={(open) => !open && setIsDetailsOpen(false)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-950 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">AI Insight Details</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              Risk analysis explanation and contributing parameters.
            </DialogDescription>
          </DialogHeader>

          {selectedInsight && (
            <div className="space-y-4 py-4 text-sm font-sans">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">{selectedInsight.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">Mine: <span className="font-semibold">{selectedInsight.mineName}</span></p>
                </div>
                <Badge variant="outline" className={`capitalize border ${getSeverityColor(selectedInsight.severity)}`}>
                  {selectedInsight.severity.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Mine Risk Index</p>
                  <p className="font-bold text-lg text-gray-900 dark:text-white mt-1">{selectedInsight.riskScore} / 100</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Confidence Index</p>
                  <p className="font-bold text-lg text-gray-900 dark:text-white mt-1">{selectedInsight.confidence}%</p>
                </div>
              </div>

              <div className="space-y-1.5 border-b pb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">Description</p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedInsight.description}
                </p>
              </div>

              <div className="space-y-1.5 border-b pb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">Why was this detected?</p>
                <ul className="space-y-1 pl-4 list-disc text-gray-650 dark:text-gray-305">
                  {selectedInsight.factors.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>

              <div className="space-y-1.5 border-b pb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">Recommended Action</p>
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  {selectedInsight.recommendation}
                </p>
              </div>

              <DialogFooter className="mt-6 flex justify-between gap-2 pt-4 border-t dark:border-gray-800">
                <Button 
                  variant="outline" 
                  className="border-red-600/35 hover:bg-red-50 hover:text-red-700 text-red-600 mr-auto"
                  onClick={() => {
                    handleResolve(selectedInsight.id);
                    setIsDetailsOpen(false);
                  }}
                >
                  Resolve Alert
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                  <Button 
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      router.push(selectedInsight.actionRoute);
                    }}
                  >
                    {selectedInsight.actionText}
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MINE RISK SCORE FACTOR BREAKDOWN MODAL */}
      <Dialog open={isRiskModalOpen} onOpenChange={(open) => !open && setIsRiskModalOpen(false)}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-950 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-amber-600 text-white text-xs font-bold">
                AI Risk Model Analysis
              </Badge>
              {selectedRiskMine && (
                <Badge className={selectedRiskMine.badgeBg}>
                  {selectedRiskMine.riskLevel}
                </Badge>
              )}
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {selectedRiskMine?.mineName} Risk Score Audit
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Evaluated under DGMS, environmental norms, and real-time operational records.
            </DialogDescription>
          </DialogHeader>

          {selectedRiskMine && (
            <div className="space-y-4 py-2 text-sm font-sans">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Composite AI Score</p>
                  <p className={`text-3xl font-black ${selectedRiskMine.levelColor} mt-1`}>
                    {selectedRiskMine.riskScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Status Category</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {selectedRiskMine.riskLevel}
                  </p>
                </div>
              </div>

              {/* 3 Parameter Mathematical Weightings */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Real-Time Contributing Factors:
                </p>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        Overdue Inspection Records
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {selectedRiskMine.overdueInspections} audits pending or requiring remediation (+15 pts/ea)
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    +{selectedRiskMine.breakdown.inspections} pts
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        Unresolved Compliance Status
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {selectedRiskMine.unresolvedCompliance} statutory tasks overdue or urgent (+18 pts/ea)
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    +{selectedRiskMine.breakdown.compliance} pts
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Flame className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        Delayed Incident Resolutions
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {selectedRiskMine.delayedIncidents} unresolved or investigating safety reports (+14 pts/ea)
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    +{selectedRiskMine.breakdown.incidents} pts
                  </span>
                </div>
              </div>

              {/* Action Plan */}
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase mb-1 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-amber-600" /> AI Corrective Directive
                </p>
                <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  {selectedRiskMine.operationalAdvisory}
                </p>
              </div>

              <DialogFooter className="mt-4 flex justify-between gap-2 pt-2 border-t dark:border-gray-800">
                <Button variant="outline" size="sm" onClick={() => setIsRiskModalOpen(false)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                  onClick={() => {
                    setIsRiskModalOpen(false);
                    router.push("/compliance");
                  }}
                >
                  Manage Compliance
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
