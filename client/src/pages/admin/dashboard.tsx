import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { SovereigntyWidget } from '@/components/sovereignty-widget';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { Notification } from '@shared/schema';

export default function AdminDashboard() {
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  return (
    <Layout role="ADMIN">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System status and configuration.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
             <h2 className="text-xl font-bold">Data Sovereignty</h2>
             <SovereigntyWidget />
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold">System Controls</h2>
            <Card>
              <CardHeader>
                <CardTitle>Notification Rules</CardTitle>
                <CardDescription>Manage delivery windows and quiet hours.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="quiet-mode">Enforce Quiet Hours</Label>
                    <p className="text-xs text-muted-foreground">No SMS sent between 9pm - 8am local time.</p>
                  </div>
                  <Switch id="quiet-mode" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
