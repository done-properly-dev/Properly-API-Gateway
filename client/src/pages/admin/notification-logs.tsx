import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { NotificationLog } from '@shared/schema';

const statusBadgeClass: Record<string, string> = {
  sent: 'bg-green-100 text-green-700 border-green-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
};

export default function NotificationLogsPage() {
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: logs, isLoading } = useQuery<NotificationLog[]>({
    queryKey: ['/api/notification-logs'],
  });

  const filtered = (logs || []).filter((log) => {
    if (channelFilter !== 'all' && log.channel !== channelFilter) return false;
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    return true;
  });

  return (
    <Layout role="ADMIN">
      <div className="space-y-6" data-testid="notification-logs-page">
        <div>
          <h1 className="text-2xl font-bold text-[#181d27] font-['Inter',sans-serif]" data-testid="text-page-title">Notification Log</h1>
          <p className="text-sm text-[#717680] font-['Inter',sans-serif]">View history of all sent notifications.</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-filter-channel">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="EMAIL">EMAIL</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
              <SelectItem value="PUSH">PUSH</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-white border-[#d5d7da] rounded-[8px]">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-[#717680] font-['Inter',sans-serif]" data-testid="text-loading">Loading...</div>
            ) : !filtered.length ? (
              <div className="p-8 text-center text-[#717680] font-['Inter',sans-serif]" data-testid="text-empty-state">No notifications sent yet</div>
            ) : (
              <>
                <div className="hidden md:grid grid-cols-[160px_1fr_100px_1fr_100px_120px] gap-2 px-5 py-3 border-b border-[#e9eaeb] text-xs font-semibold text-[#717680] uppercase tracking-wide font-['Inter',sans-serif]">
                  <span>Date</span>
                  <span>Recipient</span>
                  <span>Channel</span>
                  <span>Subject</span>
                  <span>Status</span>
                  <span>Matter</span>
                </div>
                <div className="divide-y divide-[#e9eaeb]">
                  {filtered.map((log) => (
                    <div key={log.id} data-testid={`row-log-${log.id}`}>
                      <div
                        className="grid grid-cols-1 md:grid-cols-[160px_1fr_100px_1fr_100px_120px] gap-2 px-5 py-3 hover:bg-[#fafafa] cursor-pointer items-center transition-colors"
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      >
                        <span className="text-sm text-[#414651] font-['Inter',sans-serif]" data-testid={`text-log-date-${log.id}`}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                        <span className="text-sm text-[#414651] font-['Inter',sans-serif] truncate" data-testid={`text-log-recipient-${log.id}`}>
                          {log.recipientUserId || '—'}
                        </span>
                        <span>
                          <Badge className={`${statusBadgeClass[log.channel] || 'bg-gray-100 text-gray-700 border-gray-200'} text-xs font-medium border`} data-testid={`badge-log-channel-${log.id}`}>
                            {log.channel}
                          </Badge>
                        </span>
                        <span className="text-sm text-[#414651] font-['Inter',sans-serif] truncate" data-testid={`text-log-subject-${log.id}`}>
                          {log.subject || '—'}
                        </span>
                        <span>
                          <Badge className={`${statusBadgeClass[log.status] || ''} text-xs font-medium border`} data-testid={`badge-log-status-${log.id}`}>
                            {log.status}
                          </Badge>
                        </span>
                        <span className="text-sm text-[#717680] font-['Inter',sans-serif] truncate flex items-center gap-1" data-testid={`text-log-matter-${log.id}`}>
                          {log.matterId ? log.matterId.slice(0, 8) + '...' : '—'}
                          {expandedId === log.id ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                        </span>
                      </div>
                      {expandedId === log.id && (
                        <div className="px-5 pb-4 bg-[#fafafa] border-t border-[#e9eaeb]" data-testid={`expanded-log-${log.id}`}>
                          <div className="pt-3 space-y-2">
                            <p className="text-xs font-semibold text-[#717680] uppercase font-['Inter',sans-serif]">Body</p>
                            <div className="text-sm text-[#414651] bg-white rounded-md p-3 border border-[#e9eaeb] whitespace-pre-wrap font-['Inter',sans-serif]" data-testid={`text-log-body-${log.id}`}>
                              {log.body}
                            </div>
                            {log.error && (
                              <div className="mt-2">
                                <p className="text-xs font-semibold text-red-600 uppercase font-['Inter',sans-serif]">Error</p>
                                <p className="text-sm text-red-600 font-['Inter',sans-serif]" data-testid={`text-log-error-${log.id}`}>{log.error}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
