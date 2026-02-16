export interface SmokeballMatter {
  id: string;
  matterNumber: string;
  matterType: string;
  status: string;
  clientName: string;
  clientEmail: string;
  propertyAddress: string;
  stage: string;
  tasks: SmokeballTask[];
  documents: SmokeballDocument[];
  keyDates: { label: string; date: string }[];
}

export interface SmokeballTask {
  id: string;
  title: string;
  status: "PENDING" | "COMPLETE";
  dueDate: string;
  category: string;
}

export interface SmokeballDocument {
  id: string;
  name: string;
  category: string;
  dateAdded: string;
  size: string;
}

const MOCK_MATTERS: SmokeballMatter[] = [
  {
    id: "sb-matter-001",
    matterNumber: "SB-2026-0041",
    matterType: "Purchase",
    status: "In Progress",
    clientName: "Emily Chen",
    clientEmail: "emily.chen@gmail.com",
    propertyAddress: "42 Harbour View Drive, Manly NSW 2095",
    stage: "Pre-Exchange",
    tasks: [
      { id: "sb-task-001", title: "Order title search", status: "COMPLETE", dueDate: "2026-02-20", category: "Compliance" },
      { id: "sb-task-002", title: "Review vendor disclosure statement", status: "PENDING", dueDate: "2026-03-01", category: "Compliance" },
      { id: "sb-task-003", title: "Arrange building & pest inspection", status: "PENDING", dueDate: "2026-03-05", category: "Compliance" },
      { id: "sb-task-004", title: "Confirm finance pre-approval", status: "PENDING", dueDate: "2026-03-10", category: "Finance" },
    ],
    documents: [
      { id: "sb-doc-001", name: "Contract of Sale.pdf", category: "contract", dateAdded: "2026-02-10", size: "2.1 MB" },
      { id: "sb-doc-002", name: "Section 32 Statement.pdf", category: "disclosure", dateAdded: "2026-02-10", size: "1.8 MB" },
      { id: "sb-doc-003", name: "Title Search Results.pdf", category: "compliance", dateAdded: "2026-02-15", size: "450 KB" },
    ],
    keyDates: [
      { label: "Contract Date", date: "2026-02-10" },
      { label: "Cooling Off Expires", date: "2026-02-15" },
      { label: "Finance Due", date: "2026-03-10" },
      { label: "Settlement Date", date: "2026-04-20" },
    ],
  },
  {
    id: "sb-matter-002",
    matterNumber: "SB-2026-0042",
    matterType: "Sale",
    status: "In Progress",
    clientName: "David & Sarah Thompson",
    clientEmail: "david.thompson@outlook.com",
    propertyAddress: "7/15 Ocean Street, Bondi NSW 2026",
    stage: "Exchanged",
    tasks: [
      { id: "sb-task-005", title: "Prepare contract of sale", status: "COMPLETE", dueDate: "2026-01-15", category: "Compliance" },
      { id: "sb-task-006", title: "Obtain strata report", status: "COMPLETE", dueDate: "2026-01-20", category: "Compliance" },
      { id: "sb-task-007", title: "Confirm deposit received", status: "COMPLETE", dueDate: "2026-02-01", category: "Finance" },
      { id: "sb-task-008", title: "Arrange discharge of mortgage", status: "PENDING", dueDate: "2026-03-15", category: "Finance" },
      { id: "sb-task-009", title: "Prepare settlement statement", status: "PENDING", dueDate: "2026-03-20", category: "Settlement" },
    ],
    documents: [
      { id: "sb-doc-004", name: "Contract of Sale - Executed.pdf", category: "contract", dateAdded: "2026-02-01", size: "3.2 MB" },
      { id: "sb-doc-005", name: "Strata Report.pdf", category: "compliance", dateAdded: "2026-01-20", size: "5.4 MB" },
      { id: "sb-doc-006", name: "Deposit Receipt.pdf", category: "finance", dateAdded: "2026-02-01", size: "120 KB" },
    ],
    keyDates: [
      { label: "Exchange Date", date: "2026-02-01" },
      { label: "Settlement Date", date: "2026-03-25" },
    ],
  },
  {
    id: "sb-matter-003",
    matterNumber: "SB-2026-0043",
    matterType: "Purchase",
    status: "In Progress",
    clientName: "Michael Nguyen",
    clientEmail: "m.nguyen@yahoo.com.au",
    propertyAddress: "28 Eucalyptus Crescent, Castle Hill NSW 2154",
    stage: "Pre-Completion",
    tasks: [
      { id: "sb-task-010", title: "Title search completed", status: "COMPLETE", dueDate: "2026-01-10", category: "Compliance" },
      { id: "sb-task-011", title: "Finance approval received", status: "COMPLETE", dueDate: "2026-01-25", category: "Finance" },
      { id: "sb-task-012", title: "Exchange contracts", status: "COMPLETE", dueDate: "2026-02-05", category: "Compliance" },
      { id: "sb-task-013", title: "Final property inspection", status: "PENDING", dueDate: "2026-03-01", category: "Compliance" },
      { id: "sb-task-014", title: "Prepare transfer documents", status: "PENDING", dueDate: "2026-03-05", category: "Settlement" },
      { id: "sb-task-015", title: "Arrange settlement funds", status: "PENDING", dueDate: "2026-03-08", category: "Finance" },
    ],
    documents: [
      { id: "sb-doc-007", name: "Contract of Sale.pdf", category: "contract", dateAdded: "2026-01-05", size: "2.8 MB" },
      { id: "sb-doc-008", name: "Finance Approval Letter.pdf", category: "finance", dateAdded: "2026-01-25", size: "340 KB" },
      { id: "sb-doc-009", name: "Building Inspection Report.pdf", category: "inspection", dateAdded: "2026-01-18", size: "4.2 MB" },
      { id: "sb-doc-010", name: "Pest Inspection Report.pdf", category: "inspection", dateAdded: "2026-01-18", size: "1.9 MB" },
    ],
    keyDates: [
      { label: "Contract Date", date: "2026-01-05" },
      { label: "Exchange Date", date: "2026-02-05" },
      { label: "Settlement Date", date: "2026-03-10" },
    ],
  },
  {
    id: "sb-matter-004",
    matterNumber: "SB-2025-0198",
    matterType: "Purchase",
    status: "Completed",
    clientName: "Lisa & Mark Williams",
    clientEmail: "lisa.williams@icloud.com",
    propertyAddress: "3/42 Toorak Road, South Yarra VIC 3141",
    stage: "Settled",
    tasks: [
      { id: "sb-task-016", title: "Title search completed", status: "COMPLETE", dueDate: "2025-11-01", category: "Compliance" },
      { id: "sb-task-017", title: "Finance approval received", status: "COMPLETE", dueDate: "2025-11-15", category: "Finance" },
      { id: "sb-task-018", title: "Exchange contracts", status: "COMPLETE", dueDate: "2025-11-20", category: "Compliance" },
      { id: "sb-task-019", title: "Settlement completed", status: "COMPLETE", dueDate: "2025-12-15", category: "Settlement" },
    ],
    documents: [
      { id: "sb-doc-011", name: "Contract of Sale.pdf", category: "contract", dateAdded: "2025-10-28", size: "2.5 MB" },
      { id: "sb-doc-012", name: "Transfer Document.pdf", category: "settlement", dateAdded: "2025-12-15", size: "1.1 MB" },
      { id: "sb-doc-013", name: "Settlement Statement.pdf", category: "finance", dateAdded: "2025-12-15", size: "280 KB" },
    ],
    keyDates: [
      { label: "Contract Date", date: "2025-10-28" },
      { label: "Exchange Date", date: "2025-11-20" },
      { label: "Settlement Date", date: "2025-12-15" },
    ],
  },
];

export function isConfigured(): boolean {
  return true;
}

export function getMatters(): SmokeballMatter[] {
  return MOCK_MATTERS.map(({ tasks, documents, keyDates, ...rest }) => ({
    ...rest,
    tasks: [],
    documents: [],
    keyDates: [],
  }));
}

export function getMatter(id: string): SmokeballMatter | undefined {
  return MOCK_MATTERS.find((m) => m.id === id);
}

export function syncMatter(smokeballMatterId: string): SmokeballMatter | undefined {
  return MOCK_MATTERS.find((m) => m.id === smokeballMatterId);
}
