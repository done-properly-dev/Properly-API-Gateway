import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Layout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Filter, AlertCircle, Upload, FileText, ChevronLeft, ChevronRight, X, RefreshCw } from 'lucide-react';
import { ProperlyLoader } from '@/components/properly-loader';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import type { Matter } from '@shared/schema';
import { PexaFeed } from '@/components/pexa-feed';

type TabKey = 'profile' | 'tasks' | 'documents';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'profile', label: 'Client profile' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'documents', label: 'Document vault' },
];

function StatusDot({ status }: { status: string }) {
  if (status === 'Settled' || status === 'COMPLETE') return <span className="flex items-center gap-1.5 text-sm"><span className="h-2 w-2 rounded-full bg-green-500"></span> Acknowledged</span>;
  if (status === 'IN_REVIEW') return <span className="flex items-center gap-1.5 text-sm"><span className="h-2 w-2 rounded-full bg-[#e8946a]"></span> Important Info</span>;
  if (status === 'OVERDUE') return <span className="flex items-center gap-1.5 text-sm"><span className="h-2 w-2 rounded-full bg-red-500"></span> Overdue</span>;
  if (status === 'In Progress') return <span className="flex items-center gap-1.5 text-sm"><span className="h-2 w-2 rounded-full bg-[#e8946a]"></span> To do</span>;
  return <span className="flex items-center gap-1.5 text-sm"><span className="h-2 w-2 rounded-full bg-[#e8946a]"></span> To do</span>;
}

function getStatusForDisplay(status: string) {
  if (status === 'Settled' || status === 'COMPLETE') return 'Acknowledged';
  if (status === 'IN_REVIEW') return 'Important Info';
  if (status === 'OVERDUE') return 'Overdue';
  return 'To do';
}

const ITEMS_PER_PAGE = 10;

const placeholderDocuments = [
  { name: 'Contract_of_sale.pdf', size: '2.4 MB' },
  { name: 'Pest_inspection_report.pdf', size: '1.1 MB' },
];

export default function ConveyancerDashboard() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('tasks');
  const [selectedMatterIndex, setSelectedMatterIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [conveyancerNotes, setConveyancerNotes] = useState('Please arrange the pest inspection before the cooling off period ends. Contact the recommended inspector.');

  const { data: matters, isLoading } = useQuery<Matter[]>({
    queryKey: ["/api/matters"],
  });

  const syncFromSmokeball = useMutation({
    mutationFn: async (smokeballMatterId: string) => {
      const res = await apiRequest("POST", `/api/smokeball/sync/${smokeballMatterId}`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/matters"] });
      toast({ title: "Sync complete", description: `Matter synced: ${data.matter?.address || 'Unknown'}` });
    },
    onError: (error: Error) => {
      toast({ title: "Sync failed", description: error.message, variant: "destructive" });
    },
  });

  const updateMatter = useMutation({
    mutationFn: async ({ id, status, milestonePercent }: { id: string; status: string; milestonePercent: number }) => {
      await apiRequest("PATCH", `/api/matters/${id}`, { status, milestonePercent });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matters"] });
    },
  });

  const allMatters = matters || [];

  const filteredMatters = allMatters.filter(m =>
    m.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredMatters.length / ITEMS_PER_PAGE));
  const paginatedMatters = filteredMatters.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const selectedMatter = selectedMatterIndex !== null ? filteredMatters[selectedMatterIndex] : null;

  const handleMarkComplete = () => {
    if (selectedMatter) {
      updateMatter.mutate({ id: selectedMatter.id, status: 'Settled', milestonePercent: 100 });
    }
  };

  if (isLoading) {
    return (
      <Layout role="CONVEYANCER">
        <ProperlyLoader size="lg" text="Loading matters..." fullPage />
      </Layout>
    );
  }

  return (
    <Layout role="CONVEYANCER">
      <div className="space-y-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-heading font-bold text-foreground" data-testid="text-client-name">
                Mrs Olivia and Mr James Rhye
              </h1>
              <Badge className="bg-[#e7f6f3] text-[#415b58] border-0 font-medium text-xs" data-testid="badge-buyer">
                Buyer
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-case-number">Case number: 000001</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              disabled={!selectedMatter?.smokeballMatterId || syncFromSmokeball.isPending}
              onClick={() => {
                if (selectedMatter?.smokeballMatterId) {
                  syncFromSmokeball.mutate(selectedMatter.smokeballMatterId);
                }
              }}
              data-testid="button-sync-smokeball"
            >
              {syncFromSmokeball.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync from Smokeball
            </Button>
            <Button
              className="bg-[#415b58] hover:bg-[#344a47] text-white gap-2"
              data-testid="button-upload-document"
            >
              <Upload className="h-4 w-4" />
              Upload document
            </Button>
          </div>
        </div>

        <div className="border-b border-[#d5d7da] mb-6">
          <nav className="flex gap-0" data-testid="tab-navigation">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-[#415b58] border-b-2 border-[#415b58]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`tab-${tab.key}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'tasks' && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className={`flex-1 min-w-0 ${selectedMatter ? 'lg:max-w-[calc(100%-380px)]' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-heading font-semibold" data-testid="text-tasks-title">Tasks</h2>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="pl-8 pr-12"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    data-testid="input-search-tasks"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">⌘K</span>
                </div>
                <Button variant="outline" size="sm" className="gap-2" data-testid="button-filters">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>

              <Card className="border border-[#d5d7da] shadow-none">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[#d5d7da]">
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMatters.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12" data-testid="empty-matters">
                          <div className="space-y-4">
                            <div className="bg-[#e7f6f3] h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                              <AlertCircle className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-heading font-bold text-lg">No Active Matters</h3>
                              <p className="text-muted-foreground max-w-md mx-auto mt-1">
                                {searchTerm
                                  ? `No matters match "${searchTerm}". Give it another go with a different search.`
                                  : "No worries — your matters will appear here once they're synced from Smokeball or created manually."
                                }
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedMatters.map((matter, idx) => {
                        const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx;
                        const isSelected = selectedMatterIndex === globalIdx;
                        return (
                          <TableRow
                            key={matter.id}
                            className={`border-b border-[#d5d7da] cursor-pointer transition-colors hover:bg-muted/50 ${isSelected ? 'bg-muted/60' : ''}`}
                            onClick={() => setSelectedMatterIndex(isSelected ? null : globalIdx)}
                            data-testid={`row-task-${matter.id}`}
                          >
                            <TableCell className="font-medium text-sm py-3.5">{matter.address}</TableCell>
                            <TableCell className="py-3.5">
                              <StatusDot status={matter.status} />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground py-3.5">
                              {matter.settlementDate ? format(new Date(matter.settlementDate), 'dd/MM/yyyy') : '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                {filteredMatters.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-[#d5d7da]" data-testid="pagination">
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(page => (
                        <Button
                          key={page}
                          variant={page === currentPage ? 'default' : 'outline'}
                          size="icon"
                          className={`h-8 w-8 text-xs ${page === currentPage ? 'bg-[#415b58] text-white' : ''}`}
                          onClick={() => setCurrentPage(page)}
                          data-testid={`button-page-${page}`}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        data-testid="button-next-page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {selectedMatter && (
              <div className="w-full lg:w-[360px] shrink-0" data-testid="task-detail-panel">
                <Card className="border border-[#d5d7da] shadow-none rounded-xl p-5 sticky top-4">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-base font-heading font-semibold" data-testid="text-task-title">
                      {selectedMatter.address}
                    </h3>
                    <button
                      onClick={() => setSelectedMatterIndex(null)}
                      className="text-muted-foreground hover:text-foreground p-1"
                      data-testid="button-close-detail"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Status</label>
                      <StatusDot status={selectedMatter.status} />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Due date</label>
                      <Input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        defaultValue={selectedMatter.settlementDate ? format(new Date(selectedMatter.settlementDate), 'dd/MM/yyyy') : ''}
                        className="text-sm"
                        data-testid="input-due-date"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Conveyancer notes</label>
                      <textarea
                        className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                        value={conveyancerNotes}
                        onChange={(e) => setConveyancerNotes(e.target.value)}
                        data-testid="textarea-notes"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">Supporting documents</label>
                      <div className="space-y-2">
                        {placeholderDocuments.map((doc, i) => (
                          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-[#d5d7da] bg-muted/30" data-testid={`doc-card-${i}`}>
                            <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                              <FileText className="h-4 w-4 text-red-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{doc.size}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 text-sm"
                        data-testid="button-send-reminder"
                      >
                        Send reminder
                      </Button>
                      <Button
                        className="flex-1 bg-[#e8946a] hover:bg-[#d4825c] text-white text-sm"
                        onClick={handleMarkComplete}
                        data-testid="button-mark-complete"
                      >
                        Mark Complete
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="mt-6">
            <PexaFeed />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="text-center py-16 text-muted-foreground" data-testid="tab-content-profile">
            <p className="text-lg">Client profile content coming soon.</p>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="text-center py-16 text-muted-foreground" data-testid="tab-content-documents">
            <p className="text-lg">Document vault content coming soon.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
