"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import {
  Users,
  
  Search,
  Eye,
  Shield,
  Heart,
  UserCheck,
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
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
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


const initialEmployees = [
  {
    id: "EMP-001",
    name: "Ramesh Kumar",
    designation: "Drill Operator",
    phone: "9876543210",
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
  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.designation.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAttendance = (id: string) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id
          ? { ...emp, attendance: !emp.attendance }
          : emp
      )
    );
  };

  return (
    <>
    <Header />
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Employee Management
        </h1>
        <p className="text-muted-foreground">
          Workforce monitoring and attendance management
        </p>
      </div>

      {/* Stats */}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <Users className="mb-2 h-6 w-6 text-yellow-600" />
            <p className="text-sm text-muted-foreground">
              Total Employees
            </p>
            <p className="text-3xl font-bold">
              {employees.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <UserCheck className="mb-2 h-6 w-6 text-green-600" />
            <p className="text-sm text-muted-foreground">
              Present Today
            </p>
            <p className="text-3xl font-bold">
              {employees.filter((e) => e.attendance).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Shield className="mb-2 h-6 w-6 text-blue-600" />
            <p className="text-sm text-muted-foreground">
              PPE Issued
            </p>
            <p className="text-3xl font-bold">
              {employees.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Heart className="mb-2 h-6 w-6 text-red-600" />
            <p className="text-sm text-muted-foreground">
              Medical Records
            </p>
            <p className="text-3xl font-bold">
              {employees.length}
            </p>
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
              onChange={(e) =>
                setSearch(e.target.value)
              }
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
                <th className="text-left py-3">
                  Name
                </th>
                <th className="text-left">
                  Designation
                </th>
                <th className="text-left">
                  Phone
                </th>
                <th className="text-left">
                  Emergency Contact
                </th>
                <th className="text-left">
                  Shift
                </th>
                <th className="text-left">
                  Attendance
                </th>
                <th className="text-right">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b"
                >
                  <td className="py-4">
                    <div>
                      <p className="font-medium">
                        {emp.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {emp.id}
                      </p>
                    </div>
                  </td>

                  <td>{emp.designation}</td>

                  <td>{emp.phone}</td>

                  <td>
                    <div>
                      <p>{emp.emergencyName}</p>
                      <p className="text-xs text-muted-foreground">
                        {emp.emergencyPhone}
                      </p>
                    </div>
                  </td>

                  <td>{emp.shift}</td>

                  <td>
                    <button
                      onClick={() =>
                        toggleAttendance(emp.id)
                      }
                      className={`px-3 py-1 rounded text-white ${
                        emp.attendance
                          ? "bg-green-600"
                          : "bg-red-600"
                      }`}
                    >
                      {emp.attendance
                        ? "Present"
                        : "Absent"}
                    </button>
                  </td>

                  <td className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setSelectedEmployee(emp)
                      }
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Employee Details Modal */}

      <Dialog
        open={!!selectedEmployee}
        onOpenChange={() =>
          setSelectedEmployee(null)
        }
      >
<DialogContent className="sm:max-w-4xl">
  {selectedEmployee && (
    <>
      <DialogHeader>
        <DialogTitle>
          Employee Details
        </DialogTitle>
        <DialogDescription>
          Complete workforce profile
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-5 py-4">
        <Info label="Employee ID" value={selectedEmployee.id} />
        <Info label="Name" value={selectedEmployee.name} />

        <Info
          label="Designation"
          value={selectedEmployee.designation}
        />
        <Info
          label="Phone"
          value={selectedEmployee.phone}
        />

        <Info
          label="Emergency Contact"
          value={selectedEmployee.emergencyName}
        />
        <Info
          label="Emergency Phone"
          value={selectedEmployee.emergencyPhone}
        />

        <Info
          label="Shift"
          value={selectedEmployee.shift}
        />
        <Info
          label="Blood Group"
          value={selectedEmployee.bloodGroup}
        />

        <Info
          label="PPE Status"
          value={selectedEmployee.ppe}
        />
        <Info
          label="Training"
          value={selectedEmployee.training}
        />

        <Info
          label="Medical Checkup"
          value={selectedEmployee.medical}
        />
      </div>

      <Badge
        className={
          selectedEmployee.attendance
            ? "bg-green-600"
            : "bg-red-600"
        }
      >
        {selectedEmployee.attendance
          ? "Present"
          : "Absent"}
      </Badge>
    </>
  )}
</DialogContent>
</Dialog>
</main>
</>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

// export default function EmployeesPage() {
//   return (
//     <div className="p-6">
//       <h1 className="text-3xl font-bold">
//         Employees Page Working
//       </h1>
//     </div>
//   );
// }