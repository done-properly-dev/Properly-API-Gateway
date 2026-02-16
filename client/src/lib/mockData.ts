import { addDays, subDays } from 'date-fns';

export const mockUsers = [
  { id: 'u1', name: 'Sarah Jenkins', email: 'sarah@example.com', role: 'CLIENT', avatar: 'https://i.pravatar.cc/150?u=u1' },
  { id: 'u2', name: 'Mike The Broker', email: 'mike@broker.com.au', role: 'BROKER', avatar: 'https://i.pravatar.cc/150?u=u2' },
  { id: 'u3', name: 'Legal Eagles Conveyancing', email: 'admin@legaleagles.com.au', role: 'CONVEYANCER', avatar: 'https://i.pravatar.cc/150?u=u3' },
  { id: 'u4', name: 'Properly Admin', email: 'admin@properly.com.au', role: 'ADMIN', avatar: 'https://i.pravatar.cc/150?u=u4' },
];

export const mockMatters = [
  {
    id: 'm1',
    address: '42 Wallaby Way, Sydney',
    clientUserId: 'u1',
    status: 'In Progress',
    milestonePercent: 40,
    transactionType: 'Buying',
    settlementDate: addDays(new Date(), 25).toISOString(),
    lastActive: subDays(new Date(), 1).toISOString(),
  },
  {
    id: 'm2',
    address: '10 Bondi Road, Bondi Beach',
    clientUserId: 'u1',
    status: 'Settled',
    milestonePercent: 100,
    transactionType: 'Selling',
    settlementDate: subDays(new Date(), 10).toISOString(),
    lastActive: subDays(new Date(), 10).toISOString(),
  }
];

export const mockTasks = [
  { id: 't1', matterId: 'm1', title: 'Upload Contract', status: 'COMPLETE', dueDate: subDays(new Date(), 2).toISOString(), type: 'UPLOAD' },
  { id: 't2', matterId: 'm1', title: 'Verify Identity', status: 'PENDING', dueDate: addDays(new Date(), 1).toISOString(), type: 'ACTION' },
  { id: 't3', matterId: 'm1', title: 'Review Searches', status: 'LOCKED', dueDate: addDays(new Date(), 5).toISOString(), type: 'REVIEW' },
];

export const mockDocuments = [
  { id: 'd1', matterId: 'm1', name: 'Contract_of_Sale.pdf', size: '2.4 MB', uploadedAt: subDays(new Date(), 2).toISOString(), locked: true },
  { id: 'd2', matterId: 'm1', name: 'ID_Verification.jpg', size: '1.1 MB', uploadedAt: subDays(new Date(), 1).toISOString(), locked: false },
];

export const mockReferrals = [
  { id: 'r1', brokerId: 'u2', clientName: 'Sarah Jenkins', status: 'Converted', commission: 100 },
  { id: 'r2', brokerId: 'u2', clientName: 'John Doe', status: 'Pending', commission: 0 },
  { id: 'r3', brokerId: 'u2', clientName: 'Jane Smith', status: 'Settled', commission: 100 },
];

export const mockNotifications = [
  { id: 'n1', templateName: 'Welcome Email', channel: 'EMAIL', active: true },
  { id: 'n2', templateName: 'Milestone Update', channel: 'SMS', active: true },
];
