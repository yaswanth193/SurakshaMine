"use client";

import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { Header } from "@/components/layout/Header";
import {
  Users,
  Search,
  Eye,
  Shield,
  Heart,
  UserCheck,
  BellRing,
  Link2,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  MessageSquare,
  Smartphone,
  Send,
  Copy,
  Zap,
  CheckCircle,
  Settings2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from "@/hooks/useEmployees";
import type { Employee as DbEmployee } from "@/types/database";

type Employee = {
  id: string;
  name: string;
  designation: string;
  phone: string;
  emergencyName: string;
  emergencyPhone: string;
  attendance: boolean;
  shift: string;
  bloodGroup: string;
  ppe: string;
  training: string;
  medical: string;
};

type Severity = "low" | "medium" | "high" | "critical";

const ALERT_TEMPLATES: { label: string; severity: Severity; title: string; message: string }[] = [
  {
    label: "Fire",
    severity: "critical",
    title: "Fire Reported — Evacuate",
    message: "A fire has been reported near your zone. Stop work and move to the nearest designated assembly point immediately.",
  },
  {
    label: "Gas Leak",
    severity: "critical",
    title: "Gas Leak Detected",
    message: "Gas levels have triggered an alarm in your area. Put on your gas mask and proceed to the surface via the nearest emergency exit.",
  },
  {
    label: "Water Inflow",
    severity: "high",
    title: "Water Inflow Warning",
    message: "Water inflow has been detected. Move away from low-lying zones and await further instructions.",
  },
  {
    label: "Equipment Hazard",
    severity: "medium",
    title: "Equipment Hazard Nearby",
    message: "A mechanical hazard has been flagged near your work zone. Proceed with caution and report to your supervisor.",
  },
  {
    label: "Custom",
    severity: "medium",
    title: "Safety Alert",
    message: "",
  },
];

export default function EmployeesPage() {
  const { session } = useSession();

  const isMineManager = session?.role === "MINE_MANAGER";
  const isAdmin = session?.role === "ADMIN";
  const canManage = isAdmin || isMineManager;
  const managerMineId = isMineManager ? (session?.mineId || "47d2d435-8bae-49ca-b8d2-b6e71b407e9b") : undefined;

  const filterParams = useMemo(() => {
    return managerMineId ? { mineId: managerMineId } : {};
  }, [managerMineId]);

  const { data: dbEmployees = [], isLoading } = useEmployees(filterParams);
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();

  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [attendanceOverrides, setAttendanceOverrides] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("suraksha_attendance_overrides");
        if (saved) {
          setAttendanceOverrides(JSON.parse(saved));
        }
      } catch {
        // fallback
      }
    }
  }, []);

  // Alert Modal states
  const [alertTarget, setAlertTarget] = useState<Employee | "ALL" | null>(null);
  const [alertTargetPhone, setAlertTargetPhone] = useState("");
  const [alertChannel, setAlertChannel] = useState<"automatic" | "whatsapp" | "push">("automatic");
  const [alertTemplateIdx, setAlertTemplateIdx] = useState(0);
  const [alertTitle, setAlertTitle] = useState(ALERT_TEMPLATES[0].title);
  const [alertMessage, setAlertMessage] = useState(ALERT_TEMPLATES[0].message);
  const [alertSeverity, setAlertSeverity] = useState<Severity>(ALERT_TEMPLATES[0].severity);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [fast2SmsApiKey, setFast2SmsApiKey] = useState("");
  const [showGatewayConfig, setShowGatewayConfig] = useState(false);
  const [lastDispatchReceipt, setLastDispatchReceipt] = useState<{
    phone: string;
    messageId: string;
    deliveredVia: string;
    hasLiveGatewayKey: boolean;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("suraksha_fast2sms_key") || "";
      if (saved) setFast2SmsApiKey(saved);
    }
  }, []);

  const handleSaveFast2SmsKey = (key: string) => {
    setFast2SmsApiKey(key);
    if (typeof window !== "undefined") {
      localStorage.setItem("suraksha_fast2sms_key", key.trim());
      toast.success("Fast2SMS API Key saved!");
    }
  };

  // Add Employee Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    designation: "",
    phone: "",
    emergencyName: "",
    emergencyPhone: "",
    shift: "Morning (06:00 - 14:00)",
    bloodGroup: "O+",
    ppeStatus: "Compliant",
    trainingStatus: "Completed",
    medicalCheckupDate: new Date().toISOString().split("T")[0],
    attendance: true,
  });

  const employees: Employee[] = useMemo(() => {
    return dbEmployees.map((e: DbEmployee) => {
      const isAttending = attendanceOverrides[e.id] !== undefined
        ? attendanceOverrides[e.id]
        : (e.attendance !== undefined ? e.attendance : true);
      return {
        id: e.id,
        name: e.name,
        designation: e.designation,
        phone: e.phone,
        emergencyName: e.emergency_name,
        emergencyPhone: e.emergency_phone,
        attendance: isAttending,
        shift: e.shift,
        bloodGroup: e.blood_group,
        ppe: e.ppe_status,
        training: e.training_status,
        medical: e.medical_checkup_date || "Current",
      };
    });
  }, [dbEmployees, attendanceOverrides]);

  const filtered = useMemo(() => {
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.designation.toLowerCase().includes(search.toLowerCase()) ||
        e.phone.includes(search)
    );
  }, [employees, search]);

  const presentEmployees = useMemo(() => {
    return employees.filter((e) => e.attendance);
  }, [employees]);

  const toggleAttendance = (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setAttendanceOverrides((prev) => {
      const next = { ...prev, [id]: newStatus };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("suraksha_attendance_overrides", JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });

    const targetEmp = employees.find((e) => e.id === id);
    toast.success(`${targetEmp?.name || "Employee"} marked as ${newStatus ? "Present" : "Absent"}`);

    updateEmployeeMutation.mutate({
      id,
      updates: { attendance: newStatus },
    });
  };

  const openAlertDialog = (emp: Employee) => {
    setAlertTarget(emp);
    setAlertTargetPhone(emp.phone || emp.emergencyPhone || "");
    setAlertChannel("automatic");
    setLastDispatchReceipt(null);
    setAlertTemplateIdx(0);
    setAlertTitle(ALERT_TEMPLATES[0].title);
    setAlertMessage(ALERT_TEMPLATES[0].message);
    setAlertSeverity(ALERT_TEMPLATES[0].severity);
  };

  const openAlertAllDialog = () => {
    if (presentEmployees.length === 0) {
      toast.warning("No employees are marked Present today.");
      return;
    }
    setAlertTarget("ALL");
    setAlertTargetPhone("");
    setAlertChannel("push");
    setLastDispatchReceipt(null);
    setAlertTemplateIdx(0);
    setAlertTitle("Emergency Alert: All Active Shifts");
    setAlertMessage(ALERT_TEMPLATES[0].message);
    setAlertSeverity(ALERT_TEMPLATES[0].severity);
  };

  const openDirectCustomAlertDialog = () => {
    setAlertTarget({
      id: "custom-mobile",
      name: "Emergency Mobile Dispatch",
      designation: "On-Duty Personnel",
      phone: "+91 ",
      emergencyName: "Control Room Dispatch",
      emergencyPhone: "",
      attendance: true,
      shift: "Active Shift",
      bloodGroup: "N/A",
      ppe: "Compliant",
      training: "Verified",
      medical: "Current",
    });
    setAlertTargetPhone("");
    setAlertChannel("automatic");
    setLastDispatchReceipt(null);
    setAlertTemplateIdx(0);
    setAlertTitle(ALERT_TEMPLATES[0].title);
    setAlertMessage(ALERT_TEMPLATES[0].message);
    setAlertSeverity(ALERT_TEMPLATES[0].severity);
  };

  const getFormattedEmergencyMessage = () => {
    const mineName = session?.mineName || "Mine A (Jharia Seam IV)";
    const targetName = alertTarget === "ALL" ? "All Site Workforce" : alertTarget?.name || "Mine Personnel";
    const timestampStr = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return [
      "🚨 SURAKSHAMINE EMERGENCY ALERT 🚨",
      `Mine: ${mineName}`,
      `Severity: ${alertSeverity.toUpperCase()}`,
      `Hazard: ${alertTitle}`,
      `Instructions: ${alertMessage}`,
      `Recipient: ${targetName}`,
      `Time: ${timestampStr} IST`,
      "Dispatch: Mine Safety Monitoring Division, SurakshaMine",
    ].join("\n");
  };

  const handleDispatchWhatsApp = async () => {
    if (!alertTargetPhone.trim()) {
      toast.error("Please enter a destination mobile phone number.");
      return;
    }
    if (!alertMessage.trim()) {
      toast.error("Please enter the emergency alert instructions.");
      return;
    }

    const clean = alertTargetPhone.replace(/[^0-9]/g, "");
    const fullPhone = clean.length === 10 ? `91${clean}` : clean;
    const msg = getFormattedEmergencyMessage();
    const url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(msg)}`;

    window.open(url, "_blank");

    try {
      await axios.post("/api/push/sms", {
        phone: fullPhone,
        employeeName: alertTarget === "ALL" ? "All Site Workers" : alertTarget?.name,
        title: alertTitle,
        message: alertMessage,
        severity: alertSeverity,
        mineName: session?.mineName,
        mineId: session?.mineId,
      });
      toast.success(`WhatsApp emergency alert launched for +${fullPhone} and logged.`);
    } catch {
      toast.success(`WhatsApp emergency alert launched for +${fullPhone}.`);
    }
  };

  const handleDispatchAutomaticSMS = async () => {
    if (!alertTargetPhone.trim()) {
      toast.error("Please enter a destination mobile phone number.");
      return;
    }
    if (!alertMessage.trim()) {
      toast.error("Please enter the emergency alert instructions.");
      return;
    }

    const clean = alertTargetPhone.replace(/[^0-9]/g, "");
    const fullPhone = clean.length === 10 ? `91${clean}` : clean;

    setIsSendingAlert(true);
    setLastDispatchReceipt(null);
    try {
      const { data } = await axios.post("/api/push/sms", {
        phone: fullPhone,
        employeeName: alertTarget === "ALL" ? "All Site Workers" : alertTarget?.name,
        title: alertTitle,
        message: alertMessage,
        severity: alertSeverity,
        mineName: session?.mineName,
        mineId: session?.mineId,
        fast2SmsKey: fast2SmsApiKey || undefined,
      });

      if (data?.success) {
        setLastDispatchReceipt(data.data);
        toast.success(data?.message || `Emergency SMS alert dispatched automatically to +${fullPhone}!`);
      } else {
        toast.error(data?.message || "Failed to dispatch automatic SMS.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Error during automatic SMS dispatch.");
    } finally {
      setIsSendingAlert(false);
    }
  };

  const handleCopyAlertText = async () => {
    try {
      await navigator.clipboard.writeText(getFormattedEmergencyMessage());
      toast.success("Emergency message copied to clipboard!");
    } catch {
      toast.error("Failed to copy text.");
    }
  };

  const applyTemplate = (idxStr: string) => {
    const idx = Number(idxStr);
    const tpl = ALERT_TEMPLATES[idx];
    setAlertTemplateIdx(idx);
    setAlertTitle(tpl.title);
    setAlertMessage(tpl.message);
    setAlertSeverity(tpl.severity);
  };

  const getEnrolmentLink = (emp: Employee) => {
    if (typeof window === "undefined") return "";
    const mineId = session?.mineId || "47d2d435-8bae-49ca-b8d2-b6e71b407e9b";
    const url = new URL("/alerts/subscribe", window.location.origin);
    url.searchParams.set("employeeId", emp.id);
    url.searchParams.set("employeeName", emp.name);
    url.searchParams.set("mineId", mineId);
    return url.toString();
  };

  const copyEnrolmentLink = async (emp: Employee) => {
    const link = getEnrolmentLink(emp);
    try {
      await navigator.clipboard.writeText(link);
      toast.success(`Enrolment link copied — send it to ${emp.name}'s phone.`);
    } catch {
      toast.error("Couldn't copy link. Long-press to copy: " + link);
    }
  };

  const handleSendAlert = async () => {
    if (!alertTarget) return;
    if (!alertMessage.trim()) {
      toast.error("Write a message before sending.");
      return;
    }

    setIsSendingAlert(true);
    try {
      const mineId = session?.mineId || "47d2d435-8bae-49ca-b8d2-b6e71b407e9b";

      if (alertTarget === "ALL") {
        const { data } = await axios.post("/api/push/send", {
          broadcast: true,
          employeeIds: presentEmployees.map((e) => e.id),
          mineId,
          title: alertTitle,
          message: alertMessage,
          severity: alertSeverity,
        });

        const sent = data?.data?.sent || 0;
        const unenrolled = data?.data?.unenrolledCount || 0;

        if (sent > 0) {
          toast.success(
            `Broadcast alert delivered to ${sent} active device${sent > 1 ? "s" : ""}.${
              unenrolled > 0 ? ` (${unenrolled} employee${unenrolled > 1 ? "s have" : " has"} not enrolled yet)` : ""
            }`
          );
          setAlertTarget(null);
        } else {
          toast.warning(
            data?.message ||
              `None of the ${presentEmployees.length} present employees have enrolled their phones yet.`
          );
        }
      } else {
        const { data } = await axios.post("/api/push/send", {
          employeeId: alertTarget.id,
          employeeName: alertTarget.name,
          mineId,
          title: alertTitle,
          message: alertMessage,
          severity: alertSeverity,
        });

        if (data?.data?.sent > 0) {
          toast.success(
            `Alert sent to ${alertTarget.name}'s phone (${data.data.sent} device${
              data.data.sent > 1 ? "s" : ""
            }).`
          );
          setAlertTarget(null);
        } else {
          toast.warning(
            data?.message ||
              `${alertTarget.name} hasn't enrolled a device yet. Copy their enrolment link and send it over first.`
          );
        }
      }
    } catch (err) {
      const message =
        axios.isAxiosError(err) && typeof err.response?.data?.error === "string"
          ? err.response.data.error
          : "Failed to send the alert. Please try again.";
      toast.error(message);
    } finally {
      setIsSendingAlert(false);
    }
  };

  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name.trim()) {
      toast.error("Employee name is required.");
      return;
    }
    if (!newEmployee.designation.trim()) {
      toast.error("Designation is required.");
      return;
    }
    if (!newEmployee.phone.trim()) {
      toast.error("Phone number is required.");
      return;
    }

    const mineId = session?.mineId || "47d2d435-8bae-49ca-b8d2-b6e71b407e9b";

    createEmployeeMutation.mutate(
      {
        ...newEmployee,
        mineId,
      },
      {
        onSuccess: () => {
          toast.success("Employee added successfully!");
          setIsAddOpen(false);
          setNewEmployee({
            name: "",
            designation: "",
            phone: "",
            emergencyName: "",
            emergencyPhone: "",
            shift: "Morning (06:00 - 14:00)",
            bloodGroup: "O+",
            ppeStatus: "Compliant",
            trainingStatus: "Completed",
            medicalCheckupDate: new Date().toISOString().split("T")[0],
            attendance: true,
          });
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error || "Failed to add employee.");
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (!employeeToDelete) return;
    deleteEmployeeMutation.mutate(employeeToDelete.id, {
      onSuccess: () => {
        toast.success(`Employee ${employeeToDelete.name} deleted.`);
        setEmployeeToDelete(null);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || "Failed to delete employee.");
      },
    });
  };

  return (
    <>
      <Header />
      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
              {session?.role === "MINE_MANAGER" && (
                <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400">
                  {session.mineName || "My Mine"}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Workforce monitoring, site attendance, and emergency push alerts
            </p>
          </div>

          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="gap-2 border-green-500 bg-green-50/50 text-green-700 hover:bg-green-100 dark:bg-green-950/20 dark:border-green-800 dark:text-green-400"
                onClick={openDirectCustomAlertDialog}
              >
                <Smartphone className="h-4 w-4 text-green-600" /> Quick Mobile Alert (WhatsApp / SMS)
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-red-200 text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={openAlertAllDialog}
              >
                <BellRing className="h-4 w-4" /> Broadcast Web Push ({presentEmployees.length})
              </Button>
              <Button
                className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-white"
                onClick={() => setIsAddOpen(true)}
              >
                <Plus className="h-4 w-4" /> Add Employee
              </Button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <Users className="mb-2 h-6 w-6 text-yellow-600" />
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <p className="text-3xl font-bold">{employees.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <UserCheck className="mb-2 h-6 w-6 text-green-600" />
              <p className="text-sm text-muted-foreground">Present Today</p>
              <p className="text-3xl font-bold">{presentEmployees.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Shield className="mb-2 h-6 w-6 text-blue-600" />
              <p className="text-sm text-muted-foreground">PPE Compliant</p>
              <p className="text-3xl font-bold">
                {employees.filter((e) => e.ppe.toLowerCase().includes("compliant") || e.ppe.toLowerCase().includes("issued")).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Heart className="mb-2 h-6 w-6 text-red-600" />
              <p className="text-sm text-muted-foreground">Medical Records</p>
              <p className="text-3xl font-bold">{employees.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                className="w-full rounded-md border pl-10 p-2 text-sm outline-none focus-visible:border-yellow-600 focus-visible:ring-[2px] focus-visible:ring-yellow-600/20"
                placeholder="Search employees by name, designation, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Directory</CardTitle>
          </CardHeader>

          <CardContent className="overflow-auto">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
                <p className="text-sm">Loading mine workforce records...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No employee records match your search criteria.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground font-semibold">
                    <th className="text-left py-3">Name</th>
                    <th className="text-left">Designation</th>
                    <th className="text-left">Phone</th>
                    <th className="text-left">Emergency Contact</th>
                    <th className="text-left">Shift</th>
                    <th className="text-left">Attendance</th>
                    <th className="text-right pr-2">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((emp) => (
                    <tr key={emp.id} className="border-b hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                      <td className="py-4">
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{emp.id.slice(0, 8)}</p>
                        </div>
                      </td>

                      <td className="text-sm">{emp.designation}</td>
                      <td className="text-sm">{emp.phone}</td>

                      <td className="text-sm">
                        <div>
                          <p>{emp.emergencyName}</p>
                          <p className="text-xs text-muted-foreground">{emp.emergencyPhone}</p>
                        </div>
                      </td>

                      <td className="text-sm">{emp.shift}</td>

                      <td>
                        {canManage ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAttendance(emp.id, emp.attendance);
                            }}
                            className={`px-3 py-1 rounded text-xs font-semibold text-white transition-all shadow-xs cursor-pointer hover:opacity-90 active:scale-95 ${
                              emp.attendance ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                            }`}
                            title={`Click to mark as ${emp.attendance ? "Absent" : "Present"}`}
                          >
                            {emp.attendance ? "Present" : "Absent"}
                          </button>
                        ) : (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${
                              emp.attendance ? "bg-green-600" : "bg-gray-400"
                            }`}
                          >
                            {emp.attendance ? "Present" : "Absent"}
                          </span>
                        )}
                      </td>

                      <td className="text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          {canManage && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                title="Copy this employee's alert enrolment link"
                                onClick={() => copyEnrolmentLink(emp)}
                              >
                                <Link2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                title="Dispatch WhatsApp, SMS, or Push alert to this employee"
                                onClick={() => openAlertDialog(emp)}
                                className="border-yellow-300 text-yellow-800 hover:bg-yellow-50 dark:hover:bg-yellow-950/30"
                              >
                                <BellRing className="h-4 w-4 mr-1.5 text-yellow-700" />
                                Send Alert
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline" onClick={() => setSelectedEmployee(emp)}>
                            <Eye className="h-4 w-4 mr-1.5" />
                            View
                          </Button>
                          {canManage && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => setEmployeeToDelete(emp)}
                              title="Delete Employee Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Employee Details Modal */}
        <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
          <DialogContent className="sm:max-w-xl">
            {selectedEmployee && (
              <>
                <DialogHeader>
                  <DialogTitle>Employee Details</DialogTitle>
                  <DialogDescription>Workforce verification and statutory health profile</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4 text-sm">
                  <Info label="Employee ID" value={selectedEmployee.id} />
                  <Info label="Full Name" value={selectedEmployee.name} />
                  <Info label="Designation" value={selectedEmployee.designation} />
                  <Info label="Contact Phone" value={selectedEmployee.phone} />
                  <Info label="Emergency Contact" value={selectedEmployee.emergencyName} />
                  <Info label="Emergency Phone" value={selectedEmployee.emergencyPhone} />
                  <Info label="Assigned Shift" value={selectedEmployee.shift} />
                  <Info label="Blood Group" value={selectedEmployee.bloodGroup} />
                  <Info label="PPE Gear Status" value={selectedEmployee.ppe} />
                  <Info label="Safety Training" value={selectedEmployee.training} />
                  <Info label="Last Medical Checkup" value={selectedEmployee.medical} />
                  <div>
                    <p className="text-xs text-muted-foreground">Attendance Status</p>
                    <Badge className={`mt-1 ${selectedEmployee.attendance ? "bg-green-600" : "bg-red-600"}`}>
                      {selectedEmployee.attendance ? "Present on Site" : "Absent"}
                    </Badge>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedEmployee(null)}>
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!employeeToDelete} onOpenChange={(open) => !open && setEmployeeToDelete(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" /> Confirm Employee Deletion
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to remove{" "}
                <span className="font-semibold text-gray-900 dark:text-white">{employeeToDelete?.name}</span> ({employeeToDelete?.designation}) from the mine registry? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setEmployeeToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteEmployeeMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteEmployeeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Employee"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Employee Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={handleAddEmployeeSubmit}>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>Register a new worker to the active mine roster.</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 py-4 text-sm">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Ramesh Kumar"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="designation">Designation *</Label>
                  <Input
                    id="designation"
                    placeholder="e.g. Mining Engineer"
                    value={newEmployee.designation}
                    onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="+91 98765 43210"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="emergencyName">Emergency Contact Person</Label>
                  <Input
                    id="emergencyName"
                    placeholder="e.g. Sunita Devi"
                    value={newEmployee.emergencyName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, emergencyName: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                  <Input
                    id="emergencyPhone"
                    placeholder="+91 98765 43211"
                    value={newEmployee.emergencyPhone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, emergencyPhone: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Assigned Shift</Label>
                  <Select
                    value={newEmployee.shift}
                    onValueChange={(v) => setNewEmployee({ ...newEmployee, shift: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning (06:00 - 14:00)">Morning (06:00 - 14:00)</SelectItem>
                      <SelectItem value="Evening (14:00 - 22:00)">Evening (14:00 - 22:00)</SelectItem>
                      <SelectItem value="Night (22:00 - 06:00)">Night (22:00 - 06:00)</SelectItem>
                      <SelectItem value="General Day (08:00 - 16:00)">General Day (08:00 - 16:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Blood Group</Label>
                  <Select
                    value={newEmployee.bloodGroup}
                    onValueChange={(v) => setNewEmployee({ ...newEmployee, bloodGroup: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                        <SelectItem key={bg} value={bg}>
                          {bg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>PPE Gear Status</Label>
                  <Select
                    value={newEmployee.ppeStatus}
                    onValueChange={(v) => setNewEmployee({ ...newEmployee, ppeStatus: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Compliant">Compliant</SelectItem>
                      <SelectItem value="Missing Helmet">Missing Helmet</SelectItem>
                      <SelectItem value="Missing Boots">Missing Boots</SelectItem>
                      <SelectItem value="Inspection Required">Inspection Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Training Status</Label>
                  <Select
                    value={newEmployee.trainingStatus}
                    onValueChange={(v) => setNewEmployee({ ...newEmployee, trainingStatus: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Pending Refresh">Pending Refresh</SelectItem>
                      <SelectItem value="Due Soon">Due Soon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createEmployeeMutation.isPending}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white gap-2"
                >
                  {createEmployeeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Employee"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Unified Alert Dialog (Single or All) */}
        <Dialog open={!!alertTarget} onOpenChange={(open) => !open && setAlertTarget(null)}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            {alertTarget && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-emerald-600" />
                    {alertTarget === "ALL"
                      ? "Emergency Broadcast to All Active Workers"
                      : alertTarget.id === "custom-mobile"
                      ? "Direct Mobile Emergency Dispatch"
                      : `Incident Alert: ${alertTarget.name}`}
                  </DialogTitle>
                  <DialogDescription>
                    Enter any mobile number to send automated emergency alerts directly from the system.
                  </DialogDescription>
                </DialogHeader>

                {/* Delivery Channel Tabs */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl border text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setAlertChannel("automatic")}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                      alertChannel === "automatic"
                        ? "bg-emerald-600 text-white shadow-sm font-semibold"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5" /> ⚡ Automatic SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertChannel("whatsapp")}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                      alertChannel === "whatsapp"
                        ? "bg-[#25D366] text-white shadow-sm font-semibold"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Web
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertChannel("push")}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                      alertChannel === "push"
                        ? "bg-red-600 text-white shadow-sm font-semibold"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                    }`}
                  >
                    <BellRing className="h-3.5 w-3.5" /> Web Push
                  </button>
                </div>

                <div className="space-y-4 py-2">
                  {/* Automatic SMS Information & Gateway Banner */}
                  {alertChannel === "automatic" && (
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-2.5 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                        <Zap className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span><strong>Automatic Server Dispatch</strong>: Dispatches directly without opening any app.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowGatewayConfig(!showGatewayConfig)}
                        className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium text-[11px] shrink-0"
                      >
                        <Settings2 className="h-3.5 w-3.5" /> {showGatewayConfig ? "Hide Config" : "Gateway Key"}
                      </button>
                    </div>
                  )}

                  {/* Expandable Gateway API Key Config */}
                  {alertChannel === "automatic" && showGatewayConfig && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 border rounded-lg space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Fast2SMS Telecom Gateway Key</span>
                        <span className="text-gray-400 text-[10px]">Free instant signup at fast2sms.com</span>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          placeholder="Paste Fast2SMS API Key..."
                          value={fast2SmsApiKey}
                          onChange={(e) => setFast2SmsApiKey(e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveFast2SmsKey(fast2SmsApiKey)}
                        >
                          Save
                        </Button>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        If key is provided, sends live cellular SMS across Indian telecom carriers. If left empty, dispatches via automated mining control gateway.
                      </p>
                    </div>
                  )}

                  {/* Dispatch Confirmation Receipt */}
                  {lastDispatchReceipt && (
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 p-3 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <span>Emergency SMS Dispatched Automatically</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-emerald-900 dark:text-emerald-200 font-mono">
                        <div>Recipient: <strong>{lastDispatchReceipt.phone}</strong></div>
                        <div>Message ID: <strong>{lastDispatchReceipt.messageId}</strong></div>
                        <div>Carrier Route: <strong>{lastDispatchReceipt.deliveredVia}</strong></div>
                        <div>Feed Log: <strong>Recorded in Supabase</strong></div>
                      </div>
                    </div>
                  )}

                  {/* Phone number input for Automatic SMS and WhatsApp */}
                  {alertChannel !== "push" && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="phone-input" className="text-xs font-semibold">
                          Recipient Mobile Phone Number *
                        </Label>
                        {alertTarget !== "ALL" && alertTarget.id !== "custom-mobile" && (
                          <div className="flex gap-2 text-[11px]">
                            {alertTarget.phone && (
                              <button
                                type="button"
                                className="text-yellow-700 hover:underline"
                                onClick={() => setAlertTargetPhone(alertTarget.phone)}
                              >
                                Worker: {alertTarget.phone}
                              </button>
                            )}
                            {alertTarget.emergencyPhone && (
                              <button
                                type="button"
                                className="text-yellow-700 hover:underline"
                                onClick={() => setAlertTargetPhone(alertTarget.emergencyPhone)}
                              >
                                Kin: {alertTarget.emergencyPhone}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <Input
                        id="phone-input"
                        value={alertTargetPhone}
                        onChange={(e) => setAlertTargetPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210 (enter any number to dispatch)"
                        className="font-mono text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Enter any 10-digit Indian mobile number or international number (+91...).
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Incident Preset</Label>
                      <Select value={String(alertTemplateIdx)} onValueChange={applyTemplate}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALERT_TEMPLATES.map((tpl, idx) => (
                            <SelectItem key={tpl.label} value={String(idx)}>
                              {tpl.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Severity Level</Label>
                      <Select value={alertSeverity} onValueChange={(v) => setAlertSeverity(v as Severity)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Alert Headline</Label>
                    <Input
                      value={alertTitle}
                      onChange={(e) => setAlertTitle(e.target.value)}
                      placeholder="e.g. Evacuation Order"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Emergency Action / Instructions *</Label>
                    <Textarea
                      value={alertMessage}
                      onChange={(e) => setAlertMessage(e.target.value)}
                      placeholder="Describe the hazard and required safety instructions..."
                      rows={3}
                    />
                  </div>

                  {/* Live Mobile Message Preview */}
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-900 border p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between border-b pb-1.5 text-gray-500 font-sans">
                      <span className="font-semibold text-[11px] uppercase tracking-wide">
                        {alertChannel === "automatic" ? "Automatic SMS Payload Preview" : alertChannel === "whatsapp" ? "WhatsApp Message Preview" : "Push Notification Payload"}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAlertText}
                        className="flex items-center gap-1 text-yellow-700 hover:underline font-sans text-xs"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy Message
                      </button>
                    </div>
                    <div className="font-mono text-[11px] pt-1 text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                      {getFormattedEmergencyMessage()}
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setAlertTarget(null)}>
                    Close
                  </Button>

                  {alertChannel === "automatic" && (
                    <Button
                      onClick={handleDispatchAutomaticSMS}
                      disabled={isSendingAlert}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold"
                    >
                      {isSendingAlert ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Dispatching Automatically...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4" /> Send Automatic SMS Now
                        </>
                      )}
                    </Button>
                  )}

                  {alertChannel === "whatsapp" && (
                    <Button
                      onClick={handleDispatchWhatsApp}
                      className="bg-[#25D366] hover:bg-[#1EBE5D] text-white gap-2"
                    >
                      <MessageSquare className="h-4 w-4" /> Open in WhatsApp Web
                    </Button>
                  )}

                  {alertChannel === "push" && (
                    <Button
                      onClick={handleSendAlert}
                      disabled={isSendingAlert}
                      className="bg-red-600 hover:bg-red-700 text-white gap-2"
                    >
                      {isSendingAlert ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Dispatching...
                        </>
                      ) : (
                        <>
                          <BellRing className="h-4 w-4" />
                          {alertTarget === "ALL" ? `Broadcast to ${presentEmployees.length} Workers` : "Send Push Now"}
                        </>
                      )}
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium mt-0.5">{value}</p>
    </div>
  );
}
