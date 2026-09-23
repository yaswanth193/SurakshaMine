// Trusted Statutory Coal Mining Regulations & Mine Adherence Dataset
// Sourced from: Directorate General of Mines Safety (DGMS), Ministry of Coal (MoC),
// Ministry of Environment, Forest and Climate Change (MoEFCC), and Coal Controller's Organisation (CCO)

export interface StatutoryRegulation {
  id: string;
  code: string;
  title: string;
  category:
    | "Mine Safety & Strata"
    | "Occupational Health & Welfare"
    | "Environmental & Pollution Control"
    | "Statutory Reporting & Concession";
  authority: string;
  statutoryAct: string;
  gazetteRef: string;
  frequency: string;
  mandatoryRequirements: string[];
  complianceThreshold: string;
  penalClause: string;
  fullLegalText: string;
  issuingOffice: string;
}

export interface MineRuleAdherence {
  ruleCode: string;
  ruleTitle: string;
  category: string;
  isFollowing: boolean;
  complianceScore: number;
  verifiedDate: string;
  verifiedBy: string;
  telemetryEvidence: string;
  remediationNote?: string;
}

export interface MineComplianceBreakdown {
  mineId: string;
  mineName: string;
  location: string;
  type: "Underground" | "Opencast";
  subsidiary: string;
  overallAdherencePercent: number;
  followedCount: number;
  totalRulesCount: number;
  safetyOfficer: string;
  lastAuditDate: string;
  status: "Fully Compliant" | "Substantially Compliant" | "Action Required";
  rulesAdherence: MineRuleAdherence[];
}

export const STATUTORY_REGULATIONS_DATA: StatutoryRegulation[] = [
  {
    id: "reg-cmr-104",
    code: "CMR-2017-R104",
    title: "Continuous Methane (CH4) & Telemetric Toxic Gas Monitoring",
    category: "Mine Safety & Strata",
    authority: "Directorate General of Mines Safety (DGMS)",
    statutoryAct: "Coal Mines Regulations 2017, Regulation 104, 169 & Technical Circular 03/2021",
    gazetteRef: "G.S.R. 1475(E) / DGMS(Tech)(SOMA)/03/2021",
    frequency: "Continuous 24x7 Real-Time Telemetry",
    mandatoryRequirements: [
      "Multipoint infrared/catalytic CH4 sensors installed at return airways, longwall extraction panels, and blind headings.",
      "Automatic electrical power isolation triggered instantaneously at >= 1.25% CH4 concentration.",
      "Acoustic and optical threshold alarms sounded at >= 0.75% CH4 at pit-head and underground control room.",
      "Daily physical calibration of stationary and portable methanometers recorded in statutory logbook."
    ],
    complianceThreshold: "Methane concentration < 0.75% at return airway; automatic trip at >= 1.25%",
    penalClause: "Immediate suspension of underground electrical power and work withdrawal under Section 22(1A) of the Mines Act, 1952.",
    fullLegalText: "Under Regulation 104 of the Coal Mines Regulations, 2017, in every underground coal mine of second or third degree gassiness, continuous telemetric monitoring systems with automatic visual and audible warning alarms and electrical interlocks must be maintained continuously at all working faces, return airways, and sealed areas.",
    issuingOffice: "DGMS Eastern & Central Zones, Dhanbad",
  },
  {
    id: "reg-cmr-123",
    code: "CMR-2017-R123",
    title: "SCAMP (Strata Control and Monitoring Plan) & Extensometer Audits",
    category: "Mine Safety & Strata",
    authority: "Directorate General of Mines Safety (DGMS)",
    statutoryAct: "Coal Mines Regulations 2017, Regulation 123 & DGMS Circular 04/2026",
    gazetteRef: "CMR-2017 Part IX / SCAMP Directives",
    frequency: "Daily Physical Audit & Real-Time Radar Telemetry",
    mandatoryRequirements: [
      "Dual-height tell-tale extensometers installed at all roadway junctions, gallery splits, and depillaring boundaries at intervals <= 20m.",
      "Mandatory resin capsule anchor pull-out testing verifying minimum 10-Tonne load capacity.",
      "Continuous telemetric slope stability radar (SSR) deployed for opencast highwalls exceeding 30m vertical height.",
      "Daily sign-off by Strata Control Officer in Form VI-A prior to shift deployment."
    ],
    complianceThreshold: "Bed separation < 5mm green zone; >= 10mm triggers immediate amber withdrawal",
    penalClause: "Statutory notice under Section 22(3) prohibiting operations in affected district or bench.",
    fullLegalText: "Every mine manager shall formulate and implement a Strata Control and Monitoring Plan (SCAMP) specifying support design, mechanized rock bolting density, and displacement threshold alarms across all extraction zones.",
    issuingOffice: "DGMS Dhanbad Strata Control Directorate",
  },
  {
    id: "reg-cmr-149",
    code: "CMR-2017-R149",
    title: "Inundation Precaution, Sump Dewatering & 100% Standby Pumping",
    category: "Mine Safety & Strata",
    authority: "Directorate General of Mines Safety (DGMS)",
    statutoryAct: "Coal Mines Regulations 2017, Regulation 149 & DGMS Monsoon Directive 2026",
    gazetteRef: "DGMS(Tech) Directive MONSOON/2026",
    frequency: "Weekly Sump Volume Audits & Pre-Monsoon Survey",
    mandatoryRequirements: [
      "Total installed pumping capacity at main colliery sump must exceed peak inflow by minimum 100% (standby capacity equal to operative capacity).",
      "Surface check dams, perimeter bunds, and garland drains constructed above the Highest Flood Level (HFL).",
      "Underground connection boreholes to disused adjacent workings reinforced with hydrostatically certified concrete bulkheads.",
      "Emergency dewatering protocols rehearsed with statutory rescue station."
    ],
    complianceThreshold: "Standby pumping capacity >= 100% of maximum anticipated monsoon inflow",
    penalClause: "Immediate pit closure under Section 22(1) if water level exceeds safety demarcation gauge.",
    fullLegalText: "No working shall be extended to within 60 meters of any water-logged area, disused workings, or surface water body unless advance pilot exploratory boreholes and certified dewatering systems are deployed.",
    issuingOffice: "DGMS Dhanbad Mining Safety Division",
  },
  {
    id: "reg-cmr-208",
    code: "CMR-2017-R208",
    title: "Management of OEM Spares for Approved Mining Equipment (HEMM)",
    category: "Mine Safety & Strata",
    authority: "Directorate General of Mines Safety (DGMS)",
    statutoryAct: "Coal Mines Regulations 2017, Regulation 208(3) & DGMS Circular 13/2026",
    gazetteRef: "DGMS(Tech)(SOMA)/13 of 2026",
    frequency: "Per-Consignment Verification & Monthly Register Audit",
    mandatoryRequirements: [
      "Critical safety spares for shearers, continuous miners, SDLs, LHDs, and dumpers sourced strictly from OEM or DGMS-accredited vendors.",
      "Mandatory Certificate of Conformity (CoC) and third-party metallurgical integrity verification.",
      "Digital Spares Quarantine Register maintained and presented during statutory safety inspections.",
      "Written commissioning sign-off by Colliery Mechanical/Electrical Engineer under Regulation 31."
    ],
    complianceThreshold: "100% OEM Certificate of Conformity on safety-critical assemblies",
    penalClause: "Prohibition of equipment operation under Section 22(1A) of Mines Act, 1952.",
    fullLegalText: "Under Regulation 208(3), only genuine, approved spares adhering to DGMS field approval standards shall be deployed on mining machinery. Spurious or refurbished components are strictly prohibited.",
    issuingOffice: "DGMS Mechanical Directorate, Dhanbad",
  },
  {
    id: "reg-cmr-85",
    code: "CMR-2017-R85",
    title: "Haul Road Gradient, Berm Standards & Dumper Proximity Detection",
    category: "Mine Safety & Strata",
    authority: "DGMS Mechanical & Opencast Directorate",
    statutoryAct: "Coal Mines Regulations 2017, Regulations 85, 96 & DGMS Circular 05/2026",
    gazetteRef: "DGMS(Tech)(Mech)/05 of 2026",
    frequency: "Fortnightly Road Gradient & Berm Height Survey",
    mandatoryRequirements: [
      "Haul road gradient maintained strictly at or gentler than 1 in 16 (1 in 10 for short ramps <= 50m).",
      "Continuous safety berms along outer edge of roads constructed to height not less than tyre radius of largest vehicle.",
      "Dumpers of capacity 35 Tonnes and above retrofitted with DGMS-approved Proximity Warning Radar & Blind-Spot Cameras.",
      "Automatic Fire Detection and Suppression Systems (AFDSS) with linear heat sensing over engine manifolds."
    ],
    complianceThreshold: "Road gradient <= 1 in 16; Berm height >= largest tyre radius; 100% proximity radar retrofit",
    penalClause: "Immediate withdrawal of haul truck fitness certificate under CMR Regulation 85.",
    fullLegalText: "Opencast transport corridors must feature engineered drainage, dust suppression mist sprays, runaway safety catch ramps, and certified proximity avoidance systems on all transport fleets.",
    issuingOffice: "DGMS Dhanbad Opencast Division",
  },
  {
    id: "reg-cmr-182",
    code: "CMR-2017-R182",
    title: "Flameproof (FLP) Electrical Apparatus & Intrinsically Safe Telemetry",
    category: "Mine Safety & Strata",
    authority: "DGMS Electrical Directorate",
    statutoryAct: "Coal Mines Regulations 2017, Regulation 182, 186 & Central Electricity Authority (CEA) Regulations",
    gazetteRef: "CMR-2017 Electrical Standards Chapter XIV",
    frequency: "Monthly Flameproof Gap & Earth Leakage Relay Audit",
    mandatoryRequirements: [
      "All electrical machinery, switchgear, junction boxes, and lights deployed below ground certified FLP (Group I).",
      "Earth leakage protective devices calibrated to trip within 30 milliseconds on fault current exceeding 750mA.",
      "Intrinsically safe (Ex-i) barriers on all communication, gas detection, and seismic monitoring networks.",
      "Weekly insulation resistance tests logged in Electrical Supervisor statutory register."
    ],
    complianceThreshold: "Flameproof flange gap <= 0.5mm; earth leakage trip <= 30ms",
    penalClause: "Power disconnection notice and cancellation of Electrical Supervisor competency certificate.",
    fullLegalText: "All electrical equipment below ground shall be of such construction, installation, and maintenance as to prevent danger from shock, burn, fire, and ignition of firedamp or coal dust.",
    issuingOffice: "DGMS Electrical Inspectorate, Dhanbad",
  },
  {
    id: "reg-ma-22a",
    code: "MA-1952-S22A",
    title: "Mandatory Personal Protective Equipment (PPE) & Self-Rescuers (SCSR)",
    category: "Occupational Health & Welfare",
    authority: "Directorate General of Mines Safety (DGMS) & Ministry of Labour",
    statutoryAct: "Mines Act 1952, Section 22A & Coal Mines Regulations 2017 Regulation 182",
    gazetteRef: "Mines Act 1952 (Act No. 35 of 1952) Sec 22A",
    frequency: "Daily Pit-Head Entry Turnstile Inspection",
    mandatoryRequirements: [
      "Every person entering underground workings issued and wearing DGMS-certified hard hat, cap lamp, steel-toed footwear, and high-visibility apparel.",
      "Self-Contained Self-Rescuer (SCSR) providing minimum 60 minutes oxygen carried by all subterranean personnel.",
      "Automated turnstile RFID scanning preventing pit access to workers lacking certified PPE.",
      "Quarterly leak testing of SCSR canisters in pneumatic test bench."
    ],
    complianceThreshold: "100% PPE compliance; zero entry without verified SCSR",
    penalClause: "Immediate bar from underground entry and monetary penalty per worker non-compliance.",
    fullLegalText: "Section 22A empowers inspectors to prohibit deployment of any person in a mine unless adequate and certified protective equipment for prevention of injury and occupational disease is supplied free of cost.",
    issuingOffice: "DGMS Directorate of Occupational Safety & Health",
  },
  {
    id: "reg-mr-29b",
    code: "MR-1955-R29B",
    title: "Periodic Medical Examination (PME) & Audiometric Health Screening",
    category: "Occupational Health & Welfare",
    authority: "DGMS Directorate of Occupational Health",
    statutoryAct: "Mines Rules 1955, Rule 29B, 29C & Chapter IV",
    gazetteRef: "Mines Rules 1955 Form O, P, P-I",
    frequency: "Every 5 Years (Every 3 Years for Workers > 45 Years)",
    mandatoryRequirements: [
      "Full medical examination including chest radiography (ILO classification for coal workers' pneumoconiosis).",
      "Pure-tone audiometry screening to detect early noise-induced hearing loss (NIHL) in HEMM operators.",
      "Spirometry pulmonary function test (PFT) and vision acuity certification.",
      "Statutory Form O issued and digital health record uploaded to portal within 14 days."
    ],
    complianceThreshold: "100% active workforce covered by valid PME within statutory window",
    penalClause: "Disqualification of worker deployment and fine on mine management under Rule 29O.",
    fullLegalText: "Every person employed in a mine shall be examined by an approved Medical Officer once in every five years up to the age of 45, and once in every three years thereafter, for occupational fitness and disease detection.",
    issuingOffice: "DGMS Occupational Health Division, Dhanbad",
  },
  {
    id: "reg-mvtr-09",
    code: "MVTR-1966-R09",
    title: "Mandatory Simulator-Based Heavy Machinery & Vocational Training",
    category: "Occupational Health & Welfare",
    authority: "DGMS & Directorate of Vocational Training",
    statutoryAct: "Mines Vocational Training Rules 1966 & DGMS Legislative Circular 01/2026",
    gazetteRef: "MVTR-1966 Rules 6-12 / VTC Schemes",
    frequency: "Triennial Refresher & Pre-Deployment Initial",
    mandatoryRequirements: [
      "No worker deployed without completing 12-day safety induction and initial vocational training curriculum.",
      "Heavy Earth Moving Machinery (HEMM) operators must complete minimum 20 hours simulator-based training.",
      "Biometric attendance logged directly from Vocational Training Centres (VTC) to regulatory database.",
      "Quarterly mock disaster response and fire-fighting exercises conducted across all shifts."
    ],
    complianceThreshold: "100% trained workforce; zero deployment with expired VTC certificate",
    penalClause: "Personal penal liability on Mine Manager under Section 72C of the Mines Act, 1952.",
    fullLegalText: "The manager of every mine shall ensure that no person is employed unless they have undergone the prescribed training and refresher courses at a recognized Vocational Training Centre.",
    issuingOffice: "DGMS Vocational Training Cell, Dhanbad",
  },
  {
    id: "reg-ma-23",
    code: "MA-1952-S23",
    title: "Statutory Notice of Accidents, Fatalities & Serious Bodily Injuries",
    category: "Occupational Health & Welfare",
    authority: "Directorate General of Mines Safety (DGMS)",
    statutoryAct: "Mines Act 1952, Section 23 & Coal Mines Regulations 2017 Regulation 8",
    gazetteRef: "Mines Act 1952 Sec 23 / Form IV-A, IV-B",
    frequency: "Within 24 Hours of Occurrence (Immediate Telegraphic/Portal)",
    mandatoryRequirements: [
      "Immediate portal notification and telegraphic dispatch to Regional Inspector within 24 hours of any accident causing death or serious bodily injury.",
      "Accident site sealed and preserved untouched until inspection by DGMS officer, except for rescue operations.",
      "Detailed Form IV-A inquiry report submitted within 7 days detailing root cause and preventive remedial actions.",
      "Entry of every reportable injury into statutory Form J register."
    ],
    complianceThreshold: "Immediate notification within 24 hours; preservation of accident locus",
    penalClause: "Cognizable prosecution under Section 66 of Mines Act with imprisonment up to 3 months or fine.",
    fullLegalText: "When there occurs in or about a mine an accident causing loss of life or serious bodily injury, the owner, agent, or manager shall forthwith give notice thereof to the Chief Inspector and District Magistrate.",
    issuingOffice: "DGMS Regional Inspectorate",
  },
  {
    id: "reg-epa-svi",
    code: "EPA-1986-SVI",
    title: "Acid Mine Drainage (AMD) Neutralization & Effluent Treatment Standard",
    category: "Environmental & Pollution Control",
    authority: "Central Pollution Control Board (CPCB) & MoEFCC",
    statutoryAct: "Environment (Protection) Act 1986, Schedule VI & Water Act 1974",
    gazetteRef: "EPA-1986 S.O. 114(E) / CPCB Effluent Standards",
    frequency: "Weekly Heavy Metal Analysis & Continuous Online pH/TSS Telemetry",
    mandatoryRequirements: [
      "Effluent treatment plant (ETP) chemical dosing with lime neutralization for acidic pit discharge water.",
      "Continuous online effluent monitoring system (OCEMS) with telemetry feed to SPCB/CPCB servers.",
      "Mandatory parameters: pH strictly between 6.5 and 8.5; Total Suspended Solids (TSS) < 100 mg/L.",
      "Heavy metal concentrations (Iron < 3 mg/L, Manganese < 2 mg/L, Chromium < 0.1 mg/L) verified weekly."
    ],
    complianceThreshold: "pH: 6.5–8.5; TSS < 100 mg/L; Oil & Grease < 10 mg/L; Iron < 3 mg/L",
    penalClause: "Environmental compensation levy, revocation of Consent to Operate (CTO), and closure under Section 5 of EPA.",
    fullLegalText: "No mine shall discharge industrial effluent into any inland surface water body or natural nallah without neutralising acidity and stripping suspended solids in accordance with Schedule VI general standards.",
    issuingOffice: "CPCB New Delhi & State Pollution Control Boards",
  },
  {
    id: "reg-ap-caaq",
    code: "AP-1981-CAAQ",
    title: "Continuous Ambient Air Quality (CAAQMS) & Dust Suppression Standard",
    category: "Environmental & Pollution Control",
    authority: "State Pollution Control Board (SPCB) & MoEFCC",
    statutoryAct: "Air (Prevention and Control of Pollution) Act 1981 & MoEFCC EC Conditions",
    gazetteRef: "NAAQS Standards / Gazette S.O. 3843(E)",
    frequency: "Continuous 24x7 Air Quality Telemetry",
    mandatoryRequirements: [
      "Minimum 2 Continuous Ambient Air Quality Monitoring Stations (CAAQMS) installed upwind and downwind.",
      "High-pressure mist water fog cannons and atomized sprinkler corridors operational along active haul roads and coal handling plants (CHP).",
      "Real-time transmission of PM10, PM2.5, SO2, and NOx values to environmental portal.",
      "Automated truck wheel wash systems at colliery dispatch exit gates."
    ],
    complianceThreshold: "PM10 < 100 ug/m3 (24-hr avg); PM2.5 < 60 ug/m3; SO2 < 80 ug/m3",
    penalClause: "Show cause notice under Section 31A of Air Act 1981 and stoppage of coal dispatch permits.",
    fullLegalText: "Every colliery operator shall implement best available dust suppression technology to ensure ambient air particulate matter within core and buffer zones remains within National Ambient Air Quality Standards.",
    issuingOffice: "Ministry of Environment, Forest & Climate Change",
  },
  {
    id: "reg-epa-pmcp",
    code: "EPA-1986-PMCP",
    title: "Progressive Mine Closure Plan (PMCP) & Bio-Reclamation Directive",
    category: "Environmental & Pollution Control",
    authority: "Ministry of Coal & Indian Bureau of Mines (IBM) / MoEFCC",
    statutoryAct: "Mineral Conservation and Development Rules (MCDR) & Coal Mining Lease Mandates",
    gazetteRef: "MoC Guidelines for Mine Closure Plans 2020",
    frequency: "Annual Technical Audit & Third-Party Satellite Verification",
    mandatoryRequirements: [
      "Concurrent backfilling of exhausted opencast voids with overburden up to original ground contour.",
      "Spreading of preserved topsoil followed by biological reclamation with native forest and grass species.",
      "Maintenance of dedicated Escrow Account with annual closure financial assurance deposits.",
      "Third-party satellite remote sensing verification of plantation survival rate (> 75%)."
    ],
    complianceThreshold: "Annual backfilling >= 90% of target; topsoil conservation 100%; Escrow funded",
    penalClause: "Forfeiture of performance bank guarantee and cancellation of mining lease clearance.",
    fullLegalText: "All coal mining lessees are legally required to execute progressive reclamation of mined-out land concurrently with extraction so that physical, chemical, and biological stability is restored.",
    issuingOffice: "Ministry of Coal & Forest Conservation Division",
  },
  {
    id: "reg-cco-ccr",
    code: "CCO-CCR-2004",
    title: "Quarterly Statutory Coal Extraction Returns & Grade Reconciliation",
    category: "Statutory Reporting & Concession",
    authority: "Coal Controller's Organisation (CCO), Ministry of Coal",
    statutoryAct: "Colliery Control Rules 2004 & Mines Act 1952 Section 48",
    gazetteRef: "Colliery Control Order 2000 / Rules 2004",
    frequency: "Quarterly (Within 15 Days of Quarter End)",
    mandatoryRequirements: [
      "Mandatory submission of Form I, II, III & IV documenting raw coal production, seam-wise extraction, and opening/closing stock balance.",
      "Explosives consumption records and specific energy consumption audited quarterly.",
      "Bomb calorimeter Gross Calorific Value (GCV) grade reconciliation records certified by NABL laboratory.",
      "Clean Energy Cess and statutory royalty reconciliation uploaded to CCO portal."
    ],
    complianceThreshold: "100% digital submission of Form I-IV within 15 days of quarter ending",
    penalClause: "Suspension of coal dispatch clearance and fiscal penalties under Essential Commodities Act.",
    fullLegalText: "No owner or agent shall dispose of or sell coal unless statutory quarterly production returns, seam declarations, and grade certifications are approved by the Coal Controller.",
    issuingOffice: "Coal Controller's Organisation, Kolkata / New Delhi",
  },
  {
    id: "reg-mcr-45",
    code: "MCR-1960-R45",
    title: "DGPS Boundary Pillar Demarcation & Volumetric Drone Extraction Audits",
    category: "Statutory Reporting & Concession",
    authority: "Ministry of Coal & State Department of Mines and Geology",
    statutoryAct: "Mineral Concession Rules 1960 / 2026 Amendments & MMDR Act 1957",
    gazetteRef: "G.S.R. 142(E) / MCR-2026",
    frequency: "Quarterly Drone Photogrammetry & Annual DGPS Survey",
    mandatoryRequirements: [
      "All boundary pillars established with Differential Global Positioning System (DGPS) coordinates referenced to WGS-84 datum.",
      "Quarterly drone photogrammetric volumetric surveys calculating overburden excavated vs coal extracted.",
      "Mining lease boundary pillars painted with statutory serial numbers and inspected monthly.",
      "Submission of digital 3D mine surface model (DSM) to State Directorate of Mines."
    ],
    complianceThreshold: "Zero encroachment outside sanctioned lease boundary; 100% DGPS pillar verification",
    penalClause: "Immediate lease suspension and recovery of illegal mining penalty under Section 21 of MMDR Act.",
    fullLegalText: "Under amended Rule 45 of MCR, digital boundary verification and volumetric drone surveys must be conducted and submitted quarterly to ensure extraction conforms strictly to approved mining plan boundaries.",
    issuingOffice: "Ministry of Coal & State Mining Departments",
  }
];

// Colliery-Specific Statutory Rule Adherence Matrix
// Lists exactly which rules each specific mine (Mine A, Mine B, Mine C, Mine D, Mine E, Mine F) is currently following
export const MINE_ADHERENCE_BREAKDOWN_DATA: MineComplianceBreakdown[] = [
  {
    mineId: "M1",
    mineName: "Mine A (Jharia Seam Colliery)",
    location: "Dhanbad, Jharkhand",
    type: "Underground",
    subsidiary: "Bharat Coking Coal Limited (BCCL)",
    overallAdherencePercent: 87,
    followedCount: 13,
    totalRulesCount: 15,
    safetyOfficer: "Er. Alok Mukherjee (First Class Manager)",
    lastAuditDate: "18 Sep 2026",
    status: "Substantially Compliant",
    rulesAdherence: [
      {
        ruleCode: "CMR-2017-R104",
        ruleTitle: "Continuous Methane (CH4) & Telemetric Toxic Gas Monitoring",
        category: "Mine Safety & Strata",
        isFollowing: true,
        complianceScore: 100,
        verifiedDate: "18 Sep 2026",
        verifiedBy: "DGMS Regional Inspector Er. K. Sharma",
        telemetryEvidence: "16 telemetry sensors online. Main return CH4 steady at 0.18% (well below 0.75% threshold). Automatic power trip tested ok."
      },
      {
        ruleCode: "CMR-2017-R123",
        ruleTitle: "SCAMP (Strata Control and Monitoring Plan) & Extensometer Audits",
        category: "Mine Safety & Strata",
        isFollowing: true,
        complianceScore: 95,
        verifiedDate: "16 Sep 2026",
        verifiedBy: "Strata Control Officer S. Soren",
        telemetryEvidence: "24 dual-height tell-tale extensometers logged daily. Max bed separation 2.8mm in panel 4B (safe green threshold)."
      },
      {
        ruleCode: "CMR-2017-R149",
        ruleTitle: "Inundation Precaution, Sump Dewatering & 100% Standby Pumping",
        category: "Mine Safety & Strata",
        isFollowing: true,
        complianceScore: 100,
        verifiedDate: "12 Sep 2026",
        verifiedBy: "Colliery Mechanical Engineer R. Pathak",
        telemetryEvidence: "Main central sump pumping capacity installed at 4,800 GPM (120% standby capacity). Concrete bulkheads inspected."
      },
      {
        ruleCode: "CMR-2017-R208",
        ruleTitle: "Management of OEM Spares for Approved Mining Equipment (HEMM)",
        category: "Mine Safety & Strata",
        isFollowing: false,
        complianceScore: 55,
        verifiedDate: "10 Sep 2026",
        verifiedBy: "DGMS Mechanical Audit Team",
        telemetryEvidence: "SDL hydraulic seals and secondary brake cylinder spares lack OEM Certificate of Conformity.",
        remediationNote: "Procurement notice issued to accredited vendor. Spares quarantined in Bay 3 until OEM test certificates are validated."
      },
      {
        ruleCode: "CMR-2017-R85",
        ruleTitle: "Haul Road Gradient, Berm Standards & Dumper Proximity Detection",
        category: "Mine Safety & Strata",
        isFollowing: true,
        complianceScore: 92,
        verifiedDate: "14 Sep 2026",
        verifiedBy: "Pit Safety Officer T. Roy",
        telemetryEvidence: "Incline haulage gradient surveyed at 1 in 18. Secondary runaway drop-catchers tested operational."
      },
      {
        ruleCode: "CMR-2017-R182",
        ruleTitle: "Flameproof (FLP) Electrical Apparatus & Intrinsically Safe Telemetry",
        category: "Mine Safety & Strata",
        isFollowing: true,
        complianceScore: 100,
        verifiedDate: "15 Sep 2026",
        verifiedBy: "Electrical Inspector P. K. Verma",
        telemetryEvidence: "All underground gate-end boxes verified FLP. Earth leakage relay trips certified within 22 milliseconds."
      },
      {
        ruleCode: "MA-1952-S22A",
        ruleTitle: "Mandatory Personal Protective Equipment (PPE) & Self-Rescuers (SCSR)",
        category: "Occupational Health & Welfare",
        isFollowing: true,
        complianceScore: 100,
        verifiedDate: "18 Sep 2026",
        verifiedBy: "Safety Gate Marshal M. Ansari",
        telemetryEvidence: "RFID turnstile gate active. 342 on-duty workers verified equipped with DGMS hard hat, cap lamp, and 60-min SCSR."
      },
      {
        ruleCode: "MR-1955-R29B",
        ruleTitle: "Periodic Medical Examination (PME) & Audiometric Health Screening",
        category: "Occupational Health & Welfare",
        isFollowing: true,
        complianceScore: 94,
        verifiedDate: "05 Sep 2026",
        verifiedBy: "Chief Medical Officer Dr. B. N. Sen",
        telemetryEvidence: "318 of 342 permanent & contract workers completed PME and audiometry. Remaining 24 scheduled before Oct 15."
      },
      {
        ruleCode: "MVTR-1966-R09",
        ruleTitle: "Mandatory Simulator-Based Heavy Machinery & Vocational Training",
        category: "Occupational Health & Welfare",
        isFollowing: true,
        complianceScore: 90,
        verifiedDate: "08 Sep 2026",
        verifiedBy: "Group VTC Dhanbad Principal",
        telemetryEvidence: "100% of mechanized machinery operators completed mandatory simulator drills. VTC biometric records verified."
      },
      {
        ruleCode: "MA-1952-S23",
        ruleTitle: "Statutory Notice of Accidents, Fatalities & Serious Bodily Injuries",
        category: "Occupational Health & Welfare",
        isFollowing: true,
        complianceScore: 100,
        verifiedDate: "18 Sep 2026",
        verifiedBy: "DGMS Regional Inspector",
        telemetryEvidence: "Zero fatalities recorded in past 180 days. 1 minor wrist sprain logged in Form J with immediate first-aid."
      },
      {
        ruleCode: "EPA-1986-SVI",
        ruleTitle: "Acid Mine Drainage (AMD) Neutralization & Effluent Treatment Standard",
        category: "Environmental & Pollution Control",
        isFollowing: true,
        complianceScore: 92,
        verifiedDate: "17 Sep 2026",
        verifiedBy: "SPCB Environmental Analyst",
        telemetryEvidence: "Lime neutralization dosing operational at ETP. Treated pit water discharged at pH 7.4, TSS 48 mg/L."
      },
      {
        ruleCode: "AP-1981-CAAQ",
        ruleTitle: "Continuous Ambient Air Quality (CAAQMS) & Dust Suppression Standard",
        category: "Environmental & Pollution Control",
        isFollowing: false,
        complianceScore: 60,
        verifiedDate: "11 Sep 2026",
        verifiedBy: "State Pollution Control Board",
        telemetryEvidence: "CAAQMS Station 2 PM10 24-hr average spiked to 118 ug/m3 due to conveyor transfer chute leakage.",
        remediationNote: "High-pressure fog mist nozzles being installed on transfer tower 3. Re-inspection scheduled in 7 days."
      },
      {
        ruleCode: "EPA-1986-PMCP",
        ruleTitle: "Progressive Mine Closure Plan (PMCP) & Bio-Reclamation Directive",
        category: "Environmental & Pollution Control",
        isFollowing: true,
        complianceScore: 88,
        verifiedDate: "02 Sep 2026",
        verifiedBy: "Ministry of Coal Monitoring Cell",
        telemetryEvidence: "Escrow account balance funded per statutory schedule. Nursery sapling plantation underway."
      },
      {
        ruleCode: "CCO-CCR-2004",
        ruleTitle: "Quarterly Statutory Coal Extraction Returns & Grade Reconciliation",
        category: "Statutory Reporting & Concession",
        isFollowing: true,
        complianceScore: 100,
        verifiedDate: "15 Jul 2026",
        verifiedBy: "Coal Controller Regional Officer",
        telemetryEvidence: "Q1 Form I-IV extraction returns and NABL GCV grade certifications submitted and cleared without discrepancy."
      },
      {
        ruleCode: "MCR-1960-R45",
        ruleTitle: "DGPS Boundary Pillar Demarcation & Volumetric Drone Extraction Audits",
        category: "Statutory Reporting & Concession",
        isFollowing: true,
        complianceScore: 100,
        verifiedDate: "20 Aug 2026",
        verifiedBy: "State Directorate of Mines & Geology",
        telemetryEvidence: "All 18 lease boundary pillars verified with DGPS coordinates. Drone survey confirms zero encroachment."
      }
    ]
  },
  {
    mineId: "M2",
    mineName: "Mine B (Talcher Pit Project)",
    location: "Angul, Odisha",
    type: "Opencast",
    subsidiary: "Mahanadi Coalfields Limited (MCL)",
    overallAdherencePercent: 93,
    followedCount: 14,
    totalRulesCount: 15,
    safetyOfficer: "Er. Ramesh Mohapatra (Agent & General Manager)",
    lastAuditDate: "16 Sep 2026",
    status: "Substantially Compliant",
    rulesAdherence: [
      {
        ruleCode: "CMR-2017-R104",
        ruleTitle: "Continuous Methane (CH4) & Telemetric Toxic Gas Monitoring",
        category: "Mine Safety & Strata",
        isFollowing: true,
        complianceScore: 100,
        verifiedDate: "16 Sep 2026",
        verifiedBy: "DGMS Regional Inspector S. Behera",
        telemetryEvidence: "Opencast deep pit air velocity and bench carbon monoxide telemetries compliant with CMR 2017 standards."
      },
      {
        ruleCode: "CMR-2017-R123",
        ruleTitle: "SCAMP (Strata Control and Monitoring Plan) & Extensometer Audits",
        category: "Mine Safety & Strata",
        isFollowing: true,
        complianceScore: 98,
        verifiedDate: "15 Sep 2026",
        verifiedBy: "Slope Stability Officer D. Das",
        telemetryEvidence: "Slope Stability Radar (SSR) active 24x7 on 45m South-East highwall. Maximum displacement rate 0.4mm/day (safe)."
      },
      {
        ruleCode: "CMR-2017-R149",
        ruleTitle: "Inundation Precaution, Sump Dewatering & 100% Standby Pumping",
        category: "Mine Safety & Strata",
        isFollowing: true,
        complianceScore: 95,
        verifiedDate: "14 Sep 2026",
        verifiedBy: "Colliery Engineer A. Panda",
        telemetryEvidence: "Deep pit sump pumping capacity 6,000 GPM. Peripheral garland drains diverts surface runoff."
      },
      {
        ruleCode: "CMR-2017-R208",
        ruleTitle: "Management of OEM Spares for Approved Mining Equipment (HEMM)",
        category: "Mine Safety & Strata",
        isFollowing: true,
        complianceScore: 90,
        verifiedDate: "12 Sep 2026",
        verifiedBy: "DGMS Mechanical Inspectorate",
        telemetryEvidence: "Shovel and dumper transmission, steering, and braking spares 100% verified with BEML/Caterpillar OEM CoC."
      },
      {
        ruleCode: "CMR-2017-R85",
        ruleTitle: "Haul Road Gradient, Berm Standards & Dumper Proximity Detection",
        category: "Mine Safety & Strata",
        isFollowing: true,
        complianceScore: 96,
        verifiedDate: "16 Sep 2026",
        verifiedBy: "Pit Safety Inspector C. Sahu",
        telemetryEvidence: "Haul road gradient strictly 1 in 16. Berms built to 2.2m height (exceeds 1.8m tyre radius). 100% dumpers equipped with proximity radar."
      },
      {
        ruleCode: "CMR-2017-R182",
        ruleTitle: "Flameproof (FLP) Electrical Apparatus & Intrinsically Safe Telemetry",
        category: "Mine Safety & Strata",
        isFollowing: true,
        complianceScore: 95,
        verifiedDate: "10 Sep 2026",
        verifiedBy: "Electrical Supervisor B. Jena",
        telemetryEvidence: "Pit lighting towers and substation transformers equipped with fast-acting 20ms earth leakage relays."
      },
      {
        ruleCode: "MA-1952-S22A",
        ruleTitle: "Mandatory Personal Protective Equipment (PPE) & Self-Rescuers (SCSR)",
        category: "Occupational Health & Welfare",
        isFollowing: true,
        complianceScore: 100,
        verifiedDate: "16 Sep 2026",
        verifiedBy: "Security & Safety In-Charge",
        telemetryEvidence: "100% opencast workers equipped with reflective jackets, dust respirators, safety boots, and ear muffs."
      },
      {
        ruleCode: "MR-1955-R29B",
        ruleTitle: "Periodic Medical Examination (PME) & Audiometric Health Screening",
        category: "Occupational Health & Welfare",
        isFollowing: true,
        complianceScore: 96,
        verifiedDate: "08 Sep 2026",
        verifiedBy: "Medical Board MCL Hospital",
        telemetryEvidence: "275 of 287 workers cleared in Form O. Zero noise-induced hearing loss detected across heavy operators."
      },
      {
        ruleCode: "MVTR-1966-R09",
        ruleTitle: "Mandatory Simulator-Based Heavy Machinery & Vocational Training",
        category: "Occupational Health & Welfare",
        isFollowing: true,
        complianceScore: 100,
        verifiedDate: "04 Sep 2026",
        verifiedBy: "VTC Angul Director",
        telemetryEvidence: "54 dumper operators and 12 shovel operators completed annual VR simulator emergency reaction modules."
      },
      {
        ruleCode: "MA-1952-S23",
        ruleTitle: "Statutory Notice of Accidents, Fatalities & Serious Bodily Injuries",
        category: "Occupational Health & Welfare",
        isFollowing: true,
        complianceScore: 100,
        verifiedDate: "16 Sep 2026",
        verifiedBy: "DGMS Regional Inspector",
        telemetryEvidence: "Zero reportable accidents in past 240 days. National safety award review verified."
      },
      {
        ruleCode: "EPA-1986-SVI",
        ruleTitle: "Acid Mine Drainage (AMD) Neutralization & Effluent Treatment Standard",
        category: "Environmental & Pollution Control",
        isFollowing: true,
        complianceScore: 94,
        verifiedDate: "13 Sep 2026",
        verifiedBy: "State Pollution Control Board",
        telemetryEvidence: "Sedimentation settling pond output tested at pH 7.8, TSS 35 mg/L, Heavy metals below detection limit."
      },
      {
        ruleCode: "AP-1981-CAAQ",
        ruleTitle: "Continuous Ambient Air Quality (CAAQMS) & Dust Suppression Standard",
        category: "Environmental & Pollution Control",
        isFollowing: false,
        complianceScore: 65,
        verifiedDate: "11 Sep 2026",
        verifiedBy: "SPCB Inspectorate",
        telemetryEvidence: "Haul road water mist tanker sprinkler fleet had 2 tankers under breakdown, leading to transient dust surge.",
        remediationNote: "Tankers repaired and operational. Additional automated road-side atomized sprinkler nozzles deployed."
      },
      {
        ruleCode: "EPA-1986-PMCP",
        ruleTitle: "Progressive Mine Closure Plan (PMCP) & Bio-Reclamation Directive",
        category: "Environmental & Pollution Control",
        isFollowing: true,
        complianceScore: 92,
        verifiedDate: "01 Sep 2026",
        verifiedBy: "MoEFCC Regional Office",
        telemetryEvidence: "Overburden dump bench biological reclamation completed across 35 hectares with bamboo and neem canopy."
      },
      {
        ruleCode: "CCO-CCR-2004",
        ruleTitle: "Quarterly Statutory Coal Extraction Returns & Grade Reconciliation",
        category: "Statutory Reporting & Concession",
        isFollowing: true,
        complianceScore: 100,
        verifiedDate: "14 Jul 2026",
        verifiedBy: "Coal Controller Organisation",
        telemetryEvidence: "Production of 1.4 MT coal reconciliation and clean energy cess returns approved without objection."
      },
      {
        ruleCode: "MCR-1960-R45",
        ruleTitle: "DGPS Boundary Pillar Demarcation & Volumetric Drone Extraction Audits",
        category: "Statutory Reporting & Concession",
        isFollowing: true,
        complianceScore: 100,
        verifiedDate: "28 Aug 2026",
        verifiedBy: "Directorate of Geology Odisha",
        telemetryEvidence: "Volumetric excavation survey verified by high-resolution drone photogrammetry. Zero outside-lease excavation."
      }
    ]
  },
  {
    mineId: "M3",
    mineName: "Mine C (Singrauli North Colliery)",
    location: "Singrauli, Madhya Pradesh",
    type: "Underground",
    subsidiary: "Northern Coalfields Limited (NCL)",
    overallAdherencePercent: 73,
    followedCount: 11,
    totalRulesCount: 15,
    safetyOfficer: "Er. Vivek Trivedi",
    lastAuditDate: "12 Sep 2026",
    status: "Action Required",
    rulesAdherence: [
      {
        ruleCode: "CMR-2017-R104",
        ruleTitle: "Continuous Methane (CH4) & Telemetric Toxic Gas Monitoring",
        category: "Mine Safety & Strata",
        isFollowing: true,
        complianceScore: 92,
        verifiedDate: "12 Sep 2026",
        verifiedBy: "DGMS Inspector",
        telemetryEvidence: "Continuous methane sensors online. Daily physical check logged."
      },
      {
        ruleCode: "CMR-2017-R123",
        ruleTitle: "SCAMP (Strata Control and Monitoring Plan) & Extensometer Audits",
        category: "Mine Safety & Strata",
        isFollowing: false,
        complianceScore: 50,
        verifiedDate: "11 Sep 2026",
        verifiedBy: "DGMS Strata Inspectorate",
        telemetryEvidence: "Tell-tale extensometer in East Panel 2 showed 8mm separation without statutory amber flag alert.",
        remediationNote: "Re-bolting with 2m resin capsules ordered immediately. Area barricaded until support reinforcement completes."
      },
      {
        ruleCode: "CMR-2017-R149",
        ruleTitle: "Inundation Precaution, Sump Dewatering & 100% Standby Pumping",
        category: "Mine Safety & Strata",
        isFollowing: false,
        complianceScore: 52,
        verifiedDate: "10 Sep 2026",
        verifiedBy: "Safety Committee Audit",
        telemetryEvidence: "Main standby pump motor burned out; current standby pumping capacity is only 40% of peak inflow.",
        remediationNote: "Emergency replacement pump motor dispatched from regional store; commissioning within 48 hours."
      },
      {
        ruleCode: "CMR-2017-R208",
        ruleTitle: "Management of OEM Spares for Approved Mining Equipment (HEMM)",
        category: "Mine Safety & Strata",
        isFollowing: true,
        complianceScore: 85,
        verifiedDate: "09 Sep 2026",
        verifiedBy: "Mechanical Engineer",
        telemetryEvidence: "Continuous miner cutter head bits and shearer chains verified with OEM certificates."
      },
      {
        ruleCode: "CMR-2017-R85",
        ruleTitle: "Haul Road Gradient, Berm Standards & Dumper Proximity Detection",
        category: "Mine Safety & Strata",
        isFollowing: true,
        complianceScore: 90,
        verifiedDate: "08 Sep 2026",
        verifiedBy: "Pit Safety Inspector",
        telemetryEvidence: "Underground roadway gradients verified within statutory parameters."
      },
      {
        ruleCode: "CMR-2017-R182",
        ruleTitle: "Flameproof (FLP) Electrical Apparatus & Intrinsically Safe Telemetry",
        category: "Mine Safety & Strata",
        isFollowing: true,
        complianceScore: 90,
        verifiedDate: "07 Sep 2026",
        verifiedBy: "Electrical Supervisor",
        telemetryEvidence: "FLP certification verified for underground conveyor drives and lighting panels."
      },
      {
        ruleCode: "MA-1952-S22A",
        ruleTitle: "Mandatory Personal Protective Equipment (PPE) & Self-Rescuers (SCSR)",
        category: "Occupational Health & Welfare",
        isFollowing: true,
        complianceScore: 100,
        verifiedDate: "12 Sep 2026",
        verifiedBy: "Pit-Head Marshal",
        telemetryEvidence: "156 workers issued verified SCSR units and helmets before descent."
      },
      {
        ruleCode: "MR-1955-R29B",
        ruleTitle: "Periodic Medical Examination (PME) & Audiometric Health Screening",
        category: "Occupational Health & Welfare",
        isFollowing: false,
        complianceScore: 60,
        verifiedDate: "05 Sep 2026",
        verifiedBy: "Medical Officer",
        telemetryEvidence: "32 workers overdue for triennial PME renewal examination.",
        remediationNote: "Special medical camp scheduled on September 25 to clear all overdue examinations."
      },
      {
        ruleCode: "MVTR-1966-R09",
        ruleTitle: "Mandatory Simulator-Based Heavy Machinery & Vocational Training",
        category: "Occupational Health & Welfare",
        isFollowing: true,
        complianceScore: 85,
        verifiedDate: "04 Sep 2026",
        verifiedBy: "VTC Superintendent",
        telemetryEvidence: "All active continuous miner operators certified through simulator module."
      },
      {
        ruleCode: "MA-1952-S23",
        ruleTitle: "Statutory Notice of Accidents, Fatalities & Serious Bodily Injuries",
        category: "Occupational Health & Welfare",
        isFollowing: true,
        complianceScore: 100,
        verifiedDate: "12 Sep 2026",
        verifiedBy: "DGMS Inspector",
        telemetryEvidence: "Accident registers maintained in Form IV-A without backlog."
      },
      {
        ruleCode: "EPA-1986-SVI",
        ruleTitle: "Acid Mine Drainage (AMD) Neutralization & Effluent Treatment Standard",
        category: "Environmental & Pollution Control",
        isFollowing: true,
        complianceScore: 88,
        verifiedDate: "06 Sep 2026",
        verifiedBy: "SPCB Officer",
        telemetryEvidence: "Treated mine discharge water meets CPCB standards at pH 7.1."
      },
      {
        ruleCode: "AP-1981-CAAQ",
        ruleTitle: "Continuous Ambient Air Quality (CAAQMS) & Dust Suppression Standard",
        category: "Environmental & Pollution Control",
        isFollowing: false,
        complianceScore: 55,
        verifiedDate: "03 Sep 2026",
        verifiedBy: "SPCB Inspector",
        telemetryEvidence: "Downwind CAAQMS station telemetry offline for 4 days due to solar battery fault.",
        remediationNote: "UPS battery bank replacement in progress. Manual air sampling undertaken as interim."
      },
      {
        ruleCode: "EPA-1986-PMCP",
        ruleTitle: "Progressive Mine Closure Plan (PMCP) & Bio-Reclamation Directive",
        category: "Environmental & Pollution Control",
        isFollowing: true,
        complianceScore: 85,
        verifiedDate: "01 Sep 2026",
        verifiedBy: "MoC Cell",
        telemetryEvidence: "Annual Escrow deposit verified with State Bank of India."
      },
      {
        ruleCode: "CCO-CCR-2004",
        ruleTitle: "Quarterly Statutory Coal Extraction Returns & Grade Reconciliation",
        category: "Statutory Reporting & Concession",
        isFollowing: true,
        complianceScore: 92,
        verifiedDate: "12 Jul 2026",
        verifiedBy: "Coal Controller",
        telemetryEvidence: "Seam-wise extraction and coal dispatch returns accepted."
      },
      {
        ruleCode: "MCR-1960-R45",
        ruleTitle: "DGPS Boundary Pillar Demarcation & Volumetric Drone Extraction Audits",
        category: "Statutory Reporting & Concession",
        isFollowing: true,
        complianceScore: 90,
        verifiedDate: "22 Aug 2026",
        verifiedBy: "Mining Officer MP",
        telemetryEvidence: "Boundary pillars in place and photographed."
      }
    ]
  },
  {
    mineId: "M4",
    mineName: "Mine D (Gevra Mega Pit)",
    location: "Korba, Chhattisgarh",
    type: "Opencast",
    subsidiary: "South Eastern Coalfields Limited (SECL)",
    overallAdherencePercent: 100,
    followedCount: 15,
    totalRulesCount: 15,
    safetyOfficer: "Er. Rajesh K. Tiwari (Executive Director)",
    lastAuditDate: "20 Sep 2026",
    status: "Fully Compliant",
    rulesAdherence: [
      { ruleCode: "CMR-2017-R104", ruleTitle: "Continuous Methane (CH4) & Telemetric Toxic Gas Monitoring", category: "Mine Safety & Strata", isFollowing: true, complianceScore: 100, verifiedDate: "20 Sep 2026", verifiedBy: "DGMS Central Zone", telemetryEvidence: "Telemetry verified 100% compliant." },
      { ruleCode: "CMR-2017-R123", ruleTitle: "SCAMP (Strata Control and Monitoring Plan) & Extensometer Audits", category: "Mine Safety & Strata", isFollowing: true, complianceScore: 100, verifiedDate: "19 Sep 2026", verifiedBy: "DGMS Strata Directorate", telemetryEvidence: "Dual Slope Stability Radars tracking highwalls in real time." },
      { ruleCode: "CMR-2017-R149", ruleTitle: "Inundation Precaution, Sump Dewatering & 100% Standby Pumping", category: "Mine Safety & Strata", isFollowing: true, complianceScore: 100, verifiedDate: "18 Sep 2026", verifiedBy: "Colliery Engineer", telemetryEvidence: "140% standby pumping capacity installed and operational." },
      { ruleCode: "CMR-2017-R208", ruleTitle: "Management of OEM Spares for Approved Mining Equipment (HEMM)", category: "Mine Safety & Strata", isFollowing: true, complianceScore: 100, verifiedDate: "17 Sep 2026", verifiedBy: "DGMS Mechanical Directorate", telemetryEvidence: "100% OEM certificates authenticated in digital warehouse register." },
      { ruleCode: "CMR-2017-R85", ruleTitle: "Haul Road Gradient, Berm Standards & Dumper Proximity Detection", category: "Mine Safety & Strata", isFollowing: true, complianceScore: 100, verifiedDate: "20 Sep 2026", verifiedBy: "DGMS Opencast Division", telemetryEvidence: "World-class 1 in 18 haul roads; 100% 240T dumpers fitted with radar proximity avoidance." },
      { ruleCode: "CMR-2017-R182", ruleTitle: "Flameproof (FLP) Electrical Apparatus & Intrinsically Safe Telemetry", category: "Mine Safety & Strata", isFollowing: true, complianceScore: 100, verifiedDate: "15 Sep 2026", verifiedBy: "Electrical Inspector", telemetryEvidence: "All sub-stations and high-voltage shovel trailing cables compliant." },
      { ruleCode: "MA-1952-S22A", ruleTitle: "Mandatory Personal Protective Equipment (PPE) & Self-Rescuers (SCSR)", category: "Occupational Health & Welfare", isFollowing: true, complianceScore: 100, verifiedDate: "20 Sep 2026", verifiedBy: "Safety Marshall", telemetryEvidence: "412 on-site personnel fully equipped with smart helmets and reflective gear." },
      { ruleCode: "MR-1955-R29B", ruleTitle: "Periodic Medical Examination (PME) & Audiometric Health Screening", category: "Occupational Health & Welfare", isFollowing: true, complianceScore: 100, verifiedDate: "14 Sep 2026", verifiedBy: "CMO SECL Hospital", telemetryEvidence: "100% workforce medically certified in Form O." },
      { ruleCode: "MVTR-1966-R09", ruleTitle: "Mandatory Simulator-Based Heavy Machinery & Vocational Training", category: "Occupational Health & Welfare", isFollowing: true, complianceScore: 100, verifiedDate: "10 Sep 2026", verifiedBy: "VTC Korba", telemetryEvidence: "Full compliance with high-tech 360-degree HEMM simulator certification." },
      { ruleCode: "MA-1952-S23", ruleTitle: "Statutory Notice of Accidents, Fatalities & Serious Bodily Injuries", category: "Occupational Health & Welfare", isFollowing: true, complianceScore: 100, verifiedDate: "20 Sep 2026", verifiedBy: "DGMS Regional Inspector", telemetryEvidence: "Zero-harm safety milestone achieved for 365 consecutive days." },
      { ruleCode: "EPA-1986-SVI", ruleTitle: "Acid Mine Drainage (AMD) Neutralization & Effluent Treatment Standard", category: "Environmental & Pollution Control", isFollowing: true, complianceScore: 100, verifiedDate: "18 Sep 2026", verifiedBy: "CPCB / SPCB", telemetryEvidence: "State-of-the-art ETP discharging drinking-quality neutral water (pH 7.3, TSS 22 mg/L)." },
      { ruleCode: "AP-1981-CAAQ", ruleTitle: "Continuous Ambient Air Quality (CAAQMS) & Dust Suppression Standard", category: "Environmental & Pollution Control", isFollowing: true, complianceScore: 100, verifiedDate: "20 Sep 2026", verifiedBy: "SPCB", telemetryEvidence: "32 mist fog cannons and 4 CAAQMS stations streaming real-time PM10 < 72 ug/m3." },
      { ruleCode: "EPA-1986-PMCP", ruleTitle: "Progressive Mine Closure Plan (PMCP) & Bio-Reclamation Directive", category: "Environmental & Pollution Control", isFollowing: true, complianceScore: 100, verifiedDate: "05 Sep 2026", verifiedBy: "MoEFCC", telemetryEvidence: "Over 120 hectares of overburden dump transformed into dense green woodland." },
      { ruleCode: "CCO-CCR-2004", ruleTitle: "Quarterly Statutory Coal Extraction Returns & Grade Reconciliation", category: "Statutory Reporting & Concession", isFollowing: true, complianceScore: 100, verifiedDate: "15 Jul 2026", verifiedBy: "Coal Controller", telemetryEvidence: "Clean record quarterly returns verified." },
      { ruleCode: "MCR-1960-R45", ruleTitle: "DGPS Boundary Pillar Demarcation & Volumetric Drone Extraction Audits", category: "Statutory Reporting & Concession", isFollowing: true, complianceScore: 100, verifiedDate: "30 Aug 2026", verifiedBy: "Mining Directorate", telemetryEvidence: "DGPS boundary verified with zero deviation." }
    ]
  },
  {
    mineId: "M5",
    mineName: "Mine E (Raniganj Deep Colliery)",
    location: "Asansol, West Bengal",
    type: "Underground",
    subsidiary: "Eastern Coalfields Limited (ECL)",
    overallAdherencePercent: 80,
    followedCount: 12,
    totalRulesCount: 15,
    safetyOfficer: "Er. Subhashis Banerjee",
    lastAuditDate: "15 Sep 2026",
    status: "Substantially Compliant",
    rulesAdherence: [
      { ruleCode: "CMR-2017-R104", ruleTitle: "Continuous Methane (CH4) & Telemetric Toxic Gas Monitoring", category: "Mine Safety & Strata", isFollowing: true, complianceScore: 96, verifiedDate: "15 Sep 2026", verifiedBy: "DGMS Inspector", telemetryEvidence: "Continuous methane sensors online. Main return CH4 at 0.22%." },
      { ruleCode: "CMR-2017-R123", ruleTitle: "SCAMP (Strata Control and Monitoring Plan) & Extensometer Audits", category: "Mine Safety & Strata", isFollowing: true, complianceScore: 90, verifiedDate: "14 Sep 2026", verifiedBy: "Strata Officer", telemetryEvidence: "Tell-tale extensometers compliant across all extraction districts." },
      { ruleCode: "CMR-2017-R149", ruleTitle: "Inundation Precaution, Sump Dewatering & 100% Standby Pumping", category: "Mine Safety & Strata", isFollowing: true, complianceScore: 92, verifiedDate: "13 Sep 2026", verifiedBy: "Colliery Engineer", telemetryEvidence: "Standby pumping capacity 110% of maximum anticipated inflow." },
      { ruleCode: "CMR-2017-R208", ruleTitle: "Management of OEM Spares for Approved Mining Equipment (HEMM)", category: "Mine Safety & Strata", isFollowing: false, complianceScore: 60, verifiedDate: "09 Sep 2026", verifiedBy: "DGMS Mechanical Directorate", telemetryEvidence: "Continuous haulage hydraulic control valves awaiting OEM test certification.", remediationNote: "Quarantine applied. OEM vendor arriving for on-site calibration." },
      { ruleCode: "CMR-2017-R85", ruleTitle: "Haul Road Gradient, Berm Standards & Dumper Proximity Detection", category: "Mine Safety & Strata", isFollowing: false, complianceScore: 58, verifiedDate: "08 Sep 2026", verifiedBy: "Pit Safety Inspector", telemetryEvidence: "4 surface haul trucks awaiting retrofit of blind-spot radar sensors.", remediationNote: "Proximity sensor retrofit kits received. Installation scheduled by weekend." },
      { ruleCode: "CMR-2017-R182", ruleTitle: "Flameproof (FLP) Electrical Apparatus & Intrinsically Safe Telemetry", category: "Mine Safety & Strata", isFollowing: true, complianceScore: 100, verifiedDate: "15 Sep 2026", verifiedBy: "Electrical Inspector", telemetryEvidence: "All underground FLP enclosures checked; earth leakage trips verified within 25ms." },
      { ruleCode: "MA-1952-S22A", ruleTitle: "Mandatory Personal Protective Equipment (PPE) & Self-Rescuers (SCSR)", category: "Occupational Health & Welfare", isFollowing: true, complianceScore: 100, verifiedDate: "15 Sep 2026", verifiedBy: "Safety Marshall", telemetryEvidence: "100% underground staff issued 60-min SCSR units." },
      { ruleCode: "MR-1955-R29B", ruleTitle: "Periodic Medical Examination (PME) & Audiometric Health Screening", category: "Occupational Health & Welfare", isFollowing: true, complianceScore: 94, verifiedDate: "06 Sep 2026", verifiedBy: "Chief Medical Officer", telemetryEvidence: "Form O completed for 272 of 289 workers." },
      { ruleCode: "MVTR-1966-R09", ruleTitle: "Mandatory Simulator-Based Heavy Machinery & Vocational Training", category: "Occupational Health & Welfare", isFollowing: true, complianceScore: 90, verifiedDate: "04 Sep 2026", verifiedBy: "VTC Asansol", telemetryEvidence: "Triennial refresher training logged for all active shifts." },
      { ruleCode: "MA-1952-S23", ruleTitle: "Statutory Notice of Accidents, Fatalities & Serious Bodily Injuries", category: "Occupational Health & Welfare", isFollowing: true, complianceScore: 100, verifiedDate: "15 Sep 2026", verifiedBy: "DGMS Regional Inspector", telemetryEvidence: "Zero fatal occurrences; statutory accident registers compliant." },
      { ruleCode: "EPA-1986-SVI", ruleTitle: "Acid Mine Drainage (AMD) Neutralization & Effluent Treatment Standard", category: "Environmental & Pollution Control", isFollowing: true, complianceScore: 88, verifiedDate: "12 Sep 2026", verifiedBy: "SPCB West Bengal", telemetryEvidence: "ETP neutralization operational at pH 7.2." },
      { ruleCode: "AP-1981-CAAQ", ruleTitle: "Continuous Ambient Air Quality (CAAQMS) & Dust Suppression Standard", category: "Environmental & Pollution Control", isFollowing: false, complianceScore: 62, verifiedDate: "07 Sep 2026", verifiedBy: "SPCB Inspector", telemetryEvidence: "Fugitive dust suppression along rail loading gantry needs enhancement.", remediationNote: "Installing automated high-pressure spray headers along railway rake siding." },
      { ruleCode: "EPA-1986-PMCP", ruleTitle: "Progressive Mine Closure Plan (PMCP) & Bio-Reclamation Directive", category: "Environmental & Pollution Control", isFollowing: true, complianceScore: 85, verifiedDate: "02 Sep 2026", verifiedBy: "MoEFCC", telemetryEvidence: "Topsoil conservation and progressive reclamation on schedule." },
      { ruleCode: "CCO-CCR-2004", ruleTitle: "Quarterly Statutory Coal Extraction Returns & Grade Reconciliation", category: "Statutory Reporting & Concession", isFollowing: true, complianceScore: 100, verifiedDate: "15 Jul 2026", verifiedBy: "Coal Controller", telemetryEvidence: "Statutory Form I-IV submitted on time." },
      { ruleCode: "MCR-1960-R45", ruleTitle: "DGPS Boundary Pillar Demarcation & Volumetric Drone Extraction Audits", category: "Statutory Reporting & Concession", isFollowing: true, complianceScore: 100, verifiedDate: "25 Aug 2026", verifiedBy: "Mining Directorate WB", telemetryEvidence: "DGPS boundary verified." }
    ]
  },
  {
    mineId: "M6",
    mineName: "Mine F (Singareni Godavari Basin)",
    location: "Kothagudem, Telangana",
    type: "Opencast",
    subsidiary: "Singareni Collieries Company Limited (SCCL)",
    overallAdherencePercent: 93,
    followedCount: 14,
    totalRulesCount: 15,
    safetyOfficer: "Er. K. Venkat Rao",
    lastAuditDate: "17 Sep 2026",
    status: "Substantially Compliant",
    rulesAdherence: [
      { ruleCode: "CMR-2017-R104", ruleTitle: "Continuous Methane (CH4) & Telemetric Toxic Gas Monitoring", category: "Mine Safety & Strata", isFollowing: true, complianceScore: 100, verifiedDate: "17 Sep 2026", verifiedBy: "DGMS Inspector", telemetryEvidence: "Pit gas telemetries verified safe." },
      { ruleCode: "CMR-2017-R123", ruleTitle: "SCAMP (Strata Control and Monitoring Plan) & Extensometer Audits", category: "Mine Safety & Strata", isFollowing: true, complianceScore: 95, verifiedDate: "16 Sep 2026", verifiedBy: "Strata Officer", telemetryEvidence: "Highwall stability radar operating with automatic warning alarms." },
      { ruleCode: "CMR-2017-R149", ruleTitle: "Inundation Precaution, Sump Dewatering & 100% Standby Pumping", category: "Mine Safety & Strata", isFollowing: true, complianceScore: 100, verifiedDate: "14 Sep 2026", verifiedBy: "Mechanical Engineer", telemetryEvidence: "115% standby pumping capacity installed." },
      { ruleCode: "CMR-2017-R208", ruleTitle: "Management of OEM Spares for Approved Mining Equipment (HEMM)", category: "Mine Safety & Strata", isFollowing: true, complianceScore: 94, verifiedDate: "12 Sep 2026", verifiedBy: "DGMS Mechanical", telemetryEvidence: "100% OEM certificates on record for dragline and shovel components." },
      { ruleCode: "CMR-2017-R85", ruleTitle: "Haul Road Gradient, Berm Standards & Dumper Proximity Detection", category: "Mine Safety & Strata", isFollowing: true, complianceScore: 92, verifiedDate: "17 Sep 2026", verifiedBy: "Safety Inspector", telemetryEvidence: "Haul road gradient compliant at 1 in 16. Berms verified." },
      { ruleCode: "CMR-2017-R182", ruleTitle: "Flameproof (FLP) Electrical Apparatus & Intrinsically Safe Telemetry", category: "Mine Safety & Strata", isFollowing: true, complianceScore: 96, verifiedDate: "11 Sep 2026", verifiedBy: "Electrical Supervisor", telemetryEvidence: "Earth leakage relays calibrated to 24ms." },
      { ruleCode: "MA-1952-S22A", ruleTitle: "Mandatory Personal Protective Equipment (PPE) & Self-Rescuers (SCSR)", category: "Occupational Health & Welfare", isFollowing: true, complianceScore: 100, verifiedDate: "17 Sep 2026", verifiedBy: "Safety Marshall", telemetryEvidence: "178 workers equipped with full PPE gear." },
      { ruleCode: "MR-1955-R29B", ruleTitle: "Periodic Medical Examination (PME) & Audiometric Health Screening", category: "Occupational Health & Welfare", isFollowing: true, complianceScore: 95, verifiedDate: "09 Sep 2026", verifiedBy: "CMO SCCL", telemetryEvidence: "PME Form O completed for 170 workers; 8 scheduled next week." },
      { ruleCode: "MVTR-1966-R09", ruleTitle: "Mandatory Simulator-Based Heavy Machinery & Vocational Training", category: "Occupational Health & Welfare", isFollowing: true, complianceScore: 100, verifiedDate: "05 Sep 2026", verifiedBy: "VTC Principal", telemetryEvidence: "Simulator certification completed for all dragline and shovel crew." },
      { ruleCode: "MA-1952-S23", ruleTitle: "Statutory Notice of Accidents, Fatalities & Serious Bodily Injuries", category: "Occupational Health & Welfare", isFollowing: true, complianceScore: 100, verifiedDate: "17 Sep 2026", verifiedBy: "DGMS Inspector", telemetryEvidence: "Zero fatalities recorded; accident register Form IV-A clean." },
      { ruleCode: "EPA-1986-SVI", ruleTitle: "Acid Mine Drainage (AMD) Neutralization & Effluent Treatment Standard", category: "Environmental & Pollution Control", isFollowing: true, complianceScore: 90, verifiedDate: "13 Sep 2026", verifiedBy: "SPCB Telangana", telemetryEvidence: "Treated water discharge pH 7.5, TSS 40 mg/L." },
      { ruleCode: "AP-1981-CAAQ", ruleTitle: "Continuous Ambient Air Quality (CAAQMS) & Dust Suppression Standard", category: "Environmental & Pollution Control", isFollowing: true, complianceScore: 92, verifiedDate: "17 Sep 2026", verifiedBy: "SPCB", telemetryEvidence: "Atomized mist canons operating along transport corridor." },
      { ruleCode: "EPA-1986-PMCP", ruleTitle: "Progressive Mine Closure Plan (PMCP) & Bio-Reclamation Directive", category: "Environmental & Pollution Control", isFollowing: false, complianceScore: 65, verifiedDate: "01 Sep 2026", verifiedBy: "MoEFCC Cell", telemetryEvidence: "Backfilling in Sector 2 lagged behind annual target by 12%.", remediationNote: "Additional dragline allocation scheduled to bring backfilling up to schedule." },
      { ruleCode: "CCO-CCR-2004", ruleTitle: "Quarterly Statutory Coal Extraction Returns & Grade Reconciliation", category: "Statutory Reporting & Concession", isFollowing: true, complianceScore: 100, verifiedDate: "15 Jul 2026", verifiedBy: "Coal Controller", telemetryEvidence: "Quarterly coal production and GCV grade records verified." },
      { ruleCode: "MCR-1960-R45", ruleTitle: "DGPS Boundary Pillar Demarcation & Volumetric Drone Extraction Audits", category: "Statutory Reporting & Concession", isFollowing: true, complianceScore: 100, verifiedDate: "27 Aug 2026", verifiedBy: "Mines Dept Telangana", telemetryEvidence: "Drone volumetric survey verified within sanctioned coordinates." }
    ]
  }
];
