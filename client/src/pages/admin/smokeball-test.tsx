import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Layout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProperlyLoader } from '@/components/properly-loader';
import { RefreshCw, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SmokeballMatter {
  id: string;
  matterNumber: string;
  matterType: string;
  status: string;
  clientName: string;
  clientEmail: string;
  propertyAddress: string;
  stage: string;
}

export default function SmokeballTestPage() {
  const { toast } = useToast();
  const [syncResults, setSyncResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const { data: matters, isLoading } = useQuery<SmokeballMatter[]>({
    queryKey: ["/api/smokeball/matters"],
  });

  const syncMutation = useMutation({
    mutationFn: async (smokeballMatterId: string) => {
      const res = await apiRequest("POST", `/api/smokeball/sync/${smokeballMatterId}`);
      return res.json();
    },
    onSuccess: (data, smokeballMatterId) => {
      setSyncResults(prev => ({
        ...prev,
        [smokeballMatterId]: { success: true, message: `Synced to matter ${data.matter?.id}` },
      }));
      toast({ title: "Sync successful", description: `Matter synced: ${data.matter?.address}` });
    },
    onError: (error: Error, smokeballMatterId) => {
      setSyncResults(prev => ({
        ...prev,
        [smokeballMatterId]: { success: false, message: error.message },
      }));
      toast({ title: "Sync failed", description: error.message, variant: "destructive" });
    },
  });

  const triggerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/smokeball/test/trigger");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Test event triggered", description: `Event: ${data.event}` });
    },
    onError: (error: Error) => {
      toast({ title: "Trigger failed", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Layout role="ADMIN">
        <ProperlyLoader size="lg" text="Loading Smokeball matters..." fullPage />
      </Layout>
    );
  }

  return (
    <Layout role="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold" data-testid="text-smokeball-title">
              Smokeball Integration Test
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Test syncing mock Smokeball matters into the local database.
            </p>
          </div>
          <Button
            onClick={() => triggerMutation.mutate()}
            disabled={triggerMutation.isPending}
            className="bg-[#e8946a] hover:bg-[#d4825c] text-white gap-2"
            data-testid="button-trigger-test"
          >
            {triggerMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Trigger Test Event
          </Button>
        </div>

        <div className="grid gap-4">
          {(matters || []).map((matter) => {
            const result = syncResults[matter.id];
            return (
              <Card key={matter.id} className="p-5 border border-[#d5d7da] shadow-none" data-testid={`card-smokeball-${matter.id}`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-semibold text-base" data-testid={`text-address-${matter.id}`}>
                        {matter.propertyAddress}
                      </h3>
                      <Badge variant="outline" className="text-xs" data-testid={`badge-type-${matter.id}`}>
                        {matter.matterType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span data-testid={`text-matter-number-${matter.id}`}>{matter.matterNumber}</span>
                      <span>{matter.clientName}</span>
                      <Badge
                        className={
                          matter.stage === 'Settled'
                            ? 'bg-green-100 text-green-700 border-0'
                            : matter.stage === 'Pre-Completion'
                            ? 'bg-blue-100 text-blue-700 border-0'
                            : 'bg-amber-100 text-amber-700 border-0'
                        }
                        data-testid={`badge-stage-${matter.id}`}
                      >
                        {matter.stage}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {result && (
                      <div className="flex items-center gap-1.5 text-sm" data-testid={`sync-result-${matter.id}`}>
                        {result.success ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-700">{result.message}</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="text-red-600">{result.message}</span>
                          </>
                        )}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => syncMutation.mutate(matter.id)}
                      disabled={syncMutation.isPending && syncMutation.variables === matter.id}
                      data-testid={`button-sync-${matter.id}`}
                    >
                      {syncMutation.isPending && syncMutation.variables === matter.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      Sync
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          {(!matters || matters.length === 0) && (
            <div className="text-center py-12 text-muted-foreground" data-testid="empty-smokeball">
              <p>No mock Smokeball matters available.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
