"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BarChart3,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  Filter,
  Check,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";
import {
  MINE_ADHERENCE_BREAKDOWN_DATA,
  STATUTORY_REGULATIONS_DATA,
  MineComplianceBreakdown,
  StatutoryRegulation,
} from "@/lib/regulationsData";
import {
  downloadMineAdherencePDF,
  downloadSingleRulePDF,
} from "@/lib/pdfExport";

export default function AnalysisPage() {
  const router = useRouter();
  const { session } = useSession();

  // Role Access Guard: Allowed for REGULATORY_AUTHORITY & ADMIN
  useEffect(() => {
    if (session && session.role !== "REGULATORY_AUTHORITY" && session.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [session, router]);

  // Mine selector state
  const [selectedMineId, setSelectedMineId] = useState<string>(
    MINE_ADHERENCE_BREAKDOWN_DATA[0].mineId
  );
  const [mineRuleFilter, setMineRuleFilter] = useState<"all" | "following" | "deficient">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectingRule, setInspectingRule] = useState<StatutoryRegulation | null>(null);

  // Active mine object
  const selectedMine = useMemo(() => {
    return (
      MINE_ADHERENCE_BREAKDOWN_DATA.find((m) => m.mineId === selectedMineId) ||
      MINE_ADHERENCE_BREAKDOWN_DATA[0]
    );
  }, [selectedMineId]);

  // Filtered rules for selected mine
  const filteredRules = useMemo(() => {
    return selectedMine.rulesAdherence.filter((rule) => {
      const matchesSearch =
        rule.ruleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.ruleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        mineRuleFilter === "all" ||
        (mineRuleFilter === "following" && rule.isFollowing) ||
        (mineRuleFilter === "deficient" && !rule.isFollowing);

      return matchesSearch && matchesStatus;
    });
  }, [selectedMine, mineRuleFilter, searchQuery]);

  // Stats calculation
  const totalMines = MINE_ADHERENCE_BREAKDOWN_DATA.length;
  const avgFleetAdherence = Math.round(
    MINE_ADHERENCE_BREAKDOWN_DATA.reduce(
      (acc, m) => acc + m.overallAdherencePercent,
      0
    ) / totalMines
  );

  const handleDownloadMineAudit = (mine: MineComplianceBreakdown) => {
    try {
      toast.info(`Generating official Adherence Audit for ${mine.mineName}...`);
      downloadMineAdherencePDF(mine);
      toast.success(`Downloaded ${mine.mineName} Adherence Audit (PDF)`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to export mine adherence PDF.");
    }
  };

  const handleDownloadRulePDF = (rule: StatutoryRegulation) => {
    try {
      toast.info(`Downloading statutory PDF for ${rule.code}...`);
      downloadSingleRulePDF(rule);
      toast.success(`Downloaded ${rule.code} PDF`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 overflow-x-hidden">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge
                variant="outline"
                className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-semibold px-2.5 py-0.5"
              >
                <BarChart3 className="h-3.5 w-3.5 mr-1" />
                Regulatory Authority Analysis
              </Badge>
              <Badge
                variant="outline"
                className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-medium"
              >
                Colliery Adherence Codex
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Colliery Statutory Adherence Analysis
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Comparative adherence breakdown across operating coal mines. Inspect
              which rules each colliery is currently following, review concise
              compliance evidence, and download certified adherence audit reports.
            </p>
          </div>

          <Button
            onClick={() => handleDownloadMineAudit(selectedMine)}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm self-start md:self-auto"
          >
            <FileCheck2 className="h-4 w-4" />
            Download {selectedMine.mineName} Audit (PDF)
          </Button>
        </div>

        {/* Fleet KPI Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Mines Monitored
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {totalMines} Collieries
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Underground & Opencast Fleet</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Fleet Adherence Index
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {avgFleetAdherence}%
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Average compliance score</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Active Colliery
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 truncate max-w-[170px]">
                  {selectedMine.mineName}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedMine.subsidiary}</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                <BarChart3 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Rules Following
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {selectedMine.followedCount} / {selectedMine.totalRulesCount}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedMine.totalRulesCount - selectedMine.followedCount} require remediation
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colliery Switcher Bar */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Select Mine Colliery:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {MINE_ADHERENCE_BREAKDOWN_DATA.map((mine) => {
              const isSelected = mine.mineId === selectedMineId;
              const statusColor =
                mine.status === "Fully Compliant"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : mine.status === "Substantially Compliant"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-amber-600 dark:text-amber-400";

              return (
                <button
                  key={mine.mineId}
                  onClick={() => setSelectedMineId(mine.mineId)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-white dark:bg-slate-900 border-amber-600 dark:border-amber-500 shadow-md ring-2 ring-amber-600/20"
                      : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">
                      {mine.subsidiary}
                    </span>
                    <span className={`text-xs font-bold ${statusColor}`}>
                      {mine.overallAdherencePercent}%
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                    {mine.mineName}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>{mine.followedCount}/{mine.totalRulesCount} Rules</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Mine Detailed Breakdown */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* Header Card */}
          <div className="bg-slate-900 text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-600 text-white hover:bg-amber-600 text-xs font-bold">
                  {selectedMine.subsidiary}
                </Badge>
                <Badge variant="outline" className="text-slate-300 border-slate-700 text-xs">
                  {selectedMine.type} Mine
                </Badge>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {selectedMine.mineId}
                </span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white">
                {selectedMine.mineName}
              </h3>
              <p className="text-xs text-slate-300">
                Location: {selectedMine.location} • Safety Officer:{" "}
                <span className="text-white font-medium">{selectedMine.safetyOfficer}</span>{" "}
                • Last Inspection: {selectedMine.lastAuditDate}
              </p>
            </div>

            {/* Score Box */}
            <div className="flex items-center gap-4 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 shrink-0">
              <div className="text-right">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Adherence Score
                </p>
                <p className="text-2xl font-black text-emerald-400">
                  {selectedMine.overallAdherencePercent}%
                </p>
                <p className="text-[11px] text-slate-300">
                  {selectedMine.followedCount} of {selectedMine.totalRulesCount} Rules Followed
                </p>
              </div>
              <div className="h-12 w-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 flex items-center justify-center font-bold text-white text-xs">
                {selectedMine.status === "Fully Compliant" ? "A+" : "B+"}
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col xs:flex-row xs:items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                <Filter className="h-3.5 w-3.5" /> Filter Rules:
              </span>
              <Tabs
                value={mineRuleFilter}
                onValueChange={(val) =>
                  setMineRuleFilter(val as "all" | "following" | "deficient")
                }
                className="w-full xs:w-auto"
              >
                <TabsList className="bg-white dark:bg-slate-800 h-auto p-1 flex flex-wrap gap-1 border border-slate-200 dark:border-slate-700">
                  <TabsTrigger value="all" className="text-xs h-7 px-2.5">
                    All Rules ({selectedMine.totalRulesCount})
                  </TabsTrigger>
                  <TabsTrigger
                    value="following"
                    className="text-xs h-7 px-2.5 text-emerald-700 dark:text-emerald-400"
                  >
                    ✓ Following ({selectedMine.followedCount})
                  </TabsTrigger>
                  <TabsTrigger
                    value="deficient"
                    className="text-xs h-7 px-2.5 text-amber-700 dark:text-amber-400"
                  >
                    ⚠ Action Needed (
                    {selectedMine.totalRulesCount - selectedMine.followedCount})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder={`Search ${selectedMine.mineName} rules...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          {/* Simplified Rules List: 2 Simple Points Per Rule */}
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredRules.map((ruleItem) => {
              const correspondingReg = STATUTORY_REGULATIONS_DATA.find(
                (r) => r.code === ruleItem.ruleCode
              );

              return (
                <div
                  key={ruleItem.ruleCode}
                  className={`p-4 sm:p-5 transition-colors ${
                    ruleItem.isFollowing
                      ? "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      : "bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Rule and 2 Simplified Points */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1 shrink-0">
                        {ruleItem.isFollowing ? (
                          <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                            <Check className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">
                            {ruleItem.ruleCode}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[11px] font-semibold ${
                              ruleItem.isFollowing
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                                : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                            }`}
                          >
                            {ruleItem.isFollowing ? "✓ CURRENTLY FOLLOWING" : "⚠ REMEDIATION REQUIRED"}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {ruleItem.category}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {ruleItem.ruleTitle}
                        </h4>

                        {/* Simplified 2-Point Card Matter */}
                        <div className="space-y-1.5 pt-1 text-xs">
                          {/* Point 1: Status & Telemetry Evidence */}
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-slate-500 shrink-0">1. Evidence:</span>
                            <span className="text-slate-700 dark:text-slate-300 leading-snug">
                              {ruleItem.telemetryEvidence.split(". ")[0]}.
                            </span>
                          </div>

                          {/* Point 2: Remediation or Verified Status */}
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-slate-500 shrink-0">2. Directive:</span>
                            <span
                              className={`leading-snug ${
                                ruleItem.isFollowing
                                  ? "text-slate-700 dark:text-slate-300"
                                  : "text-amber-700 dark:text-amber-400 font-medium"
                              }`}
                            >
                              {ruleItem.remediationNote
                                ? ruleItem.remediationNote
                                : `Compliant under DGMS guidelines. Verified on ${ruleItem.verifiedDate} by ${ruleItem.verifiedBy}.`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Score & Actions */}
                    <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="text-left lg:text-right">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            ruleItem.complianceScore >= 90
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          Score: {ruleItem.complianceScore}%
                        </span>
                      </div>

                      {correspondingReg && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInspectingRule(correspondingReg)}
                            className="text-xs h-7 px-2.5 border-slate-200 dark:border-slate-700 flex items-center gap-1"
                          >
                            <BookOpen className="h-3 w-3 text-slate-500" />
                            Rule Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadRulePDF(correspondingReg)}
                            className="text-xs h-7 px-2 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            title="Download rule PDF"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRules.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                No regulations found matching your filter for {selectedMine.mineName}.
              </div>
            )}
          </div>
        </Card>
      </main>

      {/* INSPECT RULE DIALOG */}
      {inspectingRule && (
        <Dialog
          open={!!inspectingRule}
          onOpenChange={(open) => !open && setInspectingRule(null)}
        >
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge
                  variant="outline"
                  className="bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 font-bold px-2 py-0.5 text-xs"
                >
                  {inspectingRule.code}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {inspectingRule.category}
                </Badge>
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {inspectingRule.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Enacted under {inspectingRule.statutoryAct} • Enforced by{" "}
                {inspectingRule.authority}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed text-slate-700 dark:text-slate-300">
                {inspectingRule.fullLegalText}
              </div>

              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
                <h4 className="font-bold text-red-800 dark:text-red-300 text-xs mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                  Statutory Penalty for Breach
                </h4>
                <p className="text-red-700 dark:text-red-400 text-xs leading-relaxed">
                  {inspectingRule.penalClause}
                </p>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-row items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInspectingRule(null)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                onClick={() => handleDownloadRulePDF(inspectingRule)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
