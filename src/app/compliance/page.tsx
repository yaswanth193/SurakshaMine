"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { complianceService, getUpdatedStatus, type ComplianceItem, type Mine } from "@/lib/complianceService";
import { downloadCSV } from "@/lib/exportUtils";
import { useSession } from "@/hooks/useSession";

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
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [mines, setMines] = useState<Mine[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  
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

  const [appliedFilters, setAppliedFilters] = useState({
    mineId: "all",
    category: "all",
    status: "all",
    priority: "all",
    dateRange: "all"
  });

  useEffect(() => {
    setItems(complianceService.getComplianceItems());
    setMines(complianceService.getMines());
    setUsers(complianceService.getUsers());
  }, []);

  useEffect(() => {
    if (session?.role === "MINE_MANAGER") {
      setFilterMineId(session.mineId || "M1");
      setAppliedFilters(prev => ({ ...prev, mineId: session.mineId || "M1" }));
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
        item.mineName,
        item.category,
        item.assignedTo,
        item.dueDate,
        item.priority,
        getUpdatedStatus(item),
        item.description,
        item.createdAt || ""
      ]);
      const dateStr = new Date().toISOString().split("T")[0];
      downloadCSV(headers, rows, `coalgov360-compliance-${dateStr}.csv`);
      toast.success("Compliance report exported successfully!");
    } catch (e) {
      toast.error("Unable to export compliance data.");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTitle("");
    setMineId("");
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
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Requirement name is required";
    if (!mineId) newErrors.mineId = "Mine selection is required";
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

    const mineObj = mines.find(m => m.id === mineId);
    const mineName = mineObj ? mineObj.name : "Unknown Mine";

    complianceService.createComplianceItem({
      title,
      mineId,
      mineName,
      status,
      dueDate,
      priority,
      category,
      assignedTo,
      description,
      documentName: documentName || undefined
    });

    // Refresh state
    setItems(complianceService.getComplianceItems());
    toast.success("Compliance item created successfully!");
    handleCloseModal();
  };

  const handleCompleteItem = (id: string) => {
    const allItems = complianceService.getComplianceItems();
    const updated = allItems.map(item => {
      if (item.id === id) {
        return { ...item, status: "completed" as const };
      }
      return item;
    });
    localStorage.setItem("coalgov360_compliance", JSON.stringify(updated));
    setItems(complianceService.getComplianceItems());
    toast.success("Compliance status marked as Completed!");
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
    const initialMine = isManager ? (session.mineId || "M1") : "all";
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
                          item.mineName.toLowerCase().includes(searchQuery.toLowerCase());
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

    // 3. Applied Mine Filter
    let activeMine = appliedFilters.mineId;
    if (session && session.role === "MINE_MANAGER") {
      activeMine = session.mineId || "M1";
    }
    if (activeMine !== "all" && item.mineId !== activeMine) return false;

    // 4. Applied Category Filter
    if (appliedFilters.category !== "all" && item.category !== appliedFilters.category) return false;

    // 5. Applied Status Filter
    if (appliedFilters.status !== "all" && currentStatus !== appliedFilters.status) return false;

    // 6. Applied Priority Filter
    if (appliedFilters.priority !== "all" && item.priority !== appliedFilters.priority) return false;

    // 7. Applied Date Range Filter
    if (appliedFilters.dateRange !== "all") {
      const dueDate = new Date(item.dueDate);
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

  const stats = complianceService.calculateComplianceStats(items);

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
              Track and manage compliance requirements across all mines
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> New Compliance
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
              {filteredData.length === 0 ? (
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
                      <p className="text-xs text-gray-500">Assigned to: {item.assignedTo} · <span className="font-semibold text-yellow-600">{item.category}</span></p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm">{item.mineName}</span>
                    </div>
                    <div className="flex items-center">
                      <Badge className={getStatusBadge(getUpdatedStatus(item))}>
                        {getUpdatedStatus(item).toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDateShort(item.dueDate)}
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
      </main>

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
              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white">Create Compliance</Button>
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
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{selectedItem.mineName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Category</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{selectedItem.category}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Responsible Person</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{selectedItem.assignedTo}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Due Date</p>
                  <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400 shrink-0" /> {new Date(selectedItem.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
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
                    {selectedItem.documentName || "No attached document"}
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