export interface PexaWorkspace {
  id: string;
  workspaceId: string;
  propertyAddress: string;
  settlementDate: string;
  status: string;
  participants: { role: string; name: string; status: string }[];
  financials: { description: string; amount: number }[];
}

export interface PexaSettlementUpdate {
  id: string;
  workspaceId: string;
  timestamp: string;
  type: string;
  message: string;
  details?: string;
}

const MOCK_WORKSPACES: Record<string, PexaWorkspace> = {
  "PXW-2026-00142": {
    id: "px-ws-001",
    workspaceId: "PXW-2026-00142",
    propertyAddress: "42 Harbour View Drive, Manly NSW 2095",
    settlementDate: "2026-03-15",
    status: "In Progress",
    participants: [
      { role: "Purchaser's Conveyancer", name: "Legal Eagles Conveyancing", status: "Accepted" },
      { role: "Vendor's Conveyancer", name: "Smith & Associates", status: "Accepted" },
      { role: "Incoming Mortgagee", name: "Commonwealth Bank", status: "Accepted" },
      { role: "Outgoing Mortgagee", name: "Westpac Banking Corporation", status: "Pending" },
    ],
    financials: [
      { description: "Purchase Price", amount: 1850000 },
      { description: "Deposit (10%)", amount: 185000 },
      { description: "Stamp Duty (NSW)", amount: 82440 },
      { description: "Registration Fee", amount: 154.80 },
      { description: "Council Rates Adjustment", amount: -842.36 },
      { description: "Water Rates Adjustment", amount: -215.60 },
    ],
  },
  "PXW-2026-00287": {
    id: "px-ws-002",
    workspaceId: "PXW-2026-00287",
    propertyAddress: "14 Bronte Road, Bondi Junction NSW 2022",
    settlementDate: "2026-04-15",
    status: "Created",
    participants: [
      { role: "Purchaser's Conveyancer", name: "Legal Eagles Conveyancing", status: "Accepted" },
      { role: "Vendor's Conveyancer", name: "Meridian Legal", status: "Pending" },
    ],
    financials: [
      { description: "Purchase Price", amount: 1350000 },
      { description: "Deposit (10%)", amount: 135000 },
      { description: "Stamp Duty (NSW)", amount: 57240 },
    ],
  },
};

const MOCK_SETTLEMENT_FEED: PexaSettlementUpdate[] = [
  {
    id: "pxu-001",
    workspaceId: "PXW-2026-00142",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    type: "status_change",
    message: "Settlement date confirmed: 15 March 2026",
    details: "All parties have agreed to the settlement date. PEXA workspace updated.",
  },
  {
    id: "pxu-002",
    workspaceId: "PXW-2026-00142",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    type: "document_signed",
    message: "Vendor's mortgage discharge registered",
    details: "Westpac Banking Corporation has lodged discharge of mortgage for Lot 12 DP 456789.",
  },
  {
    id: "pxu-003",
    workspaceId: "PXW-2026-00142",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    type: "financial_update",
    message: "Stamp duty payment verified by Revenue NSW",
    details: "Duty amount of $82,440.00 confirmed and marked as paid.",
  },
  {
    id: "pxu-004",
    workspaceId: "PXW-2026-00142",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    type: "document_signed",
    message: "Transfer document signed by all parties",
    details: "eSignature completed for Transfer T-2026-00142. All parties verified.",
  },
  {
    id: "pxu-005",
    workspaceId: "PXW-2026-00142",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    type: "financial_update",
    message: "Financial settlement summary approved",
    details: "Net settlement amount of $1,581,347.24 confirmed by all parties.",
  },
  {
    id: "pxu-006",
    workspaceId: "PXW-2026-00142",
    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    type: "financial_update",
    message: "Incoming funds verified — $850,000.00",
    details: "Commonwealth Bank loan advance confirmed and ready for settlement.",
  },
  {
    id: "pxu-007",
    workspaceId: "PXW-2026-00142",
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    type: "participant_update",
    message: "Commonwealth Bank accepted workspace invitation",
    details: "Incoming mortgagee now participating in workspace PXW-2026-00142.",
  },
  {
    id: "pxu-008",
    workspaceId: "PXW-2026-00142",
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    type: "status_change",
    message: "Workspace created for 42 Harbour View Drive, Manly",
    details: "PEXA workspace PXW-2026-00142 created by Legal Eagles Conveyancing.",
  },
  {
    id: "pxu-009",
    workspaceId: "PXW-2026-00287",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    type: "status_change",
    message: "Workspace created for 14 Bronte Road, Bondi Junction",
    details: "PEXA workspace PXW-2026-00287 created by Legal Eagles Conveyancing.",
  },
  {
    id: "pxu-010",
    workspaceId: "PXW-2026-00287",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    type: "participant_update",
    message: "Invitation sent to Meridian Legal (Vendor's Conveyancer)",
    details: "Awaiting acceptance from vendor's representative.",
  },
];

export function getWorkspace(workspaceId: string): PexaWorkspace | null {
  return MOCK_WORKSPACES[workspaceId] || null;
}

export function getSettlementFeed(workspaceId?: string): PexaSettlementUpdate[] {
  let feed = [...MOCK_SETTLEMENT_FEED];
  if (workspaceId) {
    feed = feed.filter((u) => u.workspaceId === workspaceId);
  }
  feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return feed;
}

export function isConfigured(): boolean {
  return true;
}
