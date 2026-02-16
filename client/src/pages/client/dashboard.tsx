import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { OnboardingAlert } from '@/components/onboarding-alert';
import { PropertyMap } from '@/components/property-map';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, FileText, Upload, BookOpen, Home, ChevronRight, Mail, Phone, MapPin, Edit3, Check } from 'lucide-react';
import { Link } from 'wouter';
import type { Matter, Task, Document } from '@shared/schema';
import clivePhoto from '@/assets/images/clive-conway.jpg';

function ProgressDonut({ percent }: { percent: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="relative" data-testid="progress-donut">
      <svg width="160" height="160" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle cx="65" cy="65" r={r} fill="none" stroke="#425b58" strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 65 65)"
          className="transition-all duration-1000"
        />
        <text x="65" y="55" textAnchor="middle" className="fill-gray-400" style={{ fontSize: '11px', fontWeight: 500 }}>Overall progress</text>
        <text x="65" y="82" textAnchor="middle" className="fill-[#1a2e2b]" style={{ fontSize: '32px', fontWeight: 700 }}>{percent}%</text>
      </svg>
    </div>
  );
}

function VerticalTimeline({ matter }: { matter: Matter }) {
  const steps = [
    { key: 'pillarPreSettlement' as const, label: 'Sign contract' },
    { key: 'pillarExchange' as const, label: 'Conditional Contract' },
    { key: 'pillarConditions' as const, label: 'Unconditional exchange' },
    { key: 'pillarPreCompletion' as const, label: 'Pre-settlement' },
    { key: 'pillarSettlement' as const, label: 'Complete!' },
  ];

  return (
    <div className="space-y-0" data-testid="vertical-timeline">
      {steps.map((step, i) => {
        const status = matter[step.key] as string;
        const isComplete = status === 'complete';
        const isActive = status === 'in_progress';
        const isLast = i === steps.length - 1;

        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              {isComplete ? (
                <div className="h-7 w-7 rounded-full bg-[#e8946a] flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" strokeWidth={3} />
                </div>
              ) : isActive ? (
                <div className="h-7 w-7 rounded-full border-[3px] border-[#e8946a] bg-white flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-[#e8946a]" />
                </div>
              ) : (
                <div className="h-7 w-7 rounded-full border-2 border-gray-300 bg-white" />
              )}
              {!isLast && (
                <div className={`w-0.5 h-8 ${isComplete || isActive ? 'bg-[#e8946a]' : 'bg-gray-200'}`} />
              )}
            </div>
            <span className={`text-sm pt-1 ${
              isComplete ? 'text-foreground font-medium' :
              isActive ? 'text-[#e8946a] font-semibold' :
              'text-gray-400'
            }`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  if (status === 'COMPLETE') return <span className="flex items-center gap-1.5 text-sm"><span className="h-2 w-2 rounded-full bg-green-500"></span> Complete</span>;
  if (status === 'IN_REVIEW') return <span className="flex items-center gap-1.5 text-sm"><span className="h-2 w-2 rounded-full bg-orange-400"></span> In review</span>;
  return <span className="flex items-center gap-1.5 text-sm"><span className="h-2 w-2 rounded-full bg-gray-400"></span> To do</span>;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [alertDismissed, setAlertDismissed] = useState(false);

  const { data: matters, isLoading: mattersLoading } = useQuery<Matter[]>({
    queryKey: ["/api/matters"],
  });

  const matter = matters?.find(m => m.clientUserId === user?.id) || matters?.[0];

  const { data: myTasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/matters", matter?.id, "tasks"],
    enabled: !!matter?.id,
  });

  const { data: myDocuments } = useQuery<Document[]>({
    queryKey: ["/api/matters", matter?.id, "documents"],
    enabled: !!matter?.id,
  });

  if (mattersLoading) {
    return (
      <Layout role="CLIENT">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!matter) {
    return (
      <Layout role="CLIENT">
        <div className="space-y-6 px-4">
          {user && !alertDismissed && (
            <OnboardingAlert user={user} onDismiss={() => setAlertDismissed(true)} />
          )}
          <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6">
            <div className="bg-[#e7f6f3] p-8 rounded-full">
              <FileText className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold font-heading" data-testid="empty-state-heading">G'day, {user?.name?.split(' ')[0]}!</h2>
              <p className="text-muted-foreground max-w-md mx-auto text-lg">
                Your settlement journey starts here. Once your conveyancer sets things up,
                you'll see your progress, tasks, and key dates right on this dashboard.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="bg-primary hover:bg-primary/90 text-white px-6" data-testid="button-upload-contract">
                <Upload className="mr-2 h-4 w-4" /> Upload Contract
              </Button>
              <Link href="/client/playbook">
                <Button variant="outline" className="px-6" data-testid="button-browse-playbook">
                  <BookOpen className="mr-2 h-4 w-4" /> Browse The Playbook
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const tasks = myTasks || [];
  const documents = myDocuments || [];
  const completedPillars = [matter.pillarPreSettlement, matter.pillarExchange, matter.pillarConditions, matter.pillarPreCompletion, matter.pillarSettlement].filter(s => s === 'complete').length;
  const progressPercent = Math.round((completedPillars / 5) * 100);

  const contractDate = matter.createdAt ? new Date(matter.createdAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const settlementDate = matter.settlementDate ? new Date(matter.settlementDate).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const coolingOffDate = matter.coolingOffDate ? new Date(matter.coolingOffDate).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const financeDate = matter.financeDate ? new Date(matter.financeDate).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 }).format(amount / 100);
  };

  return (
    <Layout role="CLIENT">
      <div className="space-y-6">
        {user && !alertDismissed && (
          <OnboardingAlert user={user} hasDocuments={(myDocuments?.length ?? 0) > 0} onDismiss={() => setAlertDismissed(true)} />
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-3 w-3" />
          <span className="text-primary font-medium">Dashboard</span>
        </div>

        <h1 className="text-2xl font-heading font-bold text-foreground" data-testid="text-dashboard-title">
          Your Dashboard
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <Card className="bg-[#e7f6f3]/40 border border-[#c8e0db] p-5 rounded-xl" data-testid="matter-info-card">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-heading font-bold text-foreground" data-testid="text-property-address">
                  {user?.name || 'Client'}
                </h2>
                <Badge className="bg-[#e7f6f3] text-primary border-[#c8e0db] text-xs font-semibold" data-testid="badge-transaction-type">
                  {matter.transactionType === 'Purchase' ? 'Buyer' : 'Seller'}
                </Badge>
              </div>

              <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <span className="text-gray-500 font-medium">Matter number</span>
                <span className="text-foreground">{matter.id.slice(0, 6).toUpperCase()}</span>

                <span className="text-gray-500 font-medium">Contact person</span>
                <span className="text-foreground">{user?.name}</span>

                <span className="text-gray-500 font-medium">Email address</span>
                <span className="text-primary">{user?.email}</span>

                <span className="text-gray-500 font-medium">Matter address</span>
                <span className="text-foreground">{matter.address}</span>

                <span className="text-gray-500 font-medium">Contact phone number</span>
                <span className="text-foreground">{user?.phone || '0412 345 678'}</span>
              </div>

              <p className="text-xs text-gray-400 mt-4 italic">
                Please contact your conveyancer with any changes
              </p>
            </Card>

            {matter.address && (
              <div data-testid="property-map-section">
                <PropertyMap address={matter.address} />
              </div>
            )}

            <Card className="bg-white border rounded-xl overflow-hidden" data-testid="tasks-card">
              <div className="p-5 pb-0">
                <h3 className="text-lg font-heading font-bold text-foreground mb-4">Tasks</h3>
              </div>
              {tasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground px-5">
                  <p>No tasks yet. Check back soon!</p>
                </div>
              ) : (
                <div className="px-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Action</th>
                        <th className="text-left py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide w-28">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.slice(0, 4).map(task => (
                        <tr key={task.id} className="border-b border-gray-50 last:border-0" data-testid={`task-row-${task.id}`}>
                          <td className="py-3 text-foreground">{task.title}</td>
                          <td className="py-3"><StatusDot status={task.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="px-5 py-3 flex justify-end">
                <Link href="/client/tasks">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-full px-5 text-xs font-semibold" data-testid="button-see-all-tasks">
                    See all
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="bg-white border rounded-xl overflow-hidden" data-testid="document-vault-card">
              <div className="p-5 pb-0">
                <h3 className="text-lg font-heading font-bold text-foreground mb-4">Document Vault</h3>
              </div>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground px-5">
                  <p>No documents uploaded yet.</p>
                </div>
              ) : (
                <div className="px-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">File name</th>
                        <th className="text-left py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide w-32">Date uploaded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.slice(0, 4).map(doc => (
                        <tr key={doc.id} className="border-b border-gray-50 last:border-0" data-testid={`doc-row-${doc.id}`}>
                          <td className="py-3 flex items-center gap-2 text-foreground">
                            <FileText className="h-4 w-4 text-red-400 shrink-0" />
                            {doc.name}
                          </td>
                          <td className="py-3 text-gray-500">
                            {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="px-5 py-3 flex justify-end">
                <Link href="/client/documents">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-full px-5 text-xs font-semibold" data-testid="button-see-all-docs">
                    See all
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-white border rounded-xl p-5" data-testid="progress-card">
              <div className="flex items-start gap-4">
                <VerticalTimeline matter={matter} />
                <div className="flex-1 flex justify-center">
                  <ProgressDonut percent={progressPercent} />
                </div>
              </div>
            </Card>

            <Card className="bg-[#ffece1]/40 border border-[#f5d6c5] rounded-xl p-5" data-testid="conveyancer-card">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">File owner</p>
              <div className="flex items-center gap-4">
                <img
                  src={clivePhoto}
                  alt="Clive Conway"
                  className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm"
                  data-testid="img-conveyancer-photo"
                />
                <div>
                  <p className="font-bold text-foreground text-base">Clive Conway</p>
                  <p className="text-sm text-gray-500">Example Conveyancers</p>
                  <a href="mailto:clive@exampleconveyancers.com" className="text-sm text-primary hover:underline">
                    clive@exampleconveyancers.com
                  </a>
                </div>
              </div>
            </Card>

            <Card className="bg-white border rounded-xl overflow-hidden" data-testid="key-dates-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#e7f6f3]/60 border-b border-[#c8e0db]">
                    <th className="text-left px-5 py-3 font-bold text-foreground text-xs tracking-wide">Key dates</th>
                    <th className="text-left px-3 py-3 font-bold text-foreground text-xs tracking-wide">Date due</th>
                    <th className="text-right px-5 py-3 font-bold text-foreground text-xs tracking-wide">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-5 py-4 text-foreground font-semibold">Contract date</td>
                    <td className="px-3 py-4 text-gray-600">{contractDate}</td>
                    <td className="px-5 py-4 text-right text-gray-400">-</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-[#ffece1]/20">
                    <td className="px-5 py-4 text-foreground font-semibold">Initial deposit due</td>
                    <td className="px-3 py-4 text-gray-600">{coolingOffDate !== '-' ? coolingOffDate : contractDate}</td>
                    <td className="px-5 py-4 text-right text-foreground font-semibold">{formatCurrency(matter.contractPrice)}</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-[#e7f6f3]/20">
                    <td className="px-5 py-4 text-foreground font-semibold">Balance deposit due</td>
                    <td className="px-3 py-4 text-gray-600">{financeDate !== '-' ? financeDate : '-'}</td>
                    <td className="px-5 py-4 text-right text-foreground font-semibold">{formatCurrency(matter.depositAmount)}</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 text-foreground font-semibold">Settlement date</td>
                    <td className="px-3 py-4 text-gray-600" data-testid="text-settlement-date">{settlementDate}</td>
                    <td className="px-5 py-4 text-right text-gray-400">-</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      </div>

      <button className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#e7f6f3] text-primary shadow-lg hover:bg-[#d5ece7] flex items-center justify-center z-40 md:bottom-8 md:right-8 border border-[#c8e0db]" data-testid="fab-edit">
        <Edit3 className="h-5 w-5" />
      </button>
    </Layout>
  );
}
