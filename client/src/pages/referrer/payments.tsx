import React from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Clock, Receipt, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { ProperlyLoader } from '@/components/properly-loader';
import type { Payment, Referral } from '@shared/schema';

function formatAUD(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'processing':
      return 'bg-blue-100 text-blue-700';
    case 'settled':
      return 'bg-green-100 text-green-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function BrokerPayments() {
  const { user } = useAuth();

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ["/api/referrals"],
  });

  const isLoading = paymentsLoading || referralsLoading;

  const myPayments = payments?.filter(p => p.brokerId === user?.id) || [];
  const sortedPayments = [...myPayments].sort(
    (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
  );

  const referralMap = new Map(referrals?.map(r => [r.id, r]) || []);

  const totalEarned = myPayments
    .filter(p => p.status === 'settled')
    .reduce((sum, p) => sum + p.netAmount, 0);

  const pendingCount = myPayments.filter(p => p.status === 'pending').length;

  const totalFees = myPayments.reduce((sum, p) => sum + p.properlyFee, 0);

  if (isLoading) {
    return (
      <Layout role="BROKER">
        <ProperlyLoader size="lg" text="Loading payments..." fullPage />
      </Layout>
    );
  }

  return (
    <Layout role="BROKER">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground" data-testid="text-page-title">
            Payments & Commissions
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-subtitle">
            Track your earnings from settled referrals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="summary-cards">
          <Card data-testid="card-total-earned">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-earned">
                {formatAUD(totalEarned)}
              </div>
              <p className="text-xs text-muted-foreground">From settled payments</p>
            </CardContent>
          </Card>
          <Card data-testid="card-pending">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-count">
                {pendingCount}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting settlement</p>
            </CardContent>
          </Card>
          <Card data-testid="card-properly-fees">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Properly Fees</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-fees">
                {formatAUD(totalFees)}
              </div>
              <p className="text-xs text-muted-foreground">$100 per settled matter</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold font-heading">Payment History</h2>
          <Card>
            <div className="rounded-md border">
              <table className="w-full text-sm" data-testid="table-payments">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Referral</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Properly Fee ($100)</th>
                    <th className="p-4 font-medium">Net Amount</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center" data-testid="empty-payments">
                        <div className="space-y-4">
                          <div className="bg-[#e7f6f3] h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                            <DollarSign className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-heading font-bold text-lg">No Payments Yet</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                              Once your referrals settle, you'll see your commission payments here. The $100 Properly fee is deducted per settled matter.
                            </p>
                          </div>
                          <Link href="/referrer/create">
                            <Button className="gap-2" data-testid="button-create-referral">
                              <Plus className="h-4 w-4" /> Create a Referral
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedPayments.map((payment) => {
                      const referral = payment.referralId ? referralMap.get(payment.referralId) : null;
                      return (
                        <tr
                          key={payment.id}
                          className="border-b last:border-0 hover:bg-muted/10 transition-colors"
                          data-testid={`row-payment-${payment.id}`}
                        >
                          <td className="p-4 text-muted-foreground" data-testid={`text-date-${payment.id}`}>
                            {payment.createdAt
                              ? new Date(payment.createdAt).toLocaleDateString('en-AU', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '-'}
                          </td>
                          <td className="p-4 font-medium" data-testid={`text-referral-${payment.id}`}>
                            {referral?.clientName || '-'}
                          </td>
                          <td className="p-4" data-testid={`text-amount-${payment.id}`}>
                            {formatAUD(payment.amount)}
                          </td>
                          <td className="p-4 text-muted-foreground" data-testid={`text-fee-${payment.id}`}>
                            {formatAUD(payment.properlyFee)}
                          </td>
                          <td className="p-4 font-medium" data-testid={`text-net-${payment.id}`}>
                            {formatAUD(payment.netAmount)}
                          </td>
                          <td className="p-4" data-testid={`text-status-${payment.id}`}>
                            <Badge variant="secondary" className={statusBadgeClass(payment.status)}>
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
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
