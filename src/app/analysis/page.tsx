"use client";

import { useState, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Download,
  BookOpen,
  ShieldAlert,
  BarChart3,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";
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
  const [selectedMineId, setSelectedMineId] = useState<string>("M1");
  const [inspectingRule, setInspectingRule] =
    useState<StatutoryRegulation | null>(null);

  const selectedMine = useMemo(() => {
    return (
      MINE_ADHERENCE_BREAKDOWN_DATA.find((m) => m.mineId === selectedMineId) ||
      MINE_ADHERENCE_BREAKDOWN_DATA[0]
    );
  }, [selectedMineId]);

  // Prototype: reduce to 5-6 sample values for clean inspection
  const prototypeSampleRules = useMemo(() => {
    return selectedMine.rulesAdherence.slice(0, 6);
  }, [selectedMine]);

  const totalMines = MINE_ADHERENCE_BREAKDOWN_DATA.length;

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
                Statutory Compliance Tracking
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Colliery Statutory Adherence Analysis
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Comparative statutory adherence breakdown across operating coal mines. Inspect
              which rules each colliery is currently following and download certified adherence audit reports.
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

        {/* 2 KPI Boxes: Total Mines and Rules Followed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Total Mines
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {totalMines} Collieries
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Underground & Opencast Coal Mines
                </p>
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
                  Rules Followed
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {selectedMine.followedCount} / {selectedMine.totalRulesCount} Rules
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedMine.totalRulesCount - selectedMine.followedCount} require remediation
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colliery Switcher: Just Names like Mine A, Mine B without extra info */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            Select Mine Colliery:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {MINE_ADHERENCE_BREAKDOWN_DATA.map((mine) => {
              const isSelected = mine.mineId === selectedMineId;
              return (
                <button
                  key={mine.mineId}
                  onClick={() => setSelectedMineId(mine.mineId)}
                  className={`py-3 px-4 rounded-xl border text-center font-bold text-sm transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-amber-600 dark:text-white border-slate-900 dark:border-amber-600 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {mine.mineName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Mine Detailed Breakdown */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedMine.mineName} Statutory Rule Status
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Detailed statutory compliance checklist and adherence telemetry.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className={`self-start sm:self-auto text-xs font-semibold ${
                  selectedMine.followedCount === selectedMine.totalRulesCount
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-amber-50 text-amber-700 border-amber-300"
                }`}
              >
                {selectedMine.followedCount} of {selectedMine.totalRulesCount} Rules Compliant
              </Badge>
            </div>
          </CardHeader>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {prototypeSampleRules.map((ruleItem) => {
              const correspondingReg = STATUTORY_REGULATIONS_DATA.find(
                (r) => r.code === ruleItem.ruleCode
              );

              return (
                <div
                  key={ruleItem.ruleCode}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
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
                          {ruleItem.isFollowing ? "✓ Following" : "⚠ Action Required"}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {ruleItem.category}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {ruleItem.ruleTitle}
                      </h4>

                      <div className="space-y-1 pt-1 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-slate-500 shrink-0">Evidence:</span>
                          <span className="text-slate-700 dark:text-slate-300 leading-snug">
                            {ruleItem.telemetryEvidence.split(". ")[0]}.
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-slate-500 shrink-0">Status:</span>
                          <span
                            className={`leading-snug ${
                              ruleItem.isFollowing
                                ? "text-slate-700 dark:text-slate-300"
                                : "text-amber-700 dark:text-amber-400 font-medium"
                            }`}
                          >
                            {ruleItem.remediationNote
                              ? ruleItem.remediationNote
                              : `Verified compliant under DGMS regulations.`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {correspondingReg && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInspectingRule(correspondingReg)}
                            className="text-xs h-8 px-3 border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                          >
                            <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                            Inspect Rule
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleDownloadRulePDF(correspondingReg)}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 px-3 flex items-center gap-1 shadow-sm"
                            title="Download official PDF"
                          >
                            <Download className="h-3.5 w-3.5" />
                            PDF
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prototype Sample Note */}
          <div className="p-4 bg-slate-50/60 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <span>Showing top sample of 6 statutory rules for {selectedMine.mineName} prototype analysis.</span>
            <Button
              variant="link"
              size="sm"
              onClick={() => handleDownloadMineAudit(selectedMine)}
              className="text-xs text-amber-600 dark:text-amber-400 p-0 h-auto font-semibold self-start sm:self-auto"
            >
              Export Full Audit PDF →
            </Button>
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
