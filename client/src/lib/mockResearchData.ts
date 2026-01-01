import { ChangeLog, Company, DocumentRecord, EventRecord, Industry, Note, PipelineItem, Source, Thesis } from "@/types/research";

export const industries: Industry[] = [
  {
    id: "fintech",
    name: "Fintech Infrastructure",
    size: "$48B TAM",
    growth: "14% CAGR",
    pe: "28x sector PE",
    drivers: ["API adoption", "Cloud-first banks", "Embedded finance"],
    themes: ["Payments orchestration", "Risk automation", "AI compliance"],
  },
  {
    id: "healthtech",
    name: "HealthTech Services",
    size: "$92B TAM",
    growth: "11% CAGR",
    pe: "24x sector PE",
    drivers: ["Payer pressure", "Virtual care", "AI diagnostics"],
    themes: ["Revenue cycle", "Care navigation", "Data pipes"],
  },
];

export const companies: Company[] = [
  {
    id: "stratos",
    name: "Stratos Payments",
    industryId: "fintech",
    mcap: "$2.1B",
    cmp: "$18.24",
    pe: "32x",
    stage: "Core",
    categories: ["Payments", "Risk"],
    summary: "Global payments router with AI chargeback defense and treasury tools.",
    metrics: {
      "Revenue Run-Rate": "$185M",
      "Net Revenue Retention": "128%",
      "Gross Margin": "78%",
      "Customers": "640 enterprise",
    },
  },
  {
    id: "medora",
    name: "Medora Health",
    industryId: "healthtech",
    mcap: "$780M",
    cmp: "$9.85",
    pe: "21x",
    stage: "Watchlist",
    categories: ["Care delivery", "Data"],
    summary: "Virtual-first specialty clinics with payer integrations and AI triage.",
    metrics: {
      "Revenue Run-Rate": "$92M",
      "Gross Margin": "64%",
      "Clinician NPS": "71",
    },
  },
];

export const documents: DocumentRecord[] = [
  {
    id: "doc-1",
    filename: "Stratos FY24 Investor Update.pdf",
    type: "investor_presentation",
    companyId: "stratos",
    industryId: "fintech",
    uploadedAt: "2024-11-02",
    pages: 42,
    summary: "Product velocity, new risk controls, and European expansion updates.",
    tags: ["payments", "risk", "product"],
  },
  {
    id: "doc-2",
    filename: "Fintech Infra Landscape 2025.pdf",
    type: "industry_report",
    industryId: "fintech",
    uploadedAt: "2025-01-14",
    pages: 58,
    summary: "Landscape review of infra vendors, interchange trends, and issuer stacks.",
    tags: ["landscape", "infra", "interchange"],
  },
  {
    id: "doc-3",
    filename: "Medora Q3 FY24 Results.pdf",
    type: "quarterly_earnings",
    companyId: "medora",
    industryId: "healthtech",
    uploadedAt: "2024-10-28",
    pages: 29,
    summary: "Improved payer mix, operating leverage, and clinician marketplace growth.",
    tags: ["results", "payers", "opex"],
  },
];

export const notes: Note[] = [
  {
    id: "note-1",
    companyId: "stratos",
    type: "insight",
    title: "Routing edge",
    body: "Merchants adopting Stratos for smart routing see 120-200bps uplift in auth rates vs legacy gateways.",
    createdAt: "2025-01-08",
    updatedAt: "2025-01-08",
  },
  {
    id: "note-2",
    companyId: "stratos",
    type: "risk",
    title: "Issuer dependency",
    body: "Visa incentives rolling off in FY25 could compress gross margins by 200bps without offsetting volume.",
    createdAt: "2025-01-15",
    updatedAt: "2025-01-15",
  },
  {
    id: "note-3",
    companyId: "medora",
    type: "insight",
    title: "Payer leverage",
    body: "New multi-year contracts include quality bonuses tied to readmission reduction metrics.",
    createdAt: "2025-01-12",
    updatedAt: "2025-01-12",
  },
];

export const sources: Source[] = [
  {
    id: "src-1",
    entityType: "note",
    entityId: "note-1",
    label: "Merchant cohort analysis",
    ref: "Internal dataset",
    createdAt: "2025-01-08",
  },
  {
    id: "src-2",
    entityType: "event",
    entityId: "evt-1",
    label: "Q3 results call",
    ref: "Transcript pages 4-7",
    url: "https://example.com/stratos-q3",
    createdAt: "2024-10-28",
  },
  {
    id: "src-3",
    entityType: "risk",
    entityId: "note-2",
    label: "Issuer contracts",
    ref: "Contracts appendix",
    createdAt: "2025-01-15",
  },
];

export const theses: Thesis[] = [
  {
    id: "ths-1",
    companyId: "stratos",
    status: "Active",
    conviction: "High",
    intent: "Core position with opportunistic adds on dislocations.",
    positionSizePct: 7,
    expectedIRR: "22-28%",
    baseCase: "30% topline CAGR, GM 78-80%, durable net retention >120%.",
    bullCase: "Faster issuer mix shift plus EU launches drive 35%+ CAGR and 25% adj. EBITDA margin by FY27.",
    bearCase: "Card mix shifts to A2A; authorization uplift narrows; pricing pressure compresses margins.",
    sellTriggers: ["Auth rate edge erodes", "Net retention <110%", "New markets stall"],
    updatedAt: "2025-01-10",
  },
  {
    id: "ths-2",
    companyId: "medora",
    status: "On Deck",
    conviction: "Medium",
    intent: "Track payer mix shift and clinician marketplace liquidity before sizing.",
    positionSizePct: 3,
    expectedIRR: "15-18%",
    baseCase: "20% topline CAGR with steady 60%+ GM and improving unit economics.",
    bullCase: "Payer bonuses expand margin profile; AI triage licensing adds high-margin revenue.",
    bearCase: "Reg reimbursement slows virtual visits; clinician supply constraints persist.",
    sellTriggers: ["Churn >5%", "Payer bonuses removed", "Clinician NPS drops"],
    updatedAt: "2025-01-05",
  },
];

export const changeLogs: ChangeLog[] = [
  {
    id: "chg-1",
    companyId: "stratos",
    date: "2025-01-11",
    type: "Product",
    impact: "Positive",
    text: "Launched AI dispute resolution reducing manual review by 40%.",
  },
  {
    id: "chg-2",
    companyId: "medora",
    date: "2025-01-03",
    type: "People",
    impact: "Neutral",
    text: "Hired new Chief Medical Officer from leading academic health system.",
  },
];

export const events: EventRecord[] = [
  {
    id: "evt-1",
    companyId: "stratos",
    period: "Q3 FY24",
    date: "2024-10-28",
    kind: "results",
    theme: "Execution",
    notes: "Beat on GP, guided FY25 slightly above consensus; FX headwinds noted.",
    sources: ["src-2"],
  },
  {
    id: "evt-2",
    companyId: "medora",
    period: "Q2 FY24",
    date: "2024-07-19",
    kind: "concall",
    theme: "Growth",
    notes: "Payer bonuses to ramp in H2; virtual specialty clinics expanding to cardiology.",
  },
];

export const pipeline: PipelineItem[] = [
  {
    id: "pipe-1",
    stage: "Sourcing",
    companyId: "medora",
    summary: "Monitor payer mix shift and clinician marketplace liquidity.",
  },
  {
    id: "pipe-2",
    stage: "Research",
    companyId: "stratos",
    summary: "Deep dive on issuer exposure and interchange resilience.",
  },
  {
    id: "pipe-3",
    stage: "Diligence",
    companyId: "stratos",
    summary: "Validate AI dispute win rates across top 20 merchants.",
  },
];

export function getIndustry(id?: string) {
  return industries.find((i) => i.id === id);
}

export function getCompany(id?: string) {
  return companies.find((c) => c.id === id);
}

export function getDocumentsFor(entity?: { companyId?: string; industryId?: string }) {
  return documents.filter((doc) => {
    const matchesCompany = entity?.companyId ? doc.companyId === entity.companyId : true;
    const matchesIndustry = entity?.industryId ? doc.industryId === entity.industryId : true;
    return matchesCompany && matchesIndustry;
  });
}

export function getNotesForCompany(companyId: string) {
  return notes.filter((note) => note.companyId === companyId);
}

export function getSourcesFor(entityId: string) {
  return sources.filter((src) => src.entityId === entityId);
}
