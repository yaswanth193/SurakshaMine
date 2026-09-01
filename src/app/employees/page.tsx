"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";

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

const initialEmployees: Employee[] = [
  {
    id: "EMP-001",
    name: "Ramesh Kumar",
    designation: "Drill Operator",
    phone: "7569821540",
    emergencyName: "Sita Kumar",
    emergencyPhone: "9876500000",
    attendance: true,
    shift: "Morning",
    bloodGroup: "O+",
    ppe: "Issued",
    training: "Completed",
    medical: "15 Jul 2026",
  },
  {
    id: "EMP-002",
    name: "Suresh Patel",
    designation: "Safety Officer",
    phone: "9876543211",
    emergencyName: "Lakshmi Patel",
    emergencyPhone: "9876500001",
    attendance: false,
    shift: "Evening",
    bloodGroup: "A+",
    ppe: "Issued",
    training: "Completed",
    medical: "02 Aug 2026",
  },
  {
    id: "EMP-003",
    name: "Ravi Singh",
    designation: "Excavator Operator",
    phone: "9876543212",
    emergencyName: "Anita Singh",
    emergencyPhone: "9876500002",
    attendance: true,
    shift: "Night",
    bloodGroup: "B+",
    ppe: "Issued",
    training: "Pending",
    medical: "18 Jun 2026",
  },
];

export default function EmployeesPage() {
  const { session } = useSession();
  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [alertTarget, setAlertTarget] = useState<Employee | null>(null);
  const [alertTemplateIdx, setAlertTemplateIdx] = useState(0);
  const [alertTitle, setAlertTitle] = useState(ALERT_TEMPLATES[0].title);
  const [alertMessage, setAlertMessage] = useState(ALERT_TEMPLATES[0].message);
  const [alertSeverity, setAlertSeverity] = useState<Severity>(ALERT_TEMPLATES[0].severity);
  const [isSendingAlert, setIsSendingAlert] = useState(false);

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.designation.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAttendance = (id: string) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id ? { ...emp, attendance: !emp.attendance } : emp
      )
    );
  };

  const openAlertDialog = (emp: Employee) => {
    setAlertTarget(emp);
    setAlertTemplateIdx(0);
    setAlertTitle(ALERT_TEMPLATES[0].title);
    setAlertMessage(ALERT_TEMPLATES[0].message);
    setAlertSeverity(ALERT_TEMPLATES[0].severity);
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
    if (typeof window === "undefined" || !session?.mineId) return "";
    const url = new URL("/alerts/subscribe", window.location.origin);
    url.searchParams.set("employeeId", emp.id);
    url.searchParams.set("employeeName", emp.name);
    url.searchParams.set("mineId", session.mineId);
    return url.toString();
  };

  const copyEnrolmentLink = async (emp: Employee) => {
    const link = getEnrolmentLink(emp);
    if (!link) {
      toast.error("Your mine isn't set on your profile yet — can't generate an enrolment link.");
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      toast.success(`Enrolment link copied — send it to ${emp.name}'s phone.`);
    } catch {
      toast.error("Couldn't copy the link. Long-press to copy manually: " + link);
    }
  };

  const handleSendAlert = async () => {
    if (!alertTarget) return;
    if (!session?.mineId) {
      toast.error("Your mine isn't set on your profile yet.");
      return;
    }
    if (!alertMessage.trim()) {
      toast.error("Write a message before sending.");
      return;
    }

    setIsSendingAlert(true);
    try {
      const { data } = await axios.post("/api/push/send", {
        employeeId: alertTarget.id,
        employeeName: alertTarget.name,
        mineId: session.mineId,
        title: alertTitle,
        message: alertMessage,
        severity: alertSeverity,
      });

      if (data?.data?.sent > 0) {
        toast.success(
          `Alert sent to ${alertTarget.name}'s phone (${data.data.sent} device${data.data.sent > 1 ? "s" : ""}).`
        );
        setAlertTarget(null);
      } else {
        toast.warning(
          data?.message ||
            `${alertTarget.name} hasn't enrolled a device yet. Copy their enrolment link and send it over first.`
        );
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

  return (
    <>
      <Header />
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <p className="text-muted-foreground">
            Workforce monitoring and attendance management
          </p>
        </div>

        {/* Stats */}
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
              <p className="text-3xl font-bold">
                {employees.filter((e) => e.attendance).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Shield className="mb-2 h-6 w-6 text-blue-600" />
              <p className="text-sm text-muted-foreground">PPE Issued</p>
              <p className="text-3xl font-bold">{employees.length}</p>
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
                className="w-full rounded-md border pl-10 p-2"
                placeholder="Search employees..."
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
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Name</th>
                  <th className="text-left">Designation</th>
                  <th className="text-left">Phone</th>
                  <th className="text-left">Emergency Contact</th>
                  <th className="text-left">Shift</th>
                  <th className="text-left">Attendance</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className="border-b">
                    <td className="py-4">
                      <div>
                        <p className="font-medium">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.id}</p>
                      </div>
                    </td>

                    <td>{emp.designation}</td>
                    <td>{emp.phone}</td>

                    <td>
                      <div>
                        <p>{emp.emergencyName}</p>
                        <p className="text-xs text-muted-foreground">{emp.emergencyPhone}</p>
                      </div>
                    </td>

                    <td>{emp.shift}</td>

                    <td>
                      <button
                        onClick={() => toggleAttendance(emp.id)}
                        className={`px-3 py-1 rounded text-white ${
                          emp.attendance ? "bg-green-600" : "bg-red-600"
                        }`}
                      >
                        {emp.attendance ? "Present" : "Absent"}
                      </button>
                    </td>

                    <td className="text-right">
                      <div className="flex justify-end gap-2">
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
                          disabled={!emp.attendance}
                          title={
                            emp.attendance
                              ? "Send an incident alert to this employee's phone"
                              : "Employee is marked Absent — alert unavailable"
                          }
                          onClick={() => openAlertDialog(emp)}
                          className={emp.attendance ? "border-red-200 text-red-700 hover:bg-red-50" : ""}
                        >
                          <BellRing className="h-4 w-4 mr-2" />
                          Send Alert
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedEmployee(emp)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Employee Details Modal */}
        <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
          <DialogContent className="sm:max-w-4xl">
            {selectedEmployee && (
              <>
                <DialogHeader>
                  <DialogTitle>Employee Details</DialogTitle>
                  <DialogDescription>Complete workforce profile</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-5 py-4">
                  <Info label="Employee ID" value={selectedEmployee.id} />
                  <Info label="Name" value={selectedEmployee.name} />
                  <Info label="Designation" value={selectedEmployee.designation} />
                  <Info label="Phone" value={selectedEmployee.phone} />
                  <Info label="Emergency Contact" value={selectedEmployee.emergencyName} />
                  <Info label="Emergency Phone" value={selectedEmployee.emergencyPhone} />
                  <Info label="Shift" value={selectedEmployee.shift} />
                  <Info label="Blood Group" value={selectedEmployee.bloodGroup} />
                  <Info label="PPE Status" value={selectedEmployee.ppe} />
                  <Info label="Training" value={selectedEmployee.training} />
                  <Info label="Medical Checkup" value={selectedEmployee.medical} />
                </div>

                <Badge className={selectedEmployee.attendance ? "bg-green-600" : "bg-red-600"}>
                  {selectedEmployee.attendance ? "Present" : "Absent"}
                </Badge>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Send Alert Dialog */}
        <Dialog open={!!alertTarget} onOpenChange={(open) => !open && setAlertTarget(null)}>
          <DialogContent className="sm:max-w-lg">
            {alertTarget && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-red-600" /> Send Incident Alert
                  </DialogTitle>
                  <DialogDescription>
                    Sends a push notification to {alertTarget.name}&apos;s enrolled phone right now.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Incident Type</Label>
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

                  <div className="space-y-2">
                    <Label>Severity</Label>
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

                  <div className="space-y-2">
                    <Label>Title</Label>
                    <input
                      className="w-full rounded-md border p-2 text-sm"
                      value={alertTitle}
                      onChange={(e) => setAlertTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      value={alertMessage}
                      onChange={(e) => setAlertMessage(e.target.value)}
                      placeholder="Describe the incident and what the employee should do..."
                      rows={4}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    No response yet from this employee&apos;s device?{" "}
                    <button
                      type="button"
                      className="underline underline-offset-2"
                      onClick={() => copyEnrolmentLink(alertTarget)}
                    >
                      Copy their enrolment link
                    </button>{" "}
                    and have them open it once on their phone.
                  </p>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setAlertTarget(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendAlert}
                    disabled={isSendingAlert}
                    className="bg-red-600 hover:bg-red-700 text-white gap-2"
                  >
                    {isSendingAlert ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <BellRing className="h-4 w-4" /> Send Alert Now
                      </>
                    )}
                  </Button>
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
      <p className="font-medium">{value}</p>
    </div>
  );
}
