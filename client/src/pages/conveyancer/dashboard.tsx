import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Filter, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
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

export default function ConveyancerDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [simulating, setSimulating] = useState<string | null>(null);

  const { data: matters, isLoading } = useQuery<Matter[]>({
    queryKey: ["/api/matters"],
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

  const handleSimulatePEXA = (id: string) => {
    setSimulating(id);
    updateMatter.mutate(
      { id, status: 'Settled', milestonePercent: 100 },
      {
        onSettled: () => {
          setSimulating(null);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Layout role="CONVEYANCER">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="CONVEYANCER">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Master View</h1>
            <p className="text-muted-foreground">Manage all active matters and settlements.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" /> Sync Smokeball
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" /> Sync PEXA
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search address, client, or ID..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Matters Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matter ID</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Settlement</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12" data-testid="empty-matters">
                    <div className="space-y-4">
                      <div className="bg-[#e7f6f3] h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-lg">No Active Matters</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mt-1">
                          {searchTerm 
                            ? `No matters match "${searchTerm}". Try a different search term.`
                            : "Your matters will appear here once they're synced from Smokeball or created manually."
                          }
                        </p>
                      </div>
                      {!searchTerm && (
                        <Button variant="outline" className="gap-2">
                          <RefreshCw className="h-4 w-4" /> Sync from Smokeball
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMatters.map((matter) => (
                  <TableRow key={matter.id}>
                    <TableCell className="font-mono text-xs">{matter.id.substring(0, 8)}</TableCell>
                    <TableCell className="font-medium">{matter.address}</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        matter.status === 'Settled' ? 'bg-green-50 text-green-700 border-green-200' :
                        matter.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        'bg-slate-50 text-slate-700'
                      }>
                        {matter.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{matter.settlementDate ? format(new Date(matter.settlementDate), 'dd MMM yyyy') : 'TBD'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${matter.milestonePercent}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{matter.milestonePercent}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {matter.status !== 'Settled' ? (
                         <Button 
                           size="sm" 
                           variant="ghost" 
                           className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                           disabled={simulating === matter.id}
                           onClick={() => handleSimulatePEXA(matter.id)}
                         >
                           {simulating === matter.id ? (
                             <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                           ) : (
                             <AlertCircle className="h-3 w-3 mr-1" />
                           )}
                           Simulate PEXA
                         </Button>
                      ) : (
                        <span className="flex items-center justify-end text-xs text-green-600 font-medium">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </Layout>
  );
}
