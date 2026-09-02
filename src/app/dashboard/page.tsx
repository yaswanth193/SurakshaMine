// "use client";

// import { useState, useMemo, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { complianceService, getUpdatedStatus, type ComplianceItem } from "@/lib/complianceService";
// import { insightService } from "@/lib/insightService";
// import { Header } from "@/components/layout/Header";
// import { 
//   ArrowUpRight, 
//   ArrowDownRight, 
//   Minus,
//   CheckCircle2, 
//   Users, 
//   Building2,
//   Filter,
//   Calendar,
//   Download,
  
//   Eye,
//   ChevronRight,
  
//   Loader2,
//   Zap,
//   Activity,
//   MapPin,
 
//   FileCheck,
//   ClipboardList,
//   AlertTriangle,
  
//   } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { downloadSummaryReport } from "@/lib/exportUtils";
// import { inspectionService } from "@/lib/inspectionService";
// import { incidentService } from "@/lib/incidentService";
// import { getRoleDisplayName } from "@/lib/permissions";
// import { useSession } from "@/hooks/useSession";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { 
//   Select, 
//   SelectContent, 
//   SelectItem, 
//   SelectTrigger, 
//   SelectValue 
// } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Skeleton } from "@/components/ui/skeleton";
// import { toast } from "sonner";
// import { motion } from "framer-motion";

// // ============================================================
// // TYPES
// // ============================================================
// interface Mine {
//   id: string;
//   name: string;
//   location: string;
//   riskScore: number;
//   riskStatus: "critical" | "high" | "medium" | "low" | "safe";
//   complianceScore: number;
//   lastInspection: string;
//   pendingViolations: number;
//   workersOnSite: number;
//   type: "underground" | "opencast";
//   status: "active" | "inactive" | "maintenance";
// }

// // ComplianceItem type is imported from complianceService

// interface Activity {
//   id: string;
//   type: "inspection" | "violation" | "compliance" | "alert" | "incident" | "system";
//   message: string;
//   mineName: string;
//   time: string;
//   user: string;
//   priority?: "high" | "medium" | "low";
//   read: boolean;
// }

// interface DashboardStats {
//   totalMines: number;
//   complianceScore: number;
//   openViolations: number;
//   pendingInspections: number;
//   activeWorkers: number;
//   aiAlerts: number;
//   trends: {
//     compliance: number;
//     violations: number;
//     inspections: number;
//     workers: number;
//   };
// }

// // ============================================================
// // MOCK DATA
// // ============================================================
// const mockMines: Mine[] = [
//   { id: "M1", name: "Mine A", location: "Jharkhand", riskScore: 82, riskStatus: "critical", complianceScore: 67, lastInspection: "2026-08-15", pendingViolations: 5, workersOnSite: 342, type: "underground", status: "active" },
//   { id: "M2", name: "Mine B", location: "Odisha", riskScore: 76, riskStatus: "high", complianceScore: 72, lastInspection: "2026-08-12", pendingViolations: 3, workersOnSite: 287, type: "opencast", status: "active" },
//   { id: "M3", name: "Mine C", location: "Madhya Pradesh", riskScore: 62, riskStatus: "medium", complianceScore: 78, lastInspection: "2026-08-18", pendingViolations: 2, workersOnSite: 156, type: "underground", status: "maintenance" },
//   { id: "M4", name: "Mine D", location: "Chhattisgarh", riskScore: 28, riskStatus: "safe", complianceScore: 91, lastInspection: "2026-08-20", pendingViolations: 0, workersOnSite: 412, type: "opencast", status: "active" },
//   { id: "M5", name: "Mine E", location: "West Bengal", riskScore: 34, riskStatus: "safe", complianceScore: 88, lastInspection: "2026-08-22", pendingViolations: 1, workersOnSite: 289, type: "underground", status: "active" },
//   { id: "M6", name: "Mine F", location: "Telangana", riskScore: 45, riskStatus: "medium", complianceScore: 82, lastInspection: "2026-08-10", pendingViolations: 2, workersOnSite: 178, type: "opencast", status: "active" },
// ];

// // mockCompliance is loaded dynamically from complianceService

// const mockActivities: Activity[] = [
//   { id: "A1", type: "inspection", message: "Mine A inspection completed", mineName: "Mine A", time: "2 hours ago", user: "Dr. Sharma", read: false },
//   { id: "A2", type: "violation", message: "New violation reported at Mine B", mineName: "Mine B", time: "4 hours ago", user: "Mr. Verma", priority: "high", read: false },
//   { id: "A3", type: "compliance", message: "Mine C submitted environmental report", mineName: "Mine C", time: "6 hours ago", user: "Ms. Patel", read: true },
//   { id: "A4", type: "alert", message: "AI alert: Mine D risk score increasing", mineName: "Mine D", time: "8 hours ago", user: "AI System", priority: "medium", read: false },
//   { id: "A5", type: "system", message: "System maintenance scheduled for 28 Aug", mineName: "All Mines", time: "12 hours ago", user: "System", read: true },
//   { id: "A6", type: "incident", message: "Minor equipment incident at Mine F", mineName: "Mine F", time: "1 day ago", user: "Mr. Kumar", priority: "high", read: false },
// ];

// const mockStats: DashboardStats = {
//   totalMines: 18,
//   complianceScore: 74,
//   openViolations: 23,
//   pendingInspections: 9,
//   activeWorkers: 1247,
//   aiAlerts: 6,
//   trends: {
//     compliance: 5.2,
//     violations: -3,
//     inspections: -2,
//     workers: 124,
//   }
// };

// // ============================================================
// // UTILITY FUNCTIONS
// // ============================================================
// const formatDate = (date: string) => {
//   return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
// };

// const getStatusColor = (status: string) => {
//   const colors = {
//     overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
//     urgent: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
//     pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
//     "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
//     completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
//   };
//   return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
// };

// const getRiskColor = (status: string) => {
//   const colors = {
//     critical: "bg-red-600 text-white",
//     high: "bg-red-500 text-white",
//     medium: "bg-yellow-500 text-white",
//     low: "bg-orange-400 text-white",
//     safe: "bg-green-500 text-white",
//   };
//   return colors[status as keyof typeof colors] || "bg-gray-500 text-white";
// };

// const getRiskScoreClass = (score: number) => {
//   if (score >= 70) return "text-red-600 bg-red-50 dark:bg-red-950/30";
//   if (score >= 50) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30";
//   return "text-green-600 bg-green-50 dark:bg-green-950/30";
// };

// // ============================================================
// // MAIN DASHBOARD COMPONENT
// // ============================================================
// export default function DashboardPage() {
//   const router = useRouter();
//   const [selectedMineId, setSelectedMineId] = useState<string>("all");
//   const [searchQuery] = useState("");
//   const [timeRange, setTimeRange] = useState("week");
//   const [isLoading, setIsLoading] = useState(false);
//   const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
//   const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
//   const { session } = useSession();
//   const [selectedMine, setSelectedMine] = useState<Mine | null>(null);
//   const [isMineModalOpen, setIsMineModalOpen] = useState(false);
//   const [selectedCompliance, setSelectedCompliance] = useState<ComplianceItem | null>(null);
//   const [isComplianceDetailsOpen, setIsComplianceDetailsOpen] = useState(false);
//   const [dashboardComplianceTab, setDashboardComplianceTab] = useState("all");

//   useEffect(() => {
//     setComplianceItems(complianceService.getComplianceItems());
//   }, []);

//   const activeMineId = useMemo(() => {
//     if (session?.role === "MINE_MANAGER") {
//       return session.mineId || "M1";
//     }
//     return selectedMineId;
//   }, [session, selectedMineId]);

//   const dynamicStats = useMemo(() => {
//     const cItems = complianceItems.filter(item => activeMineId === "all" || item.mineId === activeMineId);
    
//     const allInspections = inspectionService.getInspections();
//     const iItems = allInspections.filter(item => activeMineId === "all" || item.mineId === activeMineId);
    
//     const allIncidents = incidentService.getIncidents();
//     const incItems = allIncidents.filter(item => activeMineId === "all" || item.mineId === activeMineId);

//     const compStats = complianceService.calculateComplianceStats(cItems);
//     const inspectStats = inspectionService.calculateStats(iItems);
//     const incidentStats = incidentService.calculateStats(incItems);

//     const totalMines = activeMineId === "all" ? mockMines.length : 1;
//     const complianceScore = compStats.total > 0 ? Math.round((compStats.completed / compStats.total) * 100) : 74;
//     const openViolations = compStats.overdue;
//     const pendingInspections = inspectStats.scheduled + inspectStats.inProgress;
    
//     const currentMine = mockMines.find(m => m.id === activeMineId);
//     const activeWorkers = activeMineId === "all" ? 1247 : (currentMine?.workersOnSite || 120);
//     const activeIncidentsCount = incidentStats.active;

//     return {
//       totalMines,
//       complianceScore,
//       openViolations,
//       pendingInspections,
//       activeWorkers,
//       activeIncidentsCount,
//     };
//   }, [complianceItems, activeMineId]);

//   // ============================================================
//   // DATA FILTERING
//   // ============================================================
//   const filteredMines = useMemo(() => {
//     return mockMines.filter(mine => {
//       const matchesSearch = mine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                             mine.location.toLowerCase().includes(searchQuery.toLowerCase());
//       const matchesMine = activeMineId === "all" || mine.id === activeMineId;
//       return matchesSearch && matchesMine;
//     });
//   }, [searchQuery, activeMineId]);

//   const filteredCompliance = useMemo(() => {
//     return complianceItems.filter(item => {
//       if (activeMineId !== "all" && item.mineId !== activeMineId) return false;

//       const currentStatus = getUpdatedStatus(item);
//       let matchesTab = true;
//       if (dashboardComplianceTab === "overdue") {
//         matchesTab = currentStatus === "overdue";
//       } else if (dashboardComplianceTab === "urgent") {
//         matchesTab = (item.priority === "high" || item.priority === "critical") && currentStatus !== "completed";
//       } else if (dashboardComplianceTab === "pending") {
//         matchesTab = currentStatus === "pending" || currentStatus === "in-progress";
//       } else if (dashboardComplianceTab === "completed") {
//         matchesTab = currentStatus === "completed";
//       }

//       return matchesTab;
//     });
//   }, [activeMineId, complianceItems, dashboardComplianceTab]);

//   const activeInsights = useMemo(() => {
//     const list = insightService.getInsights().filter(item => item.status === "active");
//     if (session?.role === "MINE_MANAGER") {
//       const mineId = session.mineId || "M1";
//       return list.filter(item => item.mineId === mineId);
//     }
//     return list;
//   }, [session]);

//   const bannerStats = useMemo(() => {
//     const alerts = activeInsights.filter(i => i.type === "alert").length;
//     const predictions = activeInsights.filter(i => i.type === "prediction").length;
//     const anomalies = activeInsights.filter(i => i.type === "anomaly").length;
//     return { alerts, predictions, anomalies };
//   }, [activeInsights]);

//   const filteredActivities = useMemo(() => {
//     return mockActivities.filter(activity => {
//       if (activeMineId !== "all") {
//         const selectedMine = mockMines.find(m => m.id === activeMineId);
//         if (selectedMine && activity.mineName !== selectedMine.name) return false;
//       }
//       return true;
//     });
//   }, [activeMineId]);

//   const highPriorityActivities = filteredActivities.filter(a => a.priority === "high" && !a.read);

//   // ============================================================
//   // ACTIONS
//   // ============================================================

//   const handleExport = () => {
//     const toastId = toast.loading("Generating summary report...");
//     setTimeout(() => {
//       try {
//         downloadSummaryReport();
//         toast.dismiss(toastId);
//         toast.success("Governance report exported successfully!");
//       } catch (e) {
//         toast.dismiss(toastId);
//         toast.error("Unable to generate the report. Please try again.");
//       }
//     }, 1000);
//   };

//   const handleMineClick = (mineId: string) => {
//     const mineObj = mockMines.find(m => m.id === mineId);
//     if (mineObj) {
//       setSelectedMine(mineObj);
//       setIsMineModalOpen(true);
//     }
//   };

//   const handleCompleteItem = (id: string) => {
//     const allItems = complianceService.getComplianceItems();
//     const updated = allItems.map(item => {
//       if (item.id === id) {
//         return { ...item, status: "completed" as const };
//       }
//       return item;
//     });
//     localStorage.setItem("coalgov360_compliance", JSON.stringify(updated));
//     setComplianceItems(complianceService.getComplianceItems());
//     toast.success("Compliance status marked as Completed!");
//   };

//   const handleAIScan = () => {
//     toast.loading("AI scan in progress...");
//     setIsLoading(true);
//     setTimeout(() => {
//       setIsLoading(false);
//       toast.dismiss();
//       toast.success("AI scan complete! 2 new insights found.");
//     }, 2500);
//   };

//   // ============================================================
//   // RENDER HELPERS
//   // ============================================================
//   const renderRiskBadge = (status: Mine["riskStatus"]) => {
//     const labels = {
//       critical: "Critical",
//       high: "High Risk",
//       medium: "At Risk",
//       low: "Low Risk",
//       safe: "Safe",
//     };
//     return (
//       <Badge className={`${getRiskColor(status)} px-3 py-1`}>
//         {labels[status]}
//       </Badge>
//     );
//   };

//   const renderStatusBadge = (status: ComplianceItem["status"]) => {
//     const labels = {
//       overdue: "Overdue",
//       urgent: "Urgent",
//       pending: "Pending",
//       "in-progress": "In Progress",
//       completed: "Completed",
//     };
//     return (
//       <Badge className={`${getStatusColor(status)} px-3 py-1`}>
//         {labels[status as keyof typeof labels] || status}
//       </Badge>
//     );
//   };

//   // ============================================================
//   // LOADING STATE
//   // ============================================================
//   if (isLoading) {
//     return (
//       <>
//         <Header />
//         <DashboardSkeleton />
//       </>
//     );
//   }

//   // ============================================================
//   // MAIN RENDER
//   // ============================================================
//   return (
//     <>
//       <Header />
//       <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
//         {/* Page Header */}
//         <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <div className="flex items-center gap-3">
//               <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
//               <Badge variant="outline" className="text-xs font-normal">v2.0 · Live</Badge>
//             </div>
//             <p className="text-sm text-gray-500 dark:text-gray-400">
//               Real-time governance overview for all CIL subsidiaries
//             </p>
//           </div>
//           <div className="flex flex-wrap items-center gap-2">
//             <select
//               value={activeMineId}
//               disabled={session?.role === "MINE_MANAGER"}
//               onChange={(e) => setSelectedMineId(e.target.value)}
//               className="h-9 rounded-4xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20 disabled:opacity-85 disabled:cursor-not-allowed mr-2"
//             >
//               {session?.role !== "MINE_MANAGER" && <option value="all">All Mines</option>}
//               {mockMines.map((m) => (
//                 <option key={m.id} value={m.id}>{m.name}</option>
//               ))}
//             </select>

//             <Select value={timeRange} onValueChange={setTimeRange}>
//               <SelectTrigger className="h-9 w-[130px] text-sm">
//                 <Calendar className="mr-2 h-4 w-4" />
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="today">Today</SelectItem>
//                 <SelectItem value="week">This Week</SelectItem>
//                 <SelectItem value="month">This Month</SelectItem>
//                 <SelectItem value="quarter">This Quarter</SelectItem>
//               </SelectContent>
//             </Select>

//             <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
//               <Download className="h-4 w-4" /> Generate Report
//             </Button>

//             <Button variant="outline" size="sm" className="gap-2">
//               <Filter className="h-4 w-4" /> Filter
//             </Button>

//             <Button size="sm" className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-white" onClick={handleAIScan} disabled={isLoading}>
//               {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
//               Run AI Scan
//             </Button>
//           </div>
//         </div>

//         {/* Stats Grid */}
//         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
//           <StatsCard title="Total Mines" value={dynamicStats.totalMines} icon={Building2} color="blue" change={0} changeType="neutral" />
//           <StatsCard title="Compliance Score" value={`${dynamicStats.complianceScore}%`} icon={FileCheck} color="green" change={mockStats.trends.compliance} changeType="up" />
//           <StatsCard title="Open Violations" value={dynamicStats.openViolations} icon={AlertTriangle} color="red" change={Math.abs(mockStats.trends.violations)} changeType="down" />
//           <StatsCard title="Pending Inspections" value={dynamicStats.pendingInspections} icon={ClipboardList} color="yellow" change={Math.abs(mockStats.trends.inspections)} changeType="down" />
//           <StatsCard title="Active Workers" value={dynamicStats.activeWorkers.toLocaleString()} icon={Users} color="purple" change={mockStats.trends.workers} changeType="up" />
//           <StatsCard 
//             title={session?.role === "MINE_MANAGER" ? "Active Incidents" : "AI Alerts"} 
//             value={session?.role === "MINE_MANAGER" ? dynamicStats.activeIncidentsCount : mockStats.aiAlerts} 
//             icon={Activity} 
//             color="orange" 
//             change={2} 
//             changeType="up" 
//           />
//         </div>

//         {/* Main Grid: Risk + Activity */}
//         <div className="mt-6 grid gap-6 lg:grid-cols-3">
//           {/* Risk Overview */}
//           <div className="lg:col-span-2">
//             <Card className="border-gray-200 dark:border-gray-800">
//               <CardHeader className="flex flex-row items-center justify-between">
//                 <div>
//                   <CardTitle>Mine Risk Overview</CardTitle>
//                   <CardDescription>Risk scores across all mines</CardDescription>
//                 </div>
//                 <Button variant="ghost" size="sm" className="gap-1 text-sm text-yellow-600 hover:text-yellow-700" onClick={() => router.push("/gis")}>
//                   View All <ChevronRight className="h-4 w-4" />
//                 </Button>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-3">
//                   {filteredMines.map((mine) => (
//                     <motion.div
//                       key={mine.id}
//                       initial={{ opacity: 0, y: 10 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ duration: 0.2 }}
//                       className="group flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50 transition-all"
//                       onClick={() => handleMineClick(mine.id)}
//                     >
//                       <div className="flex items-center gap-4">
//                         <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
//                           <span className="font-bold text-sm">{mine.name.replace("Mine ", "")}</span>
//                         </div>
//                         <div>
//                           <div className="flex items-center gap-2">
//                             <span className="font-medium">{mine.name}</span>
//                             {mine.status === "maintenance" && (
//                               <Badge variant="outline" className="text-xs">Maintenance</Badge>
//                             )}
//                           </div>
//                           <div className="flex items-center gap-3 text-xs text-gray-500">
//                             <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {mine.location}</span>
//                             <span>•</span>
//                             <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {mine.workersOnSite} workers</span>
//                             <span>•</span>
//                             <span className={`flex items-center gap-1 ${mine.type === "underground" ? "text-gray-600" : "text-yellow-600"}`}>
//                               {mine.type === "underground" ? "⬇ Underground" : "⛰ Opencast"}
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-4">
//                         <div className="flex items-center gap-3">
//                           <span className={`rounded-full px-3 py-1 text-sm font-bold ${getRiskScoreClass(mine.riskScore)}`}>
//                             {mine.riskScore}
//                           </span>
//                           {renderRiskBadge(mine.riskStatus)}
//                         </div>
//                         <ChevronRight className="h-4 w-4 text-gray-400" />
//                       </div>
//                     </motion.div>
//                   ))}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Right Column */}
//           <div className="space-y-6">
//             {/* Quick Stats */}
//             <Card className="border-gray-200 dark:border-gray-800">
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-base">Quick Stats</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="grid grid-cols-2 gap-3">
//                   <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors cursor-pointer">
//                     <p className="text-xs text-gray-600 dark:text-gray-400">Inspections</p>
//                     <p className="text-xl font-bold">42</p>
//                     <p className="text-xs text-green-600">▲ 8 vs last month</p>
//                   </div>
//                   <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors cursor-pointer">
//                     <p className="text-xs text-gray-600 dark:text-gray-400">Incidents</p>
//                     <p className="text-xl font-bold">7</p>
//                     <p className="text-xs text-red-600">▼ 2 vs last month</p>
//                   </div>
//                   <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors cursor-pointer">
//                     <p className="text-xs text-gray-600 dark:text-gray-400">Submissions</p>
//                     <p className="text-xl font-bold">156</p>
//                     <p className="text-xs text-green-600">▲ 23 vs last month</p>
//                   </div>
//                   <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors cursor-pointer">
//                     <p className="text-xs text-gray-600 dark:text-gray-400">Active Users</p>
//                     <p className="text-xl font-bold">48</p>
//                     <p className="text-xs text-gray-600">+12 this week</p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Activity Feed */}
//             <Card className="border-gray-200 dark:border-gray-800">
//               <CardHeader className="flex flex-row items-center justify-between pb-3">
//                 <CardTitle className="text-base">Activity Feed</CardTitle>
//                 <div className="flex items-center gap-2">
//                   {highPriorityActivities.length > 0 && (
//                     <Badge variant="destructive" className="text-xs">
//                       {highPriorityActivities.length} new
//                     </Badge>
//                   )}
//                   <Button variant="ghost" size="sm" className="h-7 text-xs">View All</Button>
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 <div className="h-[230px] overflow-y-auto pr-4">
//                   <div className="space-y-3">
//                     {filteredActivities.slice(0, 5).map((activity) => (
//                       <div
//                         key={activity.id}
//                         className={`flex items-start gap-3 rounded-lg border p-2 transition-colors ${
//                           !activity.read ? "bg-yellow-50/50 dark:bg-yellow-950/20" : ""
//                         } hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer`}
//                         onClick={() => setSelectedActivity(activity)}
//                       >
//                         <div className={`mt-1 h-2 w-2 rounded-full ${
//                           activity.priority === "high" ? "bg-red-600" :
//                           activity.type === "alert" ? "bg-yellow-600" :
//                           activity.type === "compliance" ? "bg-green-600" :
//                           "bg-blue-600"
//                         }`} />
//                         <div className="flex-1">
//                           <p className="text-sm">{activity.message}</p>
//                           <div className="flex items-center gap-2 text-xs text-gray-500">
//                             <span className="font-medium">{activity.user}</span>
//                             <span>•</span>
//                             <span>{activity.time}</span>
//                             {!activity.read && (
//                               <span className="text-blue-600 text-xs font-medium">New</span>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>

//         {/* Compliance Tasks */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.4, delay: 0.2 }}
//           className="mt-6"
//         >
//           <Card className="border-gray-200 dark:border-gray-800">
//             <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <CardTitle>Compliance Tasks</CardTitle>
//                 <CardDescription>Track and manage compliance requirements</CardDescription>
//               </div>
//               <div className="flex flex-wrap items-center gap-2">
//                 <Tabs value={dashboardComplianceTab} onValueChange={setDashboardComplianceTab} className="w-auto">
//                   <TabsList>
//                     <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
//                     <TabsTrigger value="overdue" className="text-xs">Overdue</TabsTrigger>
//                     <TabsTrigger value="urgent" className="text-xs">Urgent</TabsTrigger>
//                     <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
//                     <TabsTrigger value="completed" className="text-xs">Completed</TabsTrigger>
//                   </TabsList>
//                 </Tabs>
//                 <Button variant="outline" size="sm" onClick={() => router.push("/compliance")}>View All</Button>
//               </div>
//             </CardHeader>
//             <CardContent>
//               <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
//                 <div className="grid grid-cols-6 gap-3 bg-gray-50 p-3 text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">
//                   <span className="col-span-2">Task</span>
//                   <span>Mine</span>
//                   <span>Status</span>
//                   <span>Due Date</span>
//                   <span className="text-right">Action</span>
//                 </div>
//                 <div className="divide-y divide-gray-100 dark:divide-gray-800">
//                   {filteredCompliance.length === 0 ? (
//                     <div className="p-8 text-center text-gray-500 dark:text-gray-400">
//                       No compliance tasks found.
//                     </div>
//                   ) : (
//                     filteredCompliance.map((task) => (
//                       <div key={task.id} className="grid grid-cols-6 gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
//                         <div className="col-span-2">
//                           <p className="font-medium text-sm">{task.title}</p>
//                           <p className="text-xs text-gray-500">{task.category} · {task.assignedTo}</p>
//                         </div>
//                         <div className="flex items-center">
//                           <span className="text-sm">{task.mineName}</span>
//                         </div>
//                         <div className="flex items-center">
//                           {renderStatusBadge(getUpdatedStatus(task) as any)}
//                         </div>
//                         <div className="flex items-center">
//                           <span className="text-sm">{formatDate(task.dueDate)}</span>
//                           {getUpdatedStatus(task) === "overdue" && (
//                             <span className="ml-2 text-xs text-red-600 font-medium">-2 days</span>
//                           )}
//                         </div>
//                         <div className="flex items-center justify-end gap-1">
//                           <Button 
//                             variant="ghost" 
//                             size="sm" 
//                             className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
//                             onClick={() => {
//                               setSelectedCompliance(task);
//                               setIsComplianceDetailsOpen(true);
//                             }}
//                           >
//                             <Eye className="h-4 w-4 text-yellow-600" />
//                           </Button>
//                           {getUpdatedStatus(task) !== "completed" ? (
//                             <Button 
//                               variant="ghost" 
//                               size="sm" 
//                               className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
//                               onClick={() => handleCompleteItem(task.id)}
//                             >
//                               <CheckCircle2 className="h-4 w-4" />
//                             </Button>
//                           ) : (
//                             <span className="h-8 w-8 flex items-center justify-center text-gray-400 cursor-not-allowed" title="Completed">
//                               <CheckCircle2 className="h-4 w-4 opacity-50" />
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </motion.div>

//         {/* AI Insights Footer */}
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.5, delay: 0.3 }}
//           className="mt-6 rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100/50 p-4 dark:border-yellow-800 dark:from-yellow-950/30 dark:to-yellow-900/30"
//         >
//           <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//             <div className="flex items-center gap-3">
//               <div className="rounded-full bg-yellow-600 p-2">
//                 <Zap className="h-4 w-4 text-white" />
//               </div>
//               <div>
//                 <p className="font-semibold text-sm">AI Intelligence Summary</p>
//                 <p className="text-sm text-gray-600 dark:text-gray-400">
//                   {bannerStats.alerts} high-priority alert{bannerStats.alerts === 1 ? "" : "s"} · {bannerStats.predictions} compliance prediction{bannerStats.predictions === 1 ? "" : "s"} · {bannerStats.anomalies} anomaly detected
//                 </p>
//               </div>
//             </div>
//             <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push("/ai-insights")}>
//               View All Insights <ChevronRight className="h-4 w-4" />
//             </Button>
//           </div>
//         </motion.div>
//       </main>

//       {/* Activity Detail Dialog */}
//       <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>Activity Details</DialogTitle>
//             <DialogDescription>{selectedActivity?.message}</DialogDescription>
//           </DialogHeader>
//           {selectedActivity && (
//             <div className="space-y-4 py-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-gray-500">Mine</p>
//                   <p className="font-medium">{selectedActivity.mineName}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500">User</p>
//                   <p className="font-medium">{selectedActivity.user}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500">Time</p>
//                   <p className="font-medium">{selectedActivity.time}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500">Type</p>
//                   <p className="font-medium capitalize">{selectedActivity.type}</p>
//                 </div>
//               </div>
//               {selectedActivity.priority && (
//                 <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-950/20">
//                   <p className="text-sm text-yellow-800 dark:text-yellow-300">
//                     Priority: {selectedActivity.priority.toUpperCase()}
//                   </p>
//                 </div>
//               )}
//             </div>
//           )}
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setSelectedActivity(null)}>Close</Button>
//             <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">View Full Details</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Mine Details Dialog Modal */}
//       <Dialog open={isMineModalOpen} onOpenChange={(open) => !open && setIsMineModalOpen(false)}>
//         <DialogContent className="sm:max-w-md bg-white dark:bg-gray-950 p-6 border border-gray-200 dark:border-gray-800 rounded-2xl">
//           <DialogHeader>
//             <DialogTitle className="text-xl font-bold tracking-tight">Mine Details & Status</DialogTitle>
//             <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
//               Active operating parameters and compliance risk indexes.
//             </DialogDescription>
//           </DialogHeader>

//           {selectedMine && (
//             <div className="space-y-4 py-4 text-sm font-sans">
//               <div className="flex items-center justify-between border-b pb-3">
//                 <div>
//                   <h3 className="font-bold text-base text-gray-900 dark:text-white">{selectedMine.name}</h3>
//                   <p className="text-xs text-gray-500 mt-1">Location: <span className="font-semibold">{selectedMine.location}</span></p>
//                 </div>
//                 <Badge className={getRiskColor(selectedMine.riskStatus)}>
//                   {selectedMine.riskStatus.toUpperCase()}
//                 </Badge>
//               </div>

//               <div className="grid grid-cols-2 gap-4 border-b pb-4">
//                 <div>
//                   <p className="text-xs font-semibold text-gray-400 uppercase">Risk Score</p>
//                   <p className="font-bold text-lg text-gray-900 dark:text-white mt-1">{selectedMine.riskScore} / 100</p>
//                 </div>
//                 <div>
//                   <p className="text-xs font-semibold text-gray-400 uppercase">Compliance Level</p>
//                   <p className="font-bold text-lg text-gray-900 dark:text-white mt-1">{selectedMine.complianceScore}%</p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4 border-b pb-4">
//                 <div>
//                   <p className="text-xs font-semibold text-gray-400 uppercase">Active Workers</p>
//                   <p className="font-medium text-gray-900 dark:text-white mt-1">{selectedMine.workersOnSite}</p>
//                 </div>
//                 <div>
//                   <p className="text-xs font-semibold text-gray-400 uppercase">Mine Type</p>
//                   <p className="font-medium text-gray-900 dark:text-white mt-1 capitalize">{selectedMine.type}</p>
//                 </div>
//               </div>

//               <div className="space-y-1.5 border-b pb-4">
//                 <p className="text-xs font-semibold text-gray-400 uppercase">Coordinates</p>
//                 <p className="font-mono text-xs text-gray-700 dark:text-gray-300">
//                   {inspectionService.getFallbackCoordinates(selectedMine.id).lat.toFixed(4)}° N, {inspectionService.getFallbackCoordinates(selectedMine.id).lng.toFixed(4)}° E
//                 </p>
//               </div>

//               <DialogFooter className="mt-6 flex justify-end gap-2">
//                 <Button variant="outline" onClick={() => setIsMineModalOpen(false)}>Close</Button>
//                 <Button 
//                   className="bg-yellow-600 hover:bg-yellow-700 text-white gap-1.5"
//                   onClick={() => {
//                     setIsMineModalOpen(false);
//                     router.push("/gis");
//                   }}
//                 >
//                   View on GIS Map
//                 </Button>
//               </DialogFooter>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>

//       {/* Compliance Details Dialog Modal */}
//       <Dialog open={isComplianceDetailsOpen} onOpenChange={(open) => !open && setIsComplianceDetailsOpen(false)}>
//         <DialogContent className="sm:max-w-lg rounded-2xl bg-white dark:bg-gray-950 p-6 border border-gray-200 dark:border-gray-800">
//           <DialogHeader>
//             <DialogTitle className="text-xl font-bold tracking-tight">Compliance Details</DialogTitle>
//             <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
//               Complete tracking and metadata audit trail for this statutory requirement.
//             </DialogDescription>
//           </DialogHeader>

//           {selectedCompliance && (
//             <div className="space-y-4 py-4 text-sm font-sans">
//               <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
//                 <div>
//                   <h3 className="font-bold text-base text-gray-900 dark:text-white">{selectedCompliance.title}</h3>
//                   <p className="text-xs text-gray-500 mt-1">ID: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono">{selectedCompliance.id}</code></p>
//                 </div>
//                 <Badge className={`${getStatusColor(getUpdatedStatus(selectedCompliance))} px-3 py-1`}>
//                   {getUpdatedStatus(selectedCompliance).toUpperCase()}
//                 </Badge>
//               </div>

//               <div className="grid grid-cols-2 gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
//                 <div>
//                   <p className="text-xs font-semibold text-gray-400 uppercase">Mine Location</p>
//                   <p className="font-medium text-gray-900 dark:text-white mt-1">{selectedCompliance.mineName}</p>
//                 </div>
//                 <div>
//                   <p className="text-xs font-semibold text-gray-400 uppercase">Category</p>
//                   <p className="font-medium text-gray-900 dark:text-white mt-1">{selectedCompliance.category}</p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
//                 <div>
//                   <p className="text-xs font-semibold text-gray-400 uppercase">Responsible Person</p>
//                   <p className="font-medium text-gray-900 dark:text-white mt-1">{selectedCompliance.assignedTo}</p>
//                 </div>
//                 <div>
//                   <p className="text-xs font-semibold text-gray-400 uppercase">Due Date</p>
//                   <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5 mt-1">
//                     <Calendar className="h-4 w-4 text-gray-400 shrink-0" /> {new Date(selectedCompliance.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
//                 <div>
//                   <p className="text-xs font-semibold text-gray-400 uppercase">Priority / Risk Level</p>
//                   <Badge variant="outline" className="mt-1 font-semibold uppercase">{selectedCompliance.priority}</Badge>
//                 </div>
//                 <div>
//                   <p className="text-xs font-semibold text-gray-400 uppercase">Reference Document</p>
//                   <p className="font-medium text-yellow-600 mt-1 cursor-pointer hover:underline">
//                     {selectedCompliance.documentName || "No attached document"}
//                   </p>
//                 </div>
//               </div>

//               <div className="space-y-1.5 border-b border-gray-100 dark:border-gray-800 pb-4">
//                 <p className="text-xs font-semibold text-gray-400 uppercase">Requirement Description</p>
//                 <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
//                   {selectedCompliance.description}
//                 </p>
//               </div>

//               <DialogFooter className="mt-6 flex justify-end gap-2">
//                 <Button type="button" variant="outline" onClick={() => setIsComplianceDetailsOpen(false)}>Close</Button>
//                 {getUpdatedStatus(selectedCompliance) !== "completed" && (
//                   <Button 
//                     type="button" 
//                     className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
//                     onClick={() => {
//                       handleCompleteItem(selectedCompliance.id);
//                       setIsComplianceDetailsOpen(false);
//                     }}
//                   >
//                     <CheckCircle2 className="h-4 w-4" /> Mark Completed
//                   </Button>
//                 )}
//               </DialogFooter>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }

// // ============================================================
// // SUB-COMPONENTS
// // ============================================================

// interface StatsCardProps {
//   title: string;
//   value: string | number;
//   icon: React.ComponentType<{ className?: string }>;
//   color: "blue" | "green" | "red" | "yellow" | "purple" | "orange";
//   change: number;
//   changeType: "up" | "down" | "neutral";
// }

// function StatsCard({ title, value, icon: Icon, color, change, changeType }: StatsCardProps) {
//   const colorClasses = {
//     blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
//     green: "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
//     red: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
//     yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400",
//     purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400",
//     orange: "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
//   };

//   const getChangeDisplay = () => {
//     if (changeType === "up") {
//       return { icon: <ArrowUpRight className="h-3 w-3" />, color: "text-green-600", text: `+${change}` };
//     } else if (changeType === "down") {
//       return { icon: <ArrowDownRight className="h-3 w-3" />, color: "text-red-600", text: `${change}` };
//     } else {
//       return { icon: <Minus className="h-3 w-3" />, color: "text-gray-500", text: "" };
//     }
//   };

//   const changeDisplay = getChangeDisplay();

//   return (
//     <Card className="border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
//       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//         <CardTitle className="text-sm font-medium">{title}</CardTitle>
//         <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
//           <Icon className="h-4 w-4" />
//         </div>
//       </CardHeader>
//       <CardContent>
//         <div className="text-2xl font-bold">{value}</div>
//         <div className="flex items-center gap-1">
//           <span className={`text-xs ${changeDisplay.color} flex items-center gap-0.5`}>
//             {changeDisplay.icon}
//             {changeDisplay.text}
//           </span>
//           <span className="text-xs text-gray-500">from last month</span>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// function DashboardSkeleton() {
//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6 lg:p-8">
//       <div className="max-w-7xl mx-auto">
//         <div className="mb-6 flex items-center justify-between">
//           <div>
//             <Skeleton className="h-8 w-48" />
//             <Skeleton className="mt-2 h-4 w-64" />
//           </div>
//           <Skeleton className="h-9 w-32" />
//         </div>

//         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
//           {[...Array(6)].map((_, i) => (
//             <Skeleton key={i} className="h-28" />
//           ))}
//         </div>

//         <div className="mt-6 grid gap-6 lg:grid-cols-3">
//           <Skeleton className="lg:col-span-2 h-96" />
//           <div className="space-y-6">
//             <Skeleton className="h-48" />
//             <Skeleton className="h-48" />
//           </div>
//         </div>

//         <Skeleton className="mt-6 h-64" />
//         <Skeleton className="mt-6 h-20" />
//       </div>
//     </div>
//   );
// }

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
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const { session } = useSession();
  const [selectedMine, setSelectedMine] = useState<Mine | null>(null);
  const [isMineModalOpen, setIsMineModalOpen] = useState(false);

  useEffect(() => {
    setComplianceItems(complianceService.getComplianceItems());
  }, []);

  const activeMineId = useMemo(() => {
    if (session?.role === "MINE_MANAGER") {
      // session.mineId is a real Supabase mine UUID, but the demo
      // data below is keyed by mock ids ("M1".."M6"). If the
      // manager's real mine doesn't exist in the demo set, fall
      // back to showing everything rather than silently filtering
      // every list down to empty.
      const hasMatchingDemoMine = mockMines.some((m) => m.id === session.mineId);
      return session.mineId && hasMatchingDemoMine ? session.mineId : "all";
    }
    return selectedMineId;
  }, [session, selectedMineId]);

  const dynamicStats = useMemo(() => {
    const cItems = complianceItems.filter(item => activeMineId === "all" || item.mineId === activeMineId);
    const allInspections = inspectionService.getInspections();
    const iItems = allInspections.filter(item => activeMineId === "all" || item.mineId === activeMineId);

    const compStats = complianceService.calculateComplianceStats(cItems);
    const inspectStats = inspectionService.calculateStats(iItems);

    const totalMines = activeMineId === "all" ? mockMines.length : 1;
    const complianceScore = compStats.total > 0 ? Math.round((compStats.completed / compStats.total) * 100) : 74;
    const pendingInspections = inspectStats.scheduled + inspectStats.inProgress;

    const currentMine = mockMines.find(m => m.id === activeMineId);
    const activeWorkers = activeMineId === "all" ? 1247 : (currentMine?.workersOnSite || 120);

    return {
      totalMines,
      complianceScore,
      pendingInspections,
      activeWorkers,
    };
  }, [complianceItems, activeMineId]);

  // ============================================================
  // DATA FILTERING
  // ============================================================
  const filteredMines = useMemo(() => {
    return mockMines.filter(mine => {
      const matchesSearch = mine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            mine.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMine = activeMineId === "all" || mine.id === activeMineId;
      return matchesSearch && matchesMine;
    });
  }, [searchQuery, activeMineId]);

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
    const mineObj = mockMines.find(m => m.id === mineId);
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
  if (isLoading) {
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
              Real-time governance overview for all CIL subsidiaries
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={activeMineId}
              disabled={session?.role === "MINE_MANAGER"}
              onChange={(e) => setSelectedMineId(e.target.value)}
              className="h-9 rounded-4xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-1 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[3px] focus-visible:ring-yellow-600/20 disabled:opacity-85 disabled:cursor-not-allowed mr-2"
            >
              {session?.role !== "MINE_MANAGER" && <option value="all">All Mines</option>}
              {mockMines.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

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

            <Button size="sm" className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-white" onClick={handleAIScan} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Run AI Scan
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatsCard title="Total Mines" value={dynamicStats.totalMines} icon={Building2} color="blue" change={0} changeType="neutral" />
          <StatsCard title="Compliance Score" value={`${dynamicStats.complianceScore}%`} icon={FileCheck} color="green" change={mockStats.trends.compliance} changeType="up" />
          <StatsCard title="Inspections" value={42} icon={ClipboardList} color="purple" change={8} changeType="up" />
          <StatsCard title="Pending Inspections" value={dynamicStats.pendingInspections} icon={Calendar} color="yellow" change={Math.abs(mockStats.trends.inspections)} changeType="down" />
          <StatsCard title="Active Workers" value={dynamicStats.activeWorkers.toLocaleString()} icon={Users} color="orange" change={mockStats.trends.workers} changeType="up" />
        </div>

        {/* Risk Overview */}
        <div className="mt-6">
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