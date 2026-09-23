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
  Scale,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Layers,
  ExternalLink,
  BookOpen,
  Filter,
  Check,
  XCircle,
  FileCheck2,
  Activity,
  ArrowRight,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";
import {
  STATUTORY_REGULATIONS_DATA,
  MINE_ADHERENCE_BREAKDOWN_DATA,
  StatutoryRegulation,
  MineComplianceBreakdown,
  MineRuleAdherence,
} from "@/lib/regulationsData";
import {
  downloadSingleRulePDF,
  downloadFullCompendiumPDF,
  downloadMineAdherencePDF,
} from "@/lib/pdfExport";

export default function RegulationsPage() {
  const { session } = useSession();

  // Search and filter state for Regulations
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [inspectingRule, setInspectingRule] =
    useState<StatutoryRegulation | null>(null);

  // Mine breakdown state
  const [selectedMineId, setSelectedMineId] = useState<string>(
    MINE_ADHERENCE_BREAKDOWN_DATA[0].mineId
  );
  const [mineRuleFilter, setMineRuleFilter] = useState<"all" | "following" | "deficient">("all");
  const [mineSearchQuery, setMineSearchQuery] = useState("");

  // Filtered regulations list
  const filteredRegulations = useMemo(() => {
    return STATUTORY_REGULATIONS_DATA.filter((rule) => {
      const matchesSearch =
        rule.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.statutoryAct.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.issuingOffice.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.authority.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === "all" || rule.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  // Selected mine object
  const selectedMine = useMemo(() => {
    return (
      MINE_ADHERENCE_BREAKDOWN_DATA.find((m) => m.mineId === selectedMineId) ||
      MINE_ADHERENCE_BREAKDOWN_DATA[0]
    );
  }, [selectedMineId]);

  // Filtered rules for selected mine
  const filteredMineRules = useMemo(() => {
    return selectedMine.rulesAdherence.filter((rule) => {
      const matchesSearch =
        rule.ruleCode.toLowerCase().includes(mineSearchQuery.toLowerCase()) ||
        rule.ruleTitle.toLowerCase().includes(mineSearchQuery.toLowerCase()) ||
        rule.telemetryEvidence.toLowerCase().includes(mineSearchQuery.toLowerCase());

      const matchesStatus =
        mineRuleFilter === "all" ||
        (mineRuleFilter === "following" && rule.isFollowing) ||
        (mineRuleFilter === "deficient" && !rule.isFollowing);

      return matchesSearch && matchesStatus;
    });
  }, [selectedMine, mineRuleFilter, mineSearchQuery]);

  // Handlers for PDF downloads
  const handleDownloadSingleRule = (rule: StatutoryRegulation) => {
    try {
      toast.info(`Generating official PDF for ${rule.code}...`);
      downloadSingleRulePDF(rule);
      toast.success(`Downloaded ${rule.code} Statutory Dossier (PDF)`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const handleDownloadFullCompendium = () => {
    try {
      toast.info("Compiling all 15 Government Regulations into Master PDF...");
      downloadFullCompendiumPDF(STATUTORY_REGULATIONS_DATA);
      toast.success("Downloaded Master Regulations Compendium (PDF)");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export full compendium PDF.");
    }
  };

  const handleDownloadMineAudit = (mine: MineComplianceBreakdown) => {
    try {
      toast.info(`Exporting official Adherence Audit for ${mine.mineName}...`);
      downloadMineAdherencePDF(mine);
      toast.success(`Downloaded Adherence Audit PDF for ${mine.mineName}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to export mine adherence PDF.");
    }
  };

  // Stats calculation
  const totalRules = STATUTORY_REGULATIONS_DATA.length;
  const avgFleetAdherence = Math.round(
    MINE_ADHERENCE_BREAKDOWN_DATA.reduce(
      (acc, m) => acc + m.overallAdherencePercent,
      0
    ) / MINE_ADHERENCE_BREAKDOWN_DATA.length
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 overflow-x-hidden">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge
                variant="outline"
                className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-semibold px-2.5 py-0.5"
              >
                <Scale className="h-3.5 w-3.5 mr-1" />
                Statutory Authority Codex
              </Badge>
              <Badge
                variant="outline"
                className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-medium"
              >
                Government of India Verified
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Coal Mines Statutory Regulations & Adherence
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Authentic statutory standards enacted under the Coal Mines
              Regulations (CMR 2017), Mines Act 1952, CPCB, and CCO. Review
              official legal mandates, download signed PDF dossiers, and inspect
              exact mine-by-mine compliance adherence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleDownloadFullCompendium}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-semibold shadow-sm flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Full Compendium (PDF)
            </Button>
          </div>
        </div>

        {/* National Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Gazetted Regulations
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {totalRules} Rules
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Across 4 primary statutory domains
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Enforcing Authorities
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  DGMS / CPCB / CCO
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ministry of Coal & Environment
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                <Scale className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Collieries Monitored
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {MINE_ADHERENCE_BREAKDOWN_DATA.length} Mines
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Underground & Opencast Fleet
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
                  Fleet Adherence Index
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {avgFleetAdherence}%
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified across telemetry feeds
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: ALL GOVERNMENT RULES & REGULATIONS THAT A COAL MINE MUST FOLLOW */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold">
                  1
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Statutory Regulations Repository
                </h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 ml-8">
                Mandatory legal provisions from DGMS, Mines Act 1952, CPCB, and
                CCO. Inspect full legal decrees and download individual rule PDFs.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search rule code, title, or act..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm"
              />
            </div>
          </div>

          {/* Domain Filter Tabs */}
          <Tabs
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="w-full"
          >
            <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 flex flex-wrap gap-1 h-auto border border-slate-200 dark:border-slate-800">
              <TabsTrigger
                value="all"
                className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm"
              >
                All Domains ({totalRules})
              </TabsTrigger>
              <TabsTrigger
                value="Mine Safety & Strata"
                className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
              >
                Safety & Strata (5)
              </TabsTrigger>
              <TabsTrigger
                value="Occupational Health & Welfare"
                className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
              >
                Health & Welfare (3)
              </TabsTrigger>
              <TabsTrigger
                value="Environmental & Pollution Control"
                className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
              >
                Environmental & Pollution (4)
              </TabsTrigger>
              <TabsTrigger
                value="Statutory Reporting & Concession"
                className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
              >
                Statutory Reporting (3)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Regulations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRegulations.map((rule) => {
              const categoryColor =
                rule.category === "Mine Safety & Strata"
                  ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                  : rule.category === "Occupational Health & Welfare"
                  ? "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                  : rule.category === "Environmental & Pollution Control"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";

              return (
                <Card
                  key={rule.id}
                  className="flex flex-col justify-between border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm hover:shadow-md"
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-semibold px-2 py-0.5 ${categoryColor}`}
                      >
                        {rule.category}
                      </Badge>
                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                        {rule.code}
                      </span>
                    </div>

                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                      {rule.title}
                    </CardTitle>

                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {rule.statutoryAct}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Gazette and Authority line */}
                      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="text-slate-400 font-medium">Authority:</span>
                          <span className="font-semibold text-right">{rule.authority}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="text-slate-400 font-medium">Audit Cadence:</span>
                          <span className="text-right font-medium">{rule.frequency}</span>
                        </div>
                        <div className="flex items-start justify-between text-slate-600 dark:text-slate-300 pt-0.5">
                          <span className="text-slate-400 font-medium">Gazette Ref:</span>
                          <span className="text-right font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[170px]">
                            {rule.gazetteRef}
                          </span>
                        </div>
                      </div>

                      {/* Threshold Highlight */}
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Compliance Benchmark
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5 line-clamp-2 bg-slate-100/70 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-700">
                          {rule.complianceThreshold}
                        </p>
                      </div>

                      {/* Mandatory Requirements Checklist sample */}
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                          Mandatory Provisions ({rule.mandatoryRequirements.length})
                        </p>
                        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                          {rule.mandatoryRequirements.slice(0, 2).map((req, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 line-clamp-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span className="truncate">{req}</span>
                            </li>
                          ))}
                          {rule.mandatoryRequirements.length > 2 && (
                            <li className="text-[11px] text-slate-400 font-medium pl-5">
                              + {rule.mandatoryRequirements.length - 2} more mandatory clauses
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectingRule(rule)}
                        className="flex-1 text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
                      >
                        <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                        Inspect Rule
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDownloadSingleRule(rule)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 flex items-center gap-1 shadow-sm"
                        title="Download official PDF for this rule"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredRegulations.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <Scale className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                No statutory regulations matched your search
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Try searching for "CMR", "CPCB", "Methane", "DGMS", or reset the category filter.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-4 text-xs"
              >
                Reset Search
              </Button>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: BREAKDOWN OF EACH SPECIFIC MINE (MINE A, MINE B, ETC.) */}
        {/* ========================================================================= */}
        <section className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white text-xs font-bold">
                  2
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Colliery Statutory Rule Adherence Matrix
                </h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 ml-8 max-w-3xl">
                Comprehensive statutory breakdown of specific operating mines
                (Mine A, Mine B, Mine C, Mine D, Mine E, Mine F). Lists exactly
                which gazetted rules each specific mine is currently following,
                verified telemetry data, and audit reports.
              </p>
            </div>

            <Button
              onClick={() => handleDownloadMineAudit(selectedMine)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-2 self-start md:self-auto shadow-sm"
            >
              <FileCheck2 className="h-4 w-4" />
              Download {selectedMine.mineName} Adherence Audit (PDF)
            </Button>
          </div>

          {/* Mine Selector Bar */}
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
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-white dark:bg-slate-900 border-amber-600 dark:border-amber-500 shadow-md ring-2 ring-amber-600/20"
                      : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {mine.subsidiary}
                    </span>
                    <span className={`text-[11px] font-bold ${statusColor}`}>
                      {mine.overallAdherencePercent}%
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                    {mine.mineName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {mine.type} • {mine.location.split(",")[0]}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>
                      {mine.followedCount} / {mine.totalRulesCount} Following
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Mine Dossier Profile Card */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
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
                  <span className="text-white font-medium">
                    {selectedMine.safetyOfficer}
                  </span>{" "}
                  • Last Statutory Inspection: {selectedMine.lastAuditDate}
                </p>
              </div>

              {/* Adherence Score Box */}
              <div className="flex items-center gap-4 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 shrink-0">
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Statutory Compliance
                  </p>
                  <p className="text-2xl font-black text-emerald-400">
                    {selectedMine.overallAdherencePercent}%
                  </p>
                  <p className="text-[11px] text-slate-300">
                    {selectedMine.followedCount} of {selectedMine.totalRulesCount} Rules
                    Complied
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 flex items-center justify-center font-bold text-white text-xs">
                  {selectedMine.status === "Fully Compliant" ? "A+" : "B+"}
                </div>
              </div>
            </div>

            {/* Rules Adherence Table Controls */}
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
                  value={mineSearchQuery}
                  onChange={(e) => setMineSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            {/* Rule by Rule Adherence List */}
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredMineRules.map((ruleItem, index) => {
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
                      {/* Left: Rule identity & status */}
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-0.5 shrink-0">
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

                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">
                              {ruleItem.ruleCode}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[11px] font-semibold ${
                                ruleItem.isFollowing
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                                  : "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800"
                              }`}
                            >
                              {ruleItem.isFollowing
                                ? "CURRENTLY FOLLOWING"
                                : "REMEDIATION REQUIRED"}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {ruleItem.category}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {ruleItem.ruleTitle}
                          </h4>

                          {/* Telemetry Evidence Box */}
                          <div className="mt-2 bg-slate-50 dark:bg-slate-950/70 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800/80 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                              <Activity className="h-3.5 w-3.5 text-blue-600" />
                              <span>Live Telemetry & Field Verification Evidence:</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-mono text-[11px]">
                              {ruleItem.telemetryEvidence}
                            </p>

                            {ruleItem.remediationNote && (
                              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span className="font-sans font-medium text-xs">
                                  <strong>Statutory Notice:</strong> {ruleItem.remediationNote}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Verification Details & Action Button */}
                      <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                        <div className="text-left lg:text-right">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span>Score:</span>
                            <span
                              className={`font-bold ${
                                ruleItem.complianceScore >= 90
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {ruleItem.complianceScore}%
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Verified {ruleItem.verifiedDate}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            By {ruleItem.verifiedBy}
                          </p>
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
                              onClick={() => handleDownloadSingleRule(correspondingReg)}
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

              {filteredMineRules.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No regulations found matching your filter for {selectedMine.mineName}.
                </div>
              )}
            </div>
          </Card>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* INSPECT RULE STATUTORY MODAL */}
      {/* ========================================================================= */}
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

            <div className="space-y-5 py-4 text-xs">
              {/* Official Metadata Table */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3.5 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <span className="text-slate-400 font-medium block">
                    Gazette Notification:
                  </span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                    {inspectingRule.gazetteRef}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">
                    Issuing Office:
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">
                    {inspectingRule.issuingOffice}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">
                    Statutory Audit Frequency:
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">
                    {inspectingRule.frequency}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">
                    Compliance Threshold:
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    {inspectingRule.complianceThreshold}
                  </span>
                </div>
              </div>

              {/* Full Legal Text */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-amber-600" />
                  Full Operative Legal Text & Statutory Decree
                </h4>
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-sans leading-relaxed text-xs">
                  {inspectingRule.fullLegalText}
                </div>
              </div>

              {/* Mandatory Colliery Requirements */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Mandatory Colliery Operational Requirements
                </h4>
                <div className="space-y-2">
                  {inspectingRule.mandatoryRequirements.map((req, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2"
                    >
                      <span className="font-bold text-slate-400 text-[11px] shrink-0">
                        #{i + 1}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {req}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Penal Clause */}
              <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
                <h4 className="font-bold text-red-800 dark:text-red-300 text-xs mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                  Statutory Penalties & Judicial Liabilities for Breach
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
                onClick={() => handleDownloadSingleRule(inspectingRule)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                Download Rule Dossier (PDF)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
