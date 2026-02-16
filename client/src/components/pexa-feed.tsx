import { useQuery } from '@tanstack/react-query';
import { RefreshCw, FileCheck, DollarSign, Users, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PexaSettlementUpdate {
  id: string;
  workspaceId: string;
  timestamp: string;
  type: string;
  message: string;
  details?: string;
}

function TypeIcon({ type }: { type: string }) {
  const iconClass = "h-4 w-4";
  switch (type) {
    case "status_change":
      return <Activity className={`${iconClass} text-blue-500`} />;
    case "document_signed":
      return <FileCheck className={`${iconClass} text-green-600`} />;
    case "financial_update":
      return <DollarSign className={`${iconClass} text-amber-500`} />;
    case "participant_update":
      return <Users className={`${iconClass} text-purple-500`} />;
    default:
      return <RefreshCw className={`${iconClass} text-gray-400`} />;
  }
}

function typeBgColor(type: string): string {
  switch (type) {
    case "status_change": return "bg-blue-50";
    case "document_signed": return "bg-green-50";
    case "financial_update": return "bg-amber-50";
    case "participant_update": return "bg-purple-50";
    default: return "bg-gray-50";
  }
}

export function PexaFeed({ workspaceId }: { workspaceId?: string }) {
  const queryUrl = workspaceId ? `/api/pexa/feed?workspaceId=${workspaceId}` : '/api/pexa/feed';

  const { data: updates, isLoading } = useQuery<PexaSettlementUpdate[]>({
    queryKey: [queryUrl],
    refetchInterval: 30000,
  });

  return (
    <div className="bg-white border border-[#d5d7da] rounded-[8px] shadow-xs" data-testid="pexa-feed-panel">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e9eaeb]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold font-heading" data-testid="pexa-feed-title">PEXA Settlement Feed</h3>
          <span className="relative flex h-2.5 w-2.5" data-testid="pexa-live-indicator">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
        </div>
        <span className="text-xs text-muted-foreground">Live</span>
      </div>

      <div className="max-h-[300px] overflow-y-auto" data-testid="pexa-feed-list">
        {isLoading ? (
          <div className="flex items-center justify-center py-8" data-testid="pexa-feed-loading">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !updates || updates.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground" data-testid="pexa-feed-empty">
            No settlement updates yet
          </div>
        ) : (
          <ul className="divide-y divide-[#e9eaeb]">
            {updates.map((update) => (
              <li
                key={update.id}
                className="px-5 py-3 hover:bg-gray-50/50 transition-colors"
                data-testid={`pexa-update-${update.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${typeBgColor(update.type)}`}>
                    <TypeIcon type={update.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground" data-testid={`pexa-message-${update.id}`}>
                      {update.message}
                    </p>
                    {update.details && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2" data-testid={`pexa-details-${update.id}`}>
                        {update.details}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1" data-testid={`pexa-time-${update.id}`}>
                      {formatDistanceToNow(new Date(update.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
