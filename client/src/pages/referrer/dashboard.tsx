import React from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, DollarSign, Users, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { ProperlyLoader } from '@/components/properly-loader';
import type { Referral } from '@shared/schema';

export default function ReferrerDashboard() {
  const { user } = useAuth();
  
  const { data: referrals, isLoading } = useQuery<Referral[]>({
    queryKey: ["/api/referrals"],
  });

  const myReferrals = referrals?.filter(r => r.brokerId === user?.id) || [];
  
  const totalCommission = myReferrals.reduce((sum, r) => sum + r.commission, 0);

  if (isLoading) {
    return (
      <Layout role="BROKER">
        <ProperlyLoader size="lg" text="Loading referrals..." fullPage />
      </Layout>
    );
  }

  return (
    <Layout role="BROKER">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Track your referrals and commissions.</p>
          </div>
          <Link href="/referrer/create">
            <Button className="w-full md:w-auto gap-2">
              <Plus className="h-4 w-4" /> New Referral
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Commission</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalCommission}</div>
              <p className="text-xs text-muted-foreground">+20% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Referrals</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myReferrals.length}</div>
              <p className="text-xs text-muted-foreground">2 pending settlement</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">Top 10% of brokers</p>
            </CardContent>
          </Card>
        </div>

        {/* Referrals List */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold font-heading">Recent Referrals</h2>
             <div className="w-64">
               <div className="relative">
                 <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input placeholder="Search clients..." className="pl-8" />
               </div>
             </div>
           </div>

           <Card>
             <div className="rounded-md border">
               <table className="w-full text-sm">
                 <thead className="bg-muted/50 border-b">
                   <tr className="text-left text-muted-foreground">
                     <th className="p-4 font-medium">Client</th>
                     <th className="p-4 font-medium">Status</th>
                     <th className="p-4 font-medium">Commission</th>
                     <th className="p-4 font-medium text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody>
                   {myReferrals.length === 0 ? (
                     <tr>
                       <td colSpan={4} className="p-12 text-center" data-testid="empty-referrals">
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
                     myReferrals.map((referral) => (
                       <tr key={referral.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                         <td className="p-4 font-medium">{referral.clientName}</td>
                         <td className="p-4">
                           <Badge variant="secondary" className={
                             referral.status === 'Settled' ? 'bg-green-100 text-green-700' : 
                             referral.status === 'Converted' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                           }>
                             {referral.status}
                           </Badge>
                         </td>
                         <td className="p-4 text-muted-foreground">
                           {referral.commission > 0 ? `$${referral.commission}` : '-'}
                         </td>
                         <td className="p-4 text-right">
                           <Button variant="ghost" size="sm">View</Button>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
           </Card>
        </div>
      </div>
    </Layout>
  );
}
