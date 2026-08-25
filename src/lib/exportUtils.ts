import { complianceService } from "./complianceService";
import { inspectionService } from "./inspectionService";
import { incidentService } from "./incidentService";
import { toast } from "sonner";

export function downloadCSV(headers: string[], rows: (string | number)[][], filename: string) {
  try {
    const csvContent = [
      headers.join(","),
      ...rows.map(row => 
        row.map(val => {
          if (val === undefined || val === null) return "";
          const strVal = String(val);
          // Escape quotes and commas
          if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n")) {
            return `"${strVal.replace(/"/g, '""')}"`;
          }
          return strVal;
        }).join(",")
      )
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Export CSV failed", e);
    throw new Error("Unable to export data.");
  }
}

export function downloadSummaryReport() {
  try {
    const today = new Date().toLocaleString("en-IN", { 
      day: "numeric", 
      month: "short", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });

    // Load data dynamically
    const complianceItems = complianceService.getComplianceItems();
    const inspectionItems = inspectionService.getInspections();
    const incidentItems = incidentService.getIncidents();
    const mines = complianceService.getMines();

    // Compute stats
    const compStats = complianceService.calculateComplianceStats(complianceItems);
    const inspectStats = inspectionService.calculateStats(inspectionItems);
    const incidentStats = incidentService.calculateStats(incidentItems);

    // Dynamic Compliance Score
    const overallComplianceScore = compStats.total > 0 
      ? Math.round((compStats.completed / compStats.total) * 100) 
      : 74;

    // Count risk mines
    let criticalMines = 0;
    let highMines = 0;
    let mediumMines = 0;
    let safeMines = 0;
    mines.forEach(m => {
      if (m.riskStatus === "critical") criticalMines++;
      else if (m.riskStatus === "high") highMines++;
      else if (m.riskStatus === "medium") mediumMines++;
      else safeMines++;
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CoalGov360 Governance Summary Report</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1f2937;
      margin: 0;
      padding: 40px;
      line-height: 1.5;
      background-color: #f9fafb;
    }
    .report-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 30px;
      max-width: 900px;
      margin: 0 auto;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    header {
      border-bottom: 3px solid #ca8a04;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .brand {
      font-size: 24px;
      font-weight: bold;
      color: #111827;
    }
    .brand span {
      color: #ca8a04;
    }
    .title {
      font-size: 22px;
      margin-top: 10px;
      font-weight: 600;
      color: #374151;
    }
    .meta {
      font-size: 13px;
      color: #6b7280;
      margin-top: 5px;
    }
    h2 {
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
      margin-top: 30px;
      color: #4b5563;
    }
    .stats-grid {
      display: grid;
      grid-template-cols: repeat(4, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    .stat-box {
      background-color: #f3f4f6;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
      border: 1px solid #e5e7eb;
    }
    .stat-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
    }
    .stat-val {
      font-size: 24px;
      font-weight: bold;
      color: #111827;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 13px;
    }
    th, td {
      text-align: left;
      padding: 10px;
      border-bottom: 1px solid #f3f4f6;
    }
    th {
      background-color: #f9fafb;
      color: #4b5563;
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-overdue, .badge-critical, .badge-requires-action, .badge-reported {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .badge-urgent, .badge-high {
      background-color: #ffedd5;
      color: #c2410c;
    }
    .badge-pending, .badge-medium, .badge-in-progress {
      background-color: #fef9c3;
      color: #854d0e;
    }
    .badge-completed, .badge-resolved, .badge-safe {
      background-color: #dcfce7;
      color: #166534;
    }
    .badge-scheduled {
      background-color: #dbeafe;
      color: #1e40af;
    }
    @media print {
      body {
        padding: 0;
        background: white;
      }
      .report-card {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="report-card">
    <div class="no-print" style="text-align: right; margin-bottom: 10px;">
      <button onclick="window.print()" style="background-color: #ca8a04; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">🖨️ Print / Save as PDF</button>
    </div>
    <header>
      <div class="brand">⛏️ Coal<span>Gov</span>360</div>
      <div class="title">Coal Mine Governance Summary Report</div>
      <div class="meta">Generated on: ${today} · Standard SIH Audit Core</div>
    </header>

    <h2>1. Executive Summary</h2>
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-label">Total Mines</div>
        <div class="stat-val">${mines.length}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Compliance Score</div>
        <div class="stat-val">${overallComplianceScore}%</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Active Incidents</div>
        <div class="stat-val">${incidentStats.active}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Pending Inspections</div>
        <div class="stat-val">${inspectStats.scheduled + inspectStats.inProgress}</div>
      </div>
    </div>

    <h2>2. Compliance Breakdown</h2>
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-label">Total Tasks</div>
        <div class="stat-val">${compStats.total}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Overdue</div>
        <div class="stat-val" style="color: #991b1b;">${compStats.overdue}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Pending</div>
        <div class="stat-val" style="color: #854d0e;">${compStats.pending}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Completed</div>
        <div class="stat-val" style="color: #166534;">${compStats.completed}</div>
      </div>
    </div>

    <h3 style="margin-top: 15px; font-size: 14px; color: #4b5563;">Compliance Details</h3>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Requirement</th>
          <th>Mine</th>
          <th>Category</th>
          <th>Assigned Person</th>
          <th>Due Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${complianceItems.map(item => `
          <tr>
            <td><strong>${item.id}</strong></td>
            <td>${item.title}</td>
            <td>${item.mineName}</td>
            <td>${item.category}</td>
            <td>${item.assignedTo}</td>
            <td>${item.dueDate}</td>
            <td><span class="badge badge-${item.status}">${item.status}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <h2>3. Inspections Summary</h2>
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-label">Total Audits</div>
        <div class="stat-val">${inspectStats.total}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Scheduled</div>
        <div class="stat-val">${inspectStats.scheduled}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Active / Pending</div>
        <div class="stat-val">${inspectStats.inProgress}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Completed</div>
        <div class="stat-val">${inspectStats.completed}</div>
      </div>
    </div>

    <h3 style="margin-top: 15px; font-size: 14px; color: #4b5563;">Inspection Records</h3>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Audit Name</th>
          <th>Mine</th>
          <th>Zone</th>
          <th>Inspector</th>
          <th>Date</th>
          <th>Severity</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${inspectionItems.map(item => `
          <tr>
            <td><strong>${item.id}</strong></td>
            <td>${item.title}</td>
            <td>${item.mineName}</td>
            <td>${item.zoneName}</td>
            <td>${item.inspectorName}</td>
            <td>${item.inspectionDate}</td>
            <td><span class="badge badge-${item.severity}">${item.severity}</span></td>
            <td><span class="badge badge-${item.status}">${item.status}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <h2>4. Incidents & Safety Summary</h2>
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-label">Total Incidents</div>
        <div class="stat-val">${incidentStats.total}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Active</div>
        <div class="stat-val" style="color: #991b1b;">${incidentStats.active}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Resolved</div>
        <div class="stat-val" style="color: #166534;">${incidentStats.resolved}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">High Severity</div>
        <div class="stat-val" style="color: #991b1b;">${incidentStats.high}</div>
      </div>
    </div>

    <h3 style="margin-top: 15px; font-size: 14px; color: #4b5563;">Incident Log</h3>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Type</th>
          <th>Mine</th>
          <th>Zone</th>
          <th>Report Date</th>
          <th>Severity</th>
          <th>Reported By</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${incidentItems.map(item => `
          <tr>
            <td><strong>${item.id}</strong></td>
            <td style="text-transform: capitalize;">${item.type}</td>
            <td>${item.mineName}</td>
            <td>${item.zoneName}</td>
            <td>${item.incidentDate}</td>
            <td><span class="badge badge-${item.severity}">${item.severity}</span></td>
            <td>${item.reportedBy}</td>
            <td><span class="badge badge-${item.status}">${item.status}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <h2>5. Mine Risk Scoring Summary</h2>
    <div class="stats-grid">
      <div class="stat-box" style="border-left: 5px solid #991b1b;">
        <div class="stat-label">Critical Risk</div>
        <div class="stat-val">${criticalMines}</div>
      </div>
      <div class="stat-box" style="border-left: 5px solid #c2410c;">
        <div class="stat-label">High Risk</div>
        <div class="stat-val">${highMines}</div>
      </div>
      <div class="stat-box" style="border-left: 5px solid #854d0e;">
        <div class="stat-label">Medium Risk</div>
        <div class="stat-val">${mediumMines}</div>
      </div>
      <div class="stat-box" style="border-left: 5px solid #166534;">
        <div class="stat-label">Safe</div>
        <div class="stat-val">${safeMines}</div>
      </div>
    </div>

    <h2 class="no-print">6. Priority Actions</h2>
    <ol style="font-size: 13px; margin-top: 10px; color: #374151;">
      ${compStats.overdue > 0 ? `<li><strong>Immediate Action Required:</strong> Address the ${compStats.overdue} overdue compliance issues currently flagged.</li>` : ""}
      ${incidentStats.high > 0 ? `<li><strong>Audit Review Required:</strong> Investigate the ${incidentStats.high} high-severity safety incidents in the log.</li>` : ""}
      <li>Perform regular geofenced audits on mines marked as Critical or High Risk to prevent anomalies.</li>
    </ol>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const formattedDate = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `coalgov360-governance-report-${formattedDate}.html`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Report generation failed", e);
    throw new Error("Unable to generate the report. Please try again.");
  }
}
