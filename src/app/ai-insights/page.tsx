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


    </>
  );
}
