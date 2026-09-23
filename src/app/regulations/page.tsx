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
  Building2,
  ShieldCheck,
  ShieldAlert,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
  STATUTORY_REGULATIONS_DATA,
  StatutoryRegulation,
} from "@/lib/regulationsData";
import {
  downloadSingleRulePDF,
  downloadFullCompendiumPDF,
} from "@/lib/pdfExport";

export default function RegulationsPage() {
  // Search and filter state for Regulations
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [inspectingRule, setInspectingRule] =
    useState<StatutoryRegulation | null>(null);

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

  const totalRules = STATUTORY_REGULATIONS_DATA.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 overflow-x-hidden">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
              Coal Mines Regulations
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Authentic statutory standards enacted under the Coal Mines
              Regulations (CMR 2017), Mines Act 1952, CPCB, and CCO. Review
              official legal mandates and download signed PDF dossiers.
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

        {/* Statutory Codex Metrics Grid */}
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
                  Statutory Provisions
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  55+ Clauses
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mandatory operational standards
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
                  Gazette Dossiers
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  15 Verified
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Downloadable certified PDFs
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* STATUTORY REGULATIONS REPOSITORY */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Statutory Regulations Repository
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
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

          {/* Regulations Grid with Simplified 2-3 Point Rule Cards */}
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
                    {/* Simplified Matter: 2 to 3 Points */}
                    <div className="space-y-2.5 my-1 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-start gap-2 text-xs">
                        <span className="font-semibold text-slate-500 dark:text-slate-400 shrink-0">1. Mandate:</span>
                        <span className="text-slate-700 dark:text-slate-300 leading-snug line-clamp-2">
                          {rule.complianceThreshold}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <span className="font-semibold text-slate-500 dark:text-slate-400 shrink-0">2. Provision:</span>
                        <span className="text-slate-700 dark:text-slate-300 leading-snug line-clamp-2">
                          {rule.mandatoryRequirements[0]}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <span className="font-semibold text-slate-500 dark:text-slate-400 shrink-0">3. Cadence:</span>
                        <span className="text-slate-700 dark:text-slate-300 leading-snug">
                          {rule.frequency} audit verified by {rule.authority}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions: Keep Inspect Rule and PDF Button */}
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
      </main>

      {/* INSPECT RULE STATUTORY MODAL */}
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
