import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Plus, Search, DollarSign, Users, TrendingUp, SlidersHorizontal, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link, useLocation } from 'wouter';
import { ProperlyLoader } from '@/components/properly-loader';
import { Checkbox } from '@/components/ui/checkbox';
import type { Referral } from '@shared/schema';

const TIME_FILTERS = ['12 months', '30 days', '7 days', '24 hours'] as const;
const ITEMS_PER_PAGE = 10;

function SimpleLineChart() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const values = [20, 35, 25, 45, 30, 55, 40, 60, 50, 70, 55, 80];
  const maxVal = Math.max(...values);
  const w = 700;
  const h = 220;
  const padX = 40;
  const padY = 20;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  const points = values.map((v, i) => ({
    x: padX + (i / (values.length - 1)) * chartW,
    y: padY + chartH - (v / maxVal) * chartH,
  }));

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (p.x - prev.x) / 3;
    const cpx2 = p.x - (p.x - prev.x) / 3;
    return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${w} ${h + 30}`} className="w-full h-auto" data-testid="referral-chart">
      {gridLines.map((ratio) => {
        const y = padY + chartH - ratio * chartH;
        return (
          <g key={ratio}>
            <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="#e9eaeb" strokeWidth="1" />
            <text x={padX - 8} y={y + 4} textAnchor="end" fill="#667085" fontSize="11">
              {Math.round(ratio * maxVal)}
            </text>
          </g>
        );
      })}
      <path d={pathD} fill="none" stroke="#00c2a2" strokeWidth="2.5" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#00c2a2" />
          <text x={p.x} y={h + 16} textAnchor="middle" fill="#667085" fontSize="11">
            {months[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    Settled: '#17b26a',
    Converted: '#2e90fa',
    Pending: '#667085',
  };
  const bgMap: Record<string, string> = {
    Settled: 'bg-green-50',
    Converted: 'bg-blue-50',
    Pending: 'bg-gray-50',
  };
  const textMap: Record<string, string> = {
    Settled: 'text-green-700',
    Converted: 'text-blue-700',
    Pending: 'text-gray-600',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bgMap[status] || 'bg-gray-50'} ${textMap[status] || 'text-gray-600'}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorMap[status] || '#667085' }} />
      {status}
    </span>
  );
}

export default function ReferrerDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<'referrals' | 'payments'>('referrals');
  const [activeFilter, setActiveFilter] = useState<string>('12 months');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: referrals, isLoading } = useQuery<Referral[]>({
    queryKey: ["/api/referrals"],
  });

  useEffect(() => {
    if (activeTab === 'payments') {
      navigate('/referrer/payments');
    }
  }, [activeTab, navigate]);

  const myReferrals = referrals?.filter(r => r.brokerId === user?.id) || [];
  const totalCommission = myReferrals.reduce((sum, r) => sum + r.commission, 0);

  const filteredReferrals = myReferrals.filter(r =>
    r.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredReferrals.length / ITEMS_PER_PAGE));
  const paginatedReferrals = filteredReferrals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const allSelected = paginatedReferrals.length > 0 && paginatedReferrals.every(r => selectedIds.has(r.id));

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedReferrals.map(r => r.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getPageNumbers() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, '...', totalPages - 2, totalPages - 1, totalPages];
    if (currentPage >= totalPages - 2) return [1, 2, 3, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  }

  if (isLoading) {
    return (
      <Layout role="BROKER">
        <ProperlyLoader size="lg" text="Loading referrals..." fullPage />
      </Layout>
    );
  }

  return (
    <Layout role="BROKER">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground" data-testid="dashboard-title">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Track and manage your client referrals.</p>
          </div>
          <Link href="/referrer/create">
            <Button className="w-full md:w-auto gap-2" data-testid="button-new-referral">
              <Plus className="h-4 w-4" /> Make a referral
            </Button>
          </Link>
        </div>

        <div className="inline-flex rounded-lg bg-[#fafafa] border border-[#e9eaeb] p-1" data-testid="tab-navigation">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'referrals' ? 'bg-white shadow-sm border border-[#e9eaeb] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('referrals')}
            data-testid="tab-referrals"
          >
            Referrals
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'payments' ? 'bg-white shadow-sm border border-[#e9eaeb] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('payments')}
            data-testid="tab-payments"
          >
            Payment details
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-[#d5d7da] rounded-[8px] p-5 bg-white" data-testid="stat-total-income">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#e7f6f3] flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-6 w-6 text-[#00c2a2]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total income</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">${totalCommission.toLocaleString()}</span>
                  <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" /> +20%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="border border-[#d5d7da] rounded-[8px] p-5 bg-white" data-testid="stat-total-referrals">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#e7f6f3] flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-[#00c2a2]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total referrals</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{myReferrals.length}</span>
                  <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" /> +15%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-[#d5d7da] rounded-[8px] bg-white" data-testid="chart-section">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 pb-0 gap-3">
            <div className="inline-flex rounded-lg bg-[#fafafa] border border-[#e9eaeb] p-1">
              {TIME_FILTERS.map((filter) => (
                <button
                  key={filter}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeFilter === filter ? 'bg-white shadow-sm border border-[#e9eaeb] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setActiveFilter(filter)}
                  data-testid={`filter-${filter.replace(' ', '-')}`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" data-testid="button-filters">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            </Button>
          </div>
          <div className="p-5 pt-3">
            <SimpleLineChart />
          </div>
        </div>

        <div className="border border-[#d5d7da] rounded-[8px] bg-white" data-testid="referrals-table-section">
          <div className="flex items-center justify-between p-4 border-b border-[#e9eaeb]">
            <h2 className="text-base font-semibold font-heading">Referrals</h2>
            <div className="w-64">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  className="pl-8 h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-[#e9eaeb]">
                <th className="p-4 w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} data-testid="checkbox-all" />
                </th>
                <th className="p-4 font-medium text-[#535862]">Client name</th>
                <th className="p-4 font-medium text-[#535862]">Status</th>
                <th className="p-4 font-medium text-[#535862]">Commission</th>
                <th className="p-4 font-medium text-[#535862] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myReferrals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center" data-testid="empty-referrals">
                    <div className="space-y-4">
                      <div className="bg-[#e7f6f3] h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-lg">No Referrals Yet</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                          Send your first referral and start tracking your clients' settlement progress in real time. Easy as.
                        </p>
                      </div>
                      <Link href="/referrer/create">
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" /> Create Your First Referral
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReferrals.map((referral) => (
                  <tr key={referral.id} className="border-b border-[#e9eaeb] last:border-0 hover:bg-gray-50/50 transition-colors" data-testid={`row-referral-${referral.id}`}>
                    <td className="p-4">
                      <Checkbox
                        checked={selectedIds.has(referral.id)}
                        onCheckedChange={() => toggleOne(referral.id)}
                        data-testid={`checkbox-referral-${referral.id}`}
                      />
                    </td>
                    <td className="p-4 font-medium">{referral.clientName}</td>
                    <td className="p-4">
                      <StatusDot status={referral.status} />
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {referral.commission > 0 ? `$${referral.commission.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-actions-${referral.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredReferrals.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between p-4 border-t border-[#e9eaeb]" data-testid="pagination">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                data-testid="button-previous"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, i) =>
                  page === '...' ? (
                    <span key={`dots-${i}`} className="px-2 text-muted-foreground text-sm">...</span>
                  ) : (
                    <button
                      key={page}
                      className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${currentPage === page ? 'bg-primary text-white' : 'hover:bg-gray-100 text-muted-foreground'}`}
                      onClick={() => setCurrentPage(page as number)}
                      data-testid={`button-page-${page}`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                data-testid="button-next"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
