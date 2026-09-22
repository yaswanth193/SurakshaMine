"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  FileCheck, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Calendar,
  BookOpen,
  Scale,
  ShieldAlert,
  ExternalLink,
  FileText,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { downloadCSV } from "@/lib/exportUtils";
import { useSession } from "@/hooks/useSession";
import { useCompliance, useCreateCompliance, useUpdateComplianceStatus } from "@/hooks/useCompliance";
import { useMines } from "@/hooks/useMines";
import type { ComplianceItem } from "@/types/database";

export interface RegulationStandard {
  id: string;
  code: string;
  title: string;
  category: "Mine Safety" | "Environment" | "Labour & Welfare" | "Statutory Reporting";
  authority: string;
  frequency: string;
  description: string;
  mandatoryRule: string;
  penaltyClause: string;
}

export const STATUTORY_REGULATIONS: RegulationStandard[] = [
  {
    id: "reg-1",
    code: "CMR-2017-R104",
    title: "Continuous Methane (CH4) & Toxic Gas Monitoring",
    category: "Mine Safety",
    authority: "DGMS (Directorate General of Mines Safety)",
    frequency: "Continuous / Real-Time Telemetry",
    description: "Automatic multi-point telemetry gas sensors deployed across longwall faces, return airways, and sealed goaf areas. Threshold alarm triggered at >=0.75% CH4; automatic electrical power trip at >=1.25% CH4.",
    mandatoryRule: "Coal Mines Regulations 2017, Regulation 104, 169 & Technical Circular 03/2021",
    penaltyClause: "Immediate power cutoff, work suspension & statutory notice under Section 22(1A)",
  },
  {
    id: "reg-2",
    code: "EPA-1986-SVI",
    title: "Effluent Discharge & Acid Mine Drainage (AMD) Treatment",
    category: "Environment",
    authority: "MoEFCC & Central Pollution Control Board (CPCB)",
    frequency: "Weekly Water Quality & Continuous pH",
    description: "Sedimentation and chemical neutralization of pit discharge water prior to release into natural streams. Mandatory compliance with pH 6.5–8.5, Total Suspended Solids (TSS) < 100 mg/L, and heavy metal limits.",
    mandatoryRule: "Environment (Protection) Act 1986 Schedule VI & Water Act 1974",
    penaltyClause: "Statutory environmental damage compensation, CTO revocation, and fine under Section 15",
  },
  {
    id: "reg-3",
    code: "MA-1952-S22A",
    title: "Mandatory Personal Protective Equipment (PPE) & Self-Rescuers",
    category: "Labour & Welfare",
    authority: "DGMS & Ministry of Labour and Employment",
    frequency: "Daily Pit-head Entry Gate Inspection",
    description: "Every worker entering underground workings must be issued and wear DGMS-certified hard hat, cap lamp, high-visibility reflective clothing, steel-toed boots, and filter self-rescuer / SCSR.",
    mandatoryRule: "Mines Act 1952 Section 22A & Coal Mines Regulations 2017 Regulation 182",
    penaltyClause: "Immediate bar from underground entry and monetary penalty per worker non-compliance",
  },
  {
    id: "reg-4",
    code: "CCO-MR-2020",
    title: "Quarterly Statutory Returns & Incident Disclosures",
    category: "Statutory Reporting",
    authority: "Coal Controller's Organisation (CCO) & DGMS",
    frequency: "Quarterly (Within 15 days of quarter end)",
    description: "Mandatory submission of Form I, II, III & IV documenting coal production, seam-wise extraction, explosive consumption, minor and major injury registers, and safety committee resolutions.",
    mandatoryRule: "Colliery Control Rules 2004 & Mines Act 1952 Section 48",
    penaltyClause: "Suspension of mining lease clearances, fiscal penalties, and show-cause order",
  },
  {
    id: "reg-5",
    code: "DGMS-TC-02-23",
    title: "Strata Control & Slope Stability Hazard Zoning (SSMAP)",
    category: "Mine Safety",
    authority: "DGMS Technical Directorate",
    frequency: "Fortnightly Strata Audit & Radar Telemetry",
    description: "Scientific Strata Management and Monitoring Plan using resin-grouted roof bolts, ultrasonic tell-tales, and slope stability radars (SSR) in opencast benches. Safe bench slopes maintained at statutory angles.",
    mandatoryRule: "DGMS Technical Circular 02 of 2023 & CMR 2017 Regulation 123",
    penaltyClause: "Immediate stoppage of coal extraction in galleries with excessive bed separation",
  },
  {
    id: "reg-6",
    code: "AP-1981-CAAQ",
    title: "Ambient Air Quality & Fugitive Dust Suppression Standard",
    category: "Environment",
    authority: "State Pollution Control Board (SPCB) & MoEFCC",
    frequency: "Continuous CAAQMS Monitoring",
    description: "Real-time monitoring of PM10 and PM2.5 levels at mine periphery, haul roads, and coal handling plants (CHP). Installation of high-pressure mist cannons and mechanized water sprinklers is mandatory.",
    mandatoryRule: "Air (Prevention & Control of Pollution) Act 1981 & National Ambient Air Quality Standards",
    penaltyClause: "Immediate curtailment of transportation movements and show-cause notice",
  },
  {
    id: "reg-7",
    code: "MR-1955-R29B",
    title: "Periodic Medical Examination (PME) & Audiometric Screening",
    category: "Labour & Welfare",
    authority: "DGMS Occupational Health Division",
    frequency: "5-Year Cycle (<45 yrs) / 3-Year Cycle (>=45 yrs)",
    description: "Standardized medical evaluation including ILO chest X-rays for early pneumoconiosis detection, pure tone audiometry for hearing thresholds, and spirometry for lung capacity across all site workers.",
    mandatoryRule: "Mines Rules 1955 Rule 29B, 29C & DGMS Circular 01/2018",
    penaltyClause: "De-rostering of unexamined personnel from high-dust/high-noise zones",
  },
  {
    id: "reg-8",
    code: "DGMS-SMS-HIRA",
    title: "Hazard Identification & Risk Assessment (HIRA) Register",
    category: "Statutory Reporting",
    authority: "National Mine Safety Council / DGMS",
    frequency: "Annual Comprehensive Audit & Revision",
    description: "Documented Hazard Identification and Risk Assessment (HIRA) establishing standard operating procedures (SOPs), Trigger Action Response Plans (TARPs), and annual safety performance indexes.",
    mandatoryRule: "DGMS Safety Management System (SMS) Circular 05 of 2016",
    penaltyClause: "Special audit under Section 22(1) and withholding of seasonal extraction permissions",
  },
];

// Responsible-person list — assigned_to is a free-text column in the
// database (not a foreign key), so this is just a convenience list for
// the dropdown. Replace with real profile names once there's a
// GET /api/profiles endpoint to pull them from.
const RESPONSIBLE_PERSONS = ["Dr. Sharma", "Mr. Verma", "Ms. Patel", "Mr. Singh", "Er. Reddy"];

// Computes the *effective* status for display: if something is still
// marked "pending" in the database but its due date has passed, show
// it as overdue without needing a cron job to flip the stored value.
function getUpdatedStatus(item: { due_date: string; status: string }): string {
  if (item.status === "completed") return "completed";
  try {
    const dueTime = new Date(item.due_date).getTime();
    const now = Date.now();
    if (dueTime < now) return "overdue";
  } catch {
    // fall through
  }
  return item.status;
}

const getStatusBadge = (status: string) => {
  const styles = {
    overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    urgent: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 animate-pulse",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  };
  return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
};

const formatDateShort = (dateStr: string) => {
  try {
    if (dateStr.split(" ").length === 2 && isNaN(Number(dateStr.split(" ")[0]))) {
      return dateStr;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch (e) {
    return dateStr;
  }
};

export default function CompliancePage() {
  const users = RESPONSIBLE_PERSONS;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [mineId, setMineId] = useState("");
  const [category, setCategory] = useState<any>("Safety");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<any>("medium");
  const [status, setStatus] = useState<any>("pending");
  const [documentName, setDocumentName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Advanced Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterMineId, setFilterMineId] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatusField, setFilterStatusField] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("all");
  const { session } = useSession();
  const isMineManager = session?.role === "MINE_MANAGER";
  const isRegulatoryAuthority = session?.role === "REGULATORY_AUTHORITY";
  const canCreate = session?.role !== "CORPORATE_MANAGEMENT" && session?.role !== "REGULATORY_AUTHORITY";
  const managerMineId = isMineManager ? session?.mineId : undefined;

  // Regulatory Authority view tabs and filters
  const [activeAuthorityTab, setActiveAuthorityTab] = useState<"tasks" | "regulations">("tasks");
  const [regulationSearch, setRegulationSearch] = useState("");
  const [regulationCategory, setRegulationCategory] = useState("all");
  const [selectedRegulation, setSelectedRegulation] = useState<RegulationStandard | null>(null);
  const [isRegulationModalOpen, setIsRegulationModalOpen] = useState(false);

  const filteredRegulations = useMemo(() => {
    return STATUTORY_REGULATIONS.filter((reg) => {
      const q = regulationSearch.toLowerCase();
      const matchesSearch =
        reg.title.toLowerCase().includes(q) ||
        reg.code.toLowerCase().includes(q) ||
        reg.authority.toLowerCase().includes(q) ||
        reg.mandatoryRule.toLowerCase().includes(q) ||
        reg.description.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (regulationCategory !== "all" && reg.category !== regulationCategory) return false;
      return true;
    });
  }, [regulationSearch, regulationCategory]);

  const handleExportRegulations = () => {
    try {
      const headers = [
        "Regulation Code",
        "Title",
        "Category",
        "Authority",
        "Frequency",
        "Mandatory Rule",
        "Penalty Clause",
        "Description"
      ];
      const rows = filteredRegulations.map((r: RegulationStandard) => [
        r.code,
        r.title,
        r.category,
        r.authority,
        r.frequency,
        r.mandatoryRule,
        r.penaltyClause,
        r.description
      ]);
      downloadCSV(headers, rows, "Statutory_Mining_Regulations_Framework.csv");
      toast.success("Statutory regulations framework exported to CSV");
    } catch {
      toast.error("Failed to export regulations");
    }
  };

  const [appliedFilters, setAppliedFilters] = useState({
    mineId: "all",
    category: "all",
    status: "all",
    priority: "all",
    dateRange: "all"
  });

  // Live data from Supabase — replaces the old localStorage-backed
  // complianceService. useCompliance() also subscribes to realtime
  // changes, so this list updates automatically for every user.
  const { data: items = [], isLoading: itemsLoading } = useCompliance(
    managerMineId ? { mineId: managerMineId } : {}
  );
  const { data: mines = [] } = useMines();
  const createCompliance = useCreateCompliance();
  const updateStatus = useUpdateComplianceStatus();

  useEffect(() => {
    if (session?.role === "MINE_MANAGER" && session?.mineId) {
      setMineId(session.mineId);
      setFilterMineId(session.mineId);
      setAppliedFilters(prev => ({ ...prev, mineId: session.mineId || "all" }));
    }
  }, [session]);

  const handleExport = () => {
    try {
      const headers = [
        "Compliance ID", 
        "Requirement", 
        "Mine Name", 
        "Category", 
        "Responsible Person", 
        "Due Date", 
        "Priority", 
        "Status", 
        "Description", 
        "Created At"
      ];
      const rows = filteredData.map(item => [
        item.id,
        item.title,
        item.mine_name ?? "",
        item.category,
        item.assigned_to,
        item.due_date,
        item.priority,
        getUpdatedStatus(item),
        item.description,
        item.created_at || ""
      ]);
      const dateStr = new Date().toISOString().split("T")[0];
      downloadCSV(headers, rows, `coalgov360-compliance-${dateStr}.csv`);
      toast.success("Compliance report exported successfully!");
    } catch (e) {
      toast.error("Unable to export compliance data.");
    }
  };

  const handleOpenModal = () => {
    const targetMine = isMineManager ? (session?.mineId || "47d2d435-8bae-49ca-b8d2-b6e71b407e9b") : (mineId || mines[0]?.id || "");
    setMineId(targetMine);
    if (!assignedTo && users.length > 0) {
      setAssignedTo(users[0]);
    }
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setDueDate(nextWeek.toISOString().split("T")[0]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTitle("");
    setMineId(isMineManager && session?.mineId ? session.mineId : "");
    setCategory("Safety");
    setDescription("");
    setAssignedTo("");
    setDueDate("");
    setPriority("medium");
    setStatus("pending");
    setDocumentName("");
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalMineId = (isMineManager ? (session?.mineId || "47d2d435-8bae-49ca-b8d2-b6e71b407e9b") : mineId) || "47d2d435-8bae-49ca-b8d2-b6e71b407e9b";

    // Validation
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Requirement name is required";
    if (!finalMineId) newErrors.mineId = "Mine selection is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!assignedTo) newErrors.assignedTo = "Responsible person selection is required";
    if (!dueDate) {
      newErrors.dueDate = "Due date is required";
    } else {
      const timestamp = Date.parse(dueDate);
      if (isNaN(timestamp)) {
        newErrors.dueDate = "Due date must be a valid date";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }

    createCompliance.mutate(
      {
        title,
        mineId: finalMineId,
        category,
        assignedTo,
        description,
        dueDate,
        priority,
        status,
        documentName: documentName || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Compliance item created successfully!");
          handleCloseModal();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error ?? "Failed to create compliance item.");
        },
      }
    );
  };

  const handleCompleteItem = (id: string) => {
    updateStatus.mutate(
      { id, status: "completed" },
      {
        onSuccess: () => toast.success("Compliance status marked as Completed!"),
        onError: (err: any) => toast.error(err?.response?.data?.error ?? "Failed to update status."),
      }
    );
  };

  const activeFiltersCount = [
    appliedFilters.mineId !== "all" && (!session || session.role !== "MINE_MANAGER"),
    appliedFilters.category !== "all",
    appliedFilters.status !== "all",
    appliedFilters.priority !== "all",
    appliedFilters.dateRange !== "all"
  ].filter(Boolean).length;

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters({
      mineId: filterMineId,
      category: filterCategory,
      status: filterStatusField,
      priority: filterPriority,
      dateRange: filterDateRange
    });
    setIsFilterOpen(false);
    toast.success("Filters applied successfully!");
  };

  const handleResetFilters = () => {
    const isManager = session?.role === "MINE_MANAGER";
    const initialMine = isManager ? (session.mineId || "all") : "all";
    setFilterMineId(initialMine);
    setFilterCategory("all");
    setFilterStatusField("all");
    setFilterPriority("all");
    setFilterDateRange("all");
    setAppliedFilters({
      mineId: initialMine,
      category: "all",
      status: "all",
      priority: "all",
      dateRange: "all"
    });
    setIsFilterOpen(false);
    toast.success("Filters cleared!");
  };

  const filteredData = items.filter(item => {
    // 1. Search Query
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.mine_name ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // 2. Status Tab Filter
    const currentStatus = getUpdatedStatus(item);
    let matchesTab = true;
    if (filterStatus === "overdue") {
      matchesTab = currentStatus === "overdue";
    } else if (filterStatus === "urgent") {
      matchesTab = (item.priority === "high" || item.priority === "critical") && currentStatus !== "completed";
    } else if (filterStatus === "pending") {
      matchesTab = currentStatus === "pending" || currentStatus === "in-progress";
    } else if (filterStatus === "completed") {
      matchesTab = currentStatus === "completed";
    }
    if (!matchesTab) return false;

    // 3. Applied Mine Filter (only for multi-mine roles, since MINE_MANAGER items are already scoped via API)
    if (!isMineManager && appliedFilters.mineId !== "all" && item.mine_id !== appliedFilters.mineId) {
      return false;
    }

    // 4. Applied Category Filter
    if (appliedFilters.category !== "all" && item.category !== appliedFilters.category) return false;

    // 5. Applied Status Filter
    if (appliedFilters.status !== "all" && currentStatus !== appliedFilters.status) return false;

    // 6. Applied Priority Filter
    if (appliedFilters.priority !== "all" && item.priority !== appliedFilters.priority) return false;

    // 7. Applied Date Range Filter
    if (appliedFilters.dateRange !== "all") {
      const dueDate = new Date(item.due_date);
      const now = new Date();
      now.setHours(0,0,0,0);
      
      if (appliedFilters.dateRange === "overdue") {
        if (currentStatus !== "overdue") return false;
      } else if (appliedFilters.dateRange === "week") {
        const startOfWeek = new Date(now);
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + 7);
        if (dueDate < startOfWeek || dueDate > endOfWeek) return false;
      } else if (appliedFilters.dateRange === "month") {
        const startOfMonth = new Date(now);
        const endOfMonth = new Date(now);
        endOfMonth.setMonth(now.getMonth() + 1);
        if (dueDate < startOfMonth || dueDate > endOfMonth) return false;
      }
    }

    return true;
  });

  const stats = {
    total: items.length,
    overdue: items.filter(i => getUpdatedStatus(i) === "overdue").length,
    pending: items.filter(i => { const s = getUpdatedStatus(i); return s === "pending" || s === "in-progress"; }).length,
    completed: items.filter(i => getUpdatedStatus(i) === "completed").length,
  };

  return (
    <>
      <Header />
      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-yellow-600" />
              Compliance Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isMineManager ? "Track and manage compliance requirements for your mine" : "Track and manage compliance requirements across all mines"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canCreate && (
              <Button 
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                onClick={handleOpenModal}
              >
                <Plus className="mr-2 h-4 w-4" /> New Compliance
              </Button>
            )}
            <Button
              variant="outline"
              onClick={
                activeAuthorityTab === "regulations"
                  ? handleExportRegulations
                  : handleExport
              }
            >
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {/* Compliance View Switcher — Available to all roles */}
        <div className="flex items-center gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl w-fit border border-gray-200 dark:border-gray-800">
          <Button
            variant={activeAuthorityTab === "tasks" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveAuthorityTab("tasks")}
            className={
              activeAuthorityTab === "tasks"
                ? "bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400"
            }
          >
            <FileCheck className="h-4 w-4 mr-2" />
            Mine Compliance Audits
          </Button>
          <Button
            variant={activeAuthorityTab === "regulations" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveAuthorityTab("regulations")}
            className={
              activeAuthorityTab === "regulations"
                ? "bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400"
            }
          >
            <BookOpen className="h-4 w-4 mr-2" />
            📚 Statutory Regulations (National Mandates)
          </Button>
        </div>

        {activeAuthorityTab === "regulations" ? (
          <div className="space-y-6">
            {/* Regulatory Authority Overview Banner */}
            <Card className="border-l-4 border-l-yellow-600 bg-gradient-to-r from-yellow-50/50 to-white dark:from-yellow-950/20 dark:to-gray-900">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-yellow-600" />
                    <h2 className="font-semibold text-lg">National Statutory Regulations & Compliance Codes</h2>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Statutory repository of DGMS, MoEFCC, and Mines Act standards that all operating coal mines are legally required to follow.
                  </p>
                </div>
                <Badge variant="outline" className="border-yellow-400 bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-300 px-3 py-1 text-xs w-fit shrink-0">
                  Regulatory Authority Reference
                </Badge>
              </CardContent>
            </Card>

            {/* Regulatory Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">Total Statutory Mandates</p>
                  <p className="text-2xl font-bold">{STATUTORY_REGULATIONS.length}</p>
                </CardContent>
              </Card>
              <Card className="border-red-200">
                <CardContent className="p-4">
                  <p className="text-sm text-red-600">Mine Safety Standards</p>
                  <p className="text-2xl font-bold text-red-600">
                    {STATUTORY_REGULATIONS.filter((r) => r.category === "Mine Safety").length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardContent className="p-4">
                  <p className="text-sm text-green-600">Environmental Codes</p>
                  <p className="text-2xl font-bold text-green-600">
                    {STATUTORY_REGULATIONS.filter((r) => r.category === "Environment").length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-600">Labour & Reporting</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {STATUTORY_REGULATIONS.filter((r) => r.category === "Labour & Welfare" || r.category === "Statutory Reporting").length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Search & Category Filter */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search regulation, rule, or authority..."
                  className="pl-9"
                  value={regulationSearch}
                  onChange={(e) => setRegulationSearch(e.target.value)}
                />
              </div>

              <Tabs value={regulationCategory} onValueChange={setRegulationCategory} className="w-auto">
                <TabsList>
                  <TabsTrigger value="all">All ({STATUTORY_REGULATIONS.length})</TabsTrigger>
                  <TabsTrigger value="Mine Safety">Safety</TabsTrigger>
                  <TabsTrigger value="Environment">Environment</TabsTrigger>
                  <TabsTrigger value="Labour & Welfare">Labour</TabsTrigger>
                  <TabsTrigger value="Statutory Reporting">Reporting</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Regulations Table */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Statutory Requirements & Mandates Registry</CardTitle>
                    <CardDescription>
                      Showing {filteredRegulations.length} legal standard{filteredRegulations.length === 1 ? "" : "s"}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportRegulations}>
                    <Download className="h-4 w-4 mr-2" /> Download Standards
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 uppercase border-b">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Regulation / Requirement</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Authority / Mandate</th>
                      <th className="px-4 py-3">Audit Frequency</th>
                      <th className="px-4 py-3">Enforcement Action</th>
                      <th className="px-4 py-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredRegulations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          No regulations found matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRegulations.map((reg: RegulationStandard) => (
                        <tr key={reg.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                          <td className="px-4 py-3.5 font-mono text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                            {reg.code}
                          </td>
                          <td className="px-4 py-3.5 font-medium max-w-xs">
                            <p className="line-clamp-1">{reg.title}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{reg.mandatoryRule}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge
                              variant="outline"
                              className={
                                reg.category === "Mine Safety"
                                  ? "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                                  : reg.category === "Environment"
                                  ? "border-green-300 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                  : reg.category === "Labour & Welfare"
                                  ? "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                                  : "border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                              }
                            >
                              {reg.category}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-gray-300">
                            {reg.authority}
                          </td>
                          <td className="px-4 py-3.5 text-xs">
                            {reg.frequency}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-red-600 dark:text-red-400 max-w-[200px] truncate" title={reg.penaltyClause}>
                            {reg.penaltyClause}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-yellow-700 hover:text-yellow-800 dark:text-yellow-400"
                              onClick={() => {
                                setSelectedRegulation(reg);
                                setIsRegulationModalOpen(true);
                              }}
                            >
                              Inspect
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Total Tasks</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="p-4">
              <p className="text-sm text-red-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardContent className="p-4">
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-4">
              <p className="text-sm text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search compliance tasks..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
                <TabsTrigger value="urgent">Urgent</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsFilterOpen(true)}
              className={activeFiltersCount > 0 ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 border-yellow-200 font-medium" : ""}
            >
              <Filter className="h-4 w-4 mr-2" /> Filter {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </div>
        </div>

        {/* Compliance List */}
        <Card>
          <CardContent className="p-0">
            <div className="rounded-lg overflow-hidden">
              <div className="grid grid-cols-6 gap-4 bg-gray-50 p-3 text-xs font-medium text-gray-500 dark:bg-gray-800">
                <span className="col-span-2">Task</span>
                <span>Mine</span>
                <span>Status</span>
                <span>Due Date</span>
                <span className="text-right">Action</span>
              </div>
              {itemsLoading ? (
                <div className="p-12 text-center text-sm text-gray-500">Loading compliance tasks…</div>
              ) : filteredData.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center border border-gray-100 dark:border-gray-800">
                    <Filter className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">No compliance tasks found</p>
                    <p className="text-xs text-gray-500 mt-1">Try changing or clearing your applied filter conditions.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleResetFilters}
                    className="border-yellow-600/35 hover:bg-yellow-50/50 hover:text-yellow-700 text-yellow-600"
                  >
                    Reset Filters
                  </Button>
                </div>
              ) : (
                filteredData.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-6 gap-4 border-t p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="col-span-2">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-gray-500">Assigned to: {item.assigned_to} · <span className="font-semibold text-yellow-600">{item.category}</span></p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm">{item.mine_name}</span>
                    </div>
                    <div className="flex items-center">
                      <Badge className={getStatusBadge(getUpdatedStatus(item))}>
                        {getUpdatedStatus(item).toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDateShort(item.due_date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-950/20 font-medium" 
                        onClick={() => {
                          setSelectedItem(item);
                          setIsDetailsOpen(true);
                        }}
                      >
                        View
                      </Button>
                      {getUpdatedStatus(item) !== "completed" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-green-600 hover:text-green-700"
                          onClick={() => handleCompleteItem(item.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </main>

      {/* Regulation Details Dialog Modal */}
      <Dialog open={isRegulationModalOpen} onOpenChange={setIsRegulationModalOpen}>
        <DialogContent className="sm:max-w-xl rounded-2xl bg-white dark:bg-gray-950 p-6 border border-gray-200 dark:border-gray-800">
          {selectedRegulation && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                    {selectedRegulation.code}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      selectedRegulation.category === "Mine Safety"
                        ? "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                        : selectedRegulation.category === "Environment"
                        ? "border-green-300 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                        : selectedRegulation.category === "Labour & Welfare"
                        ? "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                        : "border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                    }
                  >
                    {selectedRegulation.category}
                  </Badge>
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight mt-1">{selectedRegulation.title}</DialogTitle>
                <DialogDescription>
                  Statutory regulatory standard enforced by <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedRegulation.authority}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-sm">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Governing Legal Mandate</h4>
                  <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">{selectedRegulation.mandatoryRule}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit & Testing Schedule</h4>
                  <p className="text-gray-700 dark:text-gray-300 mt-0.5">{selectedRegulation.frequency}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Statutory Standard Requirements</h4>
                  <p className="text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                    {selectedRegulation.description}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold text-xs uppercase">
                    <ShieldAlert className="h-4 w-4 shrink-0" /> Non-Compliance Penalty / Enforcement Clause
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1 font-medium">{selectedRegulation.penaltyClause}</p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRegulationModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Compliance Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-lg rounded-2xl bg-white dark:bg-gray-950 p-6 border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Create New Compliance</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              Add statutory and safety requirement details to track compliance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">Compliance / Requirement Name *</Label>
              <Input
                id="title"
                placeholder="Environmental Clearance Renewal"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors(prev => ({ ...prev, title: "" }));
                }}
                className="w-full"
              />
              {errors.title && <p className="text-xs text-red-600 font-medium">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {isMineManager ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mine</Label>
                  <div className="h-9 flex items-center px-3 rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/60 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {session.mineName || mines.find(m => m.id === session.mineId)?.name || "Assigned Mine"}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="mine" className="text-sm font-medium">Mine *</Label>
                  <select
                    id="mine"
                    value={mineId}
                    onChange={e => {
                      setMineId(e.target.value);
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
              )}

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                <select
                  id="category"
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm transition-colors outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                >
                  <option value="Safety">Safety</option>
                  <option value="Environment">Environment</option>
                  <option value="Labour">Labour</option>
                  <option value="Production">Production</option>
                  <option value="Statutory">Statutory</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Requirement Description *</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Submit the required environmental compliance report..."
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors(prev => ({ ...prev, description: "" }));
                }}
                className="w-full min-h-[80px] rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm transition-colors outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
              />
              {errors.description && <p className="text-xs text-red-600 font-medium">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTo" className="text-sm font-medium">Responsible Person *</Label>
                <select
                  id="assignedTo"
                  value={assignedTo}
                  onChange={e => {
                    setAssignedTo(e.target.value);
                    if (errors.assignedTo) setErrors(prev => ({ ...prev, assignedTo: "" }));
                  }}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm transition-colors outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                >
                  <option value="">Select Responsible Person</option>
                  {users.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                {errors.assignedTo && <p className="text-xs text-red-600 font-medium">{errors.assignedTo}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-sm font-medium">Due Date *</Label>
                <input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={e => {
                    setDueDate(e.target.value);
                    if (errors.dueDate) setErrors(prev => ({ ...prev, dueDate: "" }));
                  }}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm transition-colors outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                />
                {errors.dueDate && <p className="text-xs text-red-600 font-medium">{errors.dueDate}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium">Priority / Risk *</Label>
                <select
                  id="priority"
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm transition-colors outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">Status *</Label>
                <select
                  id="status"
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm transition-colors outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document" className="text-sm font-medium">Reference Document</Label>
              <input
                id="document"
                type="file"
                accept=".pdf, image/*"
                onChange={e => {
                  if (e.target.files && e.target.files.length > 0) {
                    setDocumentName(e.target.files[0].name);
                  }
                }}
                className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-base transition-colors outline-none file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-yellow-50 file:text-yellow-700 dark:file:bg-yellow-950/30 dark:file:text-yellow-400 hover:file:bg-yellow-100 md:text-sm"
              />
            </div>

            <DialogFooter className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white" disabled={createCompliance.isPending}>
                {createCompliance.isPending ? "Creating..." : "Create Compliance"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Compliance Details Dialog Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={(open) => !open && setIsDetailsOpen(false)}>
        <DialogContent className="sm:max-w-lg rounded-2xl bg-white dark:bg-gray-950 p-6 border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Compliance Details</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              Complete tracking and metadata audit trail for this statutory requirement.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 py-4 text-sm">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">{selectedItem.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">ID: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono">{selectedItem.id}</code></p>
                </div>
                <Badge className={getStatusBadge(getUpdatedStatus(selectedItem))}>
                  {getUpdatedStatus(selectedItem).toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Mine Location</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{selectedItem.mine_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Category</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{selectedItem.category}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Responsible Person</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{selectedItem.assigned_to}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Due Date</p>
                  <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400 shrink-0" /> {new Date(selectedItem.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Priority / Risk Level</p>
                  <Badge variant="outline" className="mt-1 font-semibold uppercase">{selectedItem.priority}</Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Reference Document</p>
                  <p className="font-medium text-yellow-600 mt-1 cursor-pointer hover:underline">
                    {selectedItem.document_name || "No attached document"}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 border-b border-gray-100 dark:border-gray-800 pb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">Requirement Description</p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  {selectedItem.description}
                </p>
              </div>

              <DialogFooter className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                {getUpdatedStatus(selectedItem) !== "completed" && (
                  <Button 
                    type="button" 
                    className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                    onClick={() => {
                      handleCompleteItem(selectedItem.id);
                      setIsDetailsOpen(false);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Mark Completed
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Advanced Filters Dialog Modal */}
      <Dialog open={isFilterOpen} onOpenChange={(open) => !open && setIsFilterOpen(false)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-950 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Filter Compliance Tasks</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              Select multiple parameters to refine the tasks list.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApplyFilters} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filter-mine" className="text-sm font-medium">Mine Location</Label>
              <select
                id="filter-mine"
                value={filterMineId}
                disabled={session?.role === "MINE_MANAGER"}
                onChange={(e) => setFilterMineId(e.target.value)}
                className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20 disabled:opacity-85 disabled:cursor-not-allowed"
              >
                {session?.role !== "MINE_MANAGER" && <option value="all">All Mines</option>}
                {mines.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter-category" className="text-sm font-medium">Category</Label>
                <select
                  id="filter-category"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                >
                  <option value="all">All Categories</option>
                  <option value="Safety">Safety</option>
                  <option value="Environment">Environment</option>
                  <option value="Labour">Labour</option>
                  <option value="Production">Production</option>
                  <option value="Statutory">Statutory</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-status" className="text-sm font-medium">Status</Label>
                <select
                  id="filter-status"
                  value={filterStatusField}
                  onChange={(e) => setFilterStatusField(e.target.value)}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter-priority" className="text-sm font-medium">Priority</Label>
                <select
                  id="filter-priority"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-date" className="text-sm font-medium">Due Date</Label>
                <select
                  id="filter-date"
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                  className="h-9 w-full rounded-4xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20"
                >
                  <option value="all">All Dates</option>
                  <option value="overdue">Overdue</option>
                  <option value="week">Due This Week</option>
                  <option value="month">Due This Month</option>
                </select>
              </div>
            </div>

            <DialogFooter className="mt-6 flex justify-end gap-2 pt-4 border-t dark:border-gray-800">
              <Button type="button" variant="outline" onClick={handleResetFilters}>Reset Filters</Button>
              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white">Apply Filters</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}