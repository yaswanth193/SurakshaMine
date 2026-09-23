// Utility for generating official PDF reports for Coal Mining Regulations
// Powered by jsPDF & jspdf-autotable

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { StatutoryRegulation, MineComplianceBreakdown } from "./regulationsData";

// Helper: Add Government / DGMS Official Header
function addOfficialHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  refNumber: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top header banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, "F");

  // Gold accent bar
  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(0, 28, pageWidth, 2.5, "F");

  // Government Emblem Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(
    "GOVERNMENT OF INDIA  •  MINISTRY OF COAL & MINES SAFETY",
    pageWidth / 2,
    10,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    "DIRECTORATE GENERAL OF MINES SAFETY (DGMS)  •  STATUTORY OVERSIGHT CODEX",
    pageWidth / 2,
    16,
    { align: "center" }
  );

  doc.setFontSize(7.5);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text(`REFERENCE CODEX: ${refNumber}  •  DATE: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, pageWidth / 2, 22, {
    align: "center",
  });

  // Main Document Title
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 14, 38);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(subtitle, 14, 43);

  // Separator line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 46, pageWidth - 14, 46);
}

// Helper: Add Footer with page numbers and legal disclaimer
function addOfficialFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "CONFIDENTIAL & STATUTORY  •  Generated under Directorate General of Mines Safety (DGMS) Guidelines  •  SurakshaMine Portal",
      14,
      pageHeight - 9
    );

    doc.setFont("helvetica", "bold");
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 9, {
      align: "right",
    });
  }
}

/**
 * Download a standalone, comprehensive legal dossier for a single regulation.
 */
export function downloadSingleRulePDF(rule: StatutoryRegulation) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  addOfficialHeader(
    doc,
    `STATUTORY REGULATION: ${rule.code}`,
    rule.title,
    `${rule.code}/DGMS/${new Date().getFullYear()}`
  );

  let startY = 52;

  // Metadata Table
  autoTable(doc, {
    startY,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45, fillColor: [248, 250, 252] },
      1: { cellWidth: "auto" },
    },
    body: [
      ["Rule Code", rule.code],
      ["Statutory Act / Authority", `${rule.statutoryAct} (${rule.authority})`],
      ["Gazette Reference", rule.gazetteRef],
      ["Enforcement Domain", rule.category],
      ["Audit / Verification Frequency", rule.frequency],
      ["Issuing Office", rule.issuingOffice],
      ["Compliance Threshold", rule.complianceThreshold],
    ],
  });

  startY = (doc as any).lastAutoTable.finalY + 8;

  // Legal Text Heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("1. Full Legal Enactment & Operative Provisions", 14, startY);
  startY += 5;

  // Legal text box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  const legalLines = doc.splitTextToSize(rule.fullLegalText, 182);
  const boxHeight = legalLines.length * 4.2 + 6;

  // Check if box exceeds page
  if (startY + boxHeight > 270) {
    doc.addPage();
    startY = 20;
  }

  doc.rect(14, startY, 182, boxHeight, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(legalLines, 17, startY + 5);
  startY += boxHeight + 8;

  // Mandatory Operational Requirements
  if (startY > 240) {
    doc.addPage();
    startY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("2. Mandatory Colliery Operational Requirements", 14, startY);
  startY += 4;

  const reqRows = rule.mandatoryRequirements.map((req, idx) => [
    `#${idx + 1}`,
    req,
  ]);

  autoTable(doc, {
    startY,
    theme: "striped",
    head: [["No.", "Statutory Compliance Clause"]],
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center", fontStyle: "bold" },
      1: { cellWidth: "auto" },
    },
    body: reqRows,
  });

  startY = (doc as any).lastAutoTable.finalY + 8;

  // Penal Clauses
  if (startY > 245) {
    doc.addPage();
    startY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(185, 28, 28); // red-700
  doc.text("3. Penal Clauses & Judicial Liabilities for Breach", 14, startY);
  startY += 4;

  autoTable(doc, {
    startY,
    theme: "grid",
    styles: {
      fontSize: 7.5,
      cellPadding: 3,
      textColor: [127, 29, 29],
      fillColor: [254, 242, 242],
    },
    body: [[rule.penalClause]],
  });

  startY = (doc as any).lastAutoTable.finalY + 12;

  // Sign-off signature blocks
  if (startY > 250) {
    doc.addPage();
    startY = 25;
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(14, startY + 15, 75, startY + 15);
  doc.line(130, startY + 15, 195, startY + 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Chief Inspector of Mines / Deputy DG", 14, startY + 19);
  doc.text("Colliery Safety Officer / General Manager", 130, startY + 19);

  addOfficialFooter(doc);

  // Save PDF
  doc.save(`${rule.code.replace(/[^a-zA-Z0-9_-]/g, "_")}_Statutory_Regulation.pdf`);
}

/**
 * Download the complete government compendium of all statutory regulations.
 */
export function downloadFullCompendiumPDF(rules: StatutoryRegulation[]) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  addOfficialHeader(
    doc,
    "COMPREHENSIVE COAL MINES REGULATIONS CODEX",
    "Master Reference Manual for Indian Coal Collieries (CMR 2017, Mines Act 1952, CPCB, CCO)",
    "DGMS/CODEX/2026/ALL-RULES"
  );

  let startY = 52;

  // Executive Abstract
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("EXECUTIVE STATUTORY SUMMARY", 14, startY);
  startY += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const intro =
    "This statutory compendium establishes the mandatory baseline requirements governing opencast and underground coal mining operations in India. All collieries operating under Coal India Limited (CIL), Singareni Collieries (SCCL), and captive commercial miners must strictly maintain adherence to these provisions. Any violation attracts stringent penal measures under Sections 72-74 of the Mines Act, 1952.";
  const introLines = doc.splitTextToSize(intro, 182);
  doc.text(introLines, 14, startY);
  startY += introLines.length * 4.2 + 6;

  // Master Summary Table
  const tableData = rules.map((r, i) => [
    `${i + 1}`,
    r.code,
    r.title,
    r.category,
    r.frequency,
    r.complianceThreshold,
  ]);

  autoTable(doc, {
    startY,
    theme: "grid",
    head: [
      [
        "No.",
        "Rule Code",
        "Statutory Heading",
        "Domain",
        "Frequency",
        "Compliance Benchmark",
      ],
    ],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    styles: {
      fontSize: 6.8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 25, fontStyle: "bold" },
      2: { cellWidth: 50 },
      3: { cellWidth: 32 },
      4: { cellWidth: 20 },
      5: { cellWidth: "auto" },
    },
    body: tableData,
  });

  // Detailed Section for each rule
  rules.forEach((rule) => {
    doc.addPage();
    startY = 20;

    // Rule header block
    doc.setFillColor(241, 245, 249);
    doc.rect(14, startY, 182, 14, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${rule.code}: ${rule.title}`, 18, startY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Domain: ${rule.category}  |  Enforcing Body: ${rule.authority}  |  Gazette: ${rule.gazetteRef}`,
      18,
      startY + 11
    );

    startY += 19;

    // Legal Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text("Statutory Provision:", 14, startY);
    startY += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const pLines = doc.splitTextToSize(rule.fullLegalText, 182);
    doc.text(pLines, 14, startY);
    startY += pLines.length * 3.8 + 5;

    // Requirements table
    autoTable(doc, {
      startY,
      theme: "striped",
      head: [["Mandatory Requirements for Colliery Compliance"]],
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
      },
      body: rule.mandatoryRequirements.map((r, i) => [`• ${r}`]),
    });

    startY = (doc as any).lastAutoTable.finalY + 5;

    // Penalties & Threshold
    autoTable(doc, {
      startY,
      theme: "grid",
      head: [["Statutory Compliance Threshold", "Penal Consequences for Non-Compliance"]],
      headStyles: {
        fillColor: [100, 116, 139],
        textColor: [255, 255, 255],
        fontSize: 7.5,
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 92, textColor: [185, 28, 28] },
      },
      body: [[rule.complianceThreshold, rule.penalClause]],
    });
  });

  addOfficialFooter(doc);

  // Save PDF
  doc.save("DGMS_Coal_Mines_Statutory_Regulations_Compendium.pdf");
}

/**
 * Download a tailored colliery regulatory adherence audit report for a specific mine.
 */
export function downloadMineAdherencePDF(mine: MineComplianceBreakdown) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  addOfficialHeader(
    doc,
    `COLLIERY REGULATORY AUDIT: ${mine.mineName.toUpperCase()}`,
    `Comprehensive Adherence Verification Report - ${mine.subsidiary}`,
    `AUDIT/${mine.mineId}/${new Date().getFullYear()}`
  );

  let startY = 52;

  // Mine Info Card
  autoTable(doc, {
    startY,
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
    },
    head: [["Colliery Profile & Administrative Details", "Audit Summary & Adherence Score"]],
    body: [
      [
        `Mine Name: ${mine.mineName} (${mine.mineId})\nSubsidiary: ${mine.subsidiary}\nLocation: ${mine.location}\nMine Type: ${mine.type}`,
        `Overall Adherence: ${mine.overallAdherencePercent}%\nRules Followed: ${mine.followedCount} of ${mine.totalRulesCount}\nSafety Officer: ${mine.safetyOfficer}\nLast Statutory Audit: ${mine.lastAuditDate}\nCompliance Status: ${mine.status.toUpperCase()}`,
      ],
    ],
  });

  startY = (doc as any).lastAutoTable.finalY + 8;

  // Section Heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("RULE-BY-RULE STATUTORY ADHERENCE BREAKDOWN", 14, startY);
  startY += 4;

  const adherenceRows = mine.rulesAdherence.map((item, idx) => {
    return [
      `${idx + 1}`,
      item.ruleCode,
      item.ruleTitle,
      item.isFollowing ? "FOLLOWING" : "DEFICIENT",
      `${item.complianceScore}%`,
      item.telemetryEvidence + (item.remediationNote ? `\n[Remediation: ${item.remediationNote}]` : ""),
      item.verifiedDate,
    ];
  });

  autoTable(doc, {
    startY,
    theme: "grid",
    head: [
      [
        "No.",
        "Rule Code",
        "Statutory Heading",
        "Status",
        "Score",
        "Telemetry / Field Verification & Remediation",
        "Verified",
      ],
    ],
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 6.8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 22, fontStyle: "bold" },
      2: { cellWidth: 42 },
      3: { cellWidth: 22, fontStyle: "bold", halign: "center" },
      4: { cellWidth: 12, halign: "center" },
      5: { cellWidth: 58 },
      6: { cellWidth: 18, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        if (data.cell.raw === "FOLLOWING") {
          data.cell.styles.textColor = [22, 101, 52]; // green-800
          data.cell.styles.fillColor = [220, 252, 231]; // green-100
        } else {
          data.cell.styles.textColor = [153, 27, 27]; // red-800
          data.cell.styles.fillColor = [254, 226, 226]; // red-100
        }
      }
    },
    body: adherenceRows,
  });

  startY = (doc as any).lastAutoTable.finalY + 12;

  // Sign-off verification section
  if (startY > 240) {
    doc.addPage();
    startY = 25;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("STATUTORY VERIFICATION & AUDIT SIGN-OFF", 14, startY);
  startY += 18;

  doc.setDrawColor(148, 163, 184);
  doc.line(14, startY, 75, startY);
  doc.line(130, startY, 195, startY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Inspecting DGMS Officer\nRegistration No: DGMS/INSP/2026", 14, startY + 4);
  doc.text(
    `Colliery Manager: ${mine.safetyOfficer}\n${mine.mineName}, ${mine.subsidiary}`,
    130,
    startY + 4
  );

  addOfficialFooter(doc);

  // Save PDF
  doc.save(`${mine.mineName.replace(/\s+/g, "_")}_Regulatory_Adherence_Audit.pdf`);
}
