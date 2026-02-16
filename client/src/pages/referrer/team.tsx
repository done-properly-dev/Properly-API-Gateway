import React from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { Users, TrendingUp, FileText, Plus, UserPlus } from 'lucide-react';
import { ProperlyLoader } from '@/components/properly-loader';
import type { Referral } from '@shared/schema';

interface OrgData {
  organisation: { id: string; name: string; type: string };
  membership: { id: string; orgId: string; userId: string; role: string };
  members: Array<{ id: string; orgId: string; userId: string; role: string; createdAt: string }>;
}

export default function BrokerTeam() {
  const { user } = useAuth();

  const { data: orgData, isLoading: orgLoading, error: orgError } = useQuery<OrgData>({
    queryKey: ['/api/organisations/me'],
    retry: false,
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ['/api/referrals'],
    enabled: !!orgData?.organisation,
  });

  const isLoading = orgLoading || referralsLoading;

  if (isLoading) {
    return (
      <Layout role="BROKER">
        <ProperlyLoader size="lg" text="Loading team pipeline..." fullPage />
      </Layout>
    );
  }

  const hasOrg = orgData?.organisation && !orgError;

  if (!hasOrg) {
    return (
      <Layout role="BROKER">
        <div className="flex items-center justify-center min-h-[60vh]" data-testid="no-org-state">
          <div className="text-center space-y-6 max-w-md">
            <div className="bg-[#e7f6f3] h-20 w-20 rounded-full flex items-center justify-center mx-auto">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-foreground" data-testid="text-no-org-title">
                No worries, you're not part of a team yet
              </h2>
              <p className="text-muted-foreground mt-2" data-testid="text-no-org-description">
                Ask your brokerage manager to add you, or create your own team. Easy as.
              </p>
            </div>
            <Link href="/referrer/dashboard">
              <Button className="gap-2" data-testid="button-back-dashboard">
                <UserPlus className="h-4 w-4" /> Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const organisation = orgData.organisation;
  const members = orgData.members || [];
  const allReferrals = referrals || [];

  const sortedReferrals = [...allReferrals].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  const convertedOrSettled = allReferrals.filter(
    r => r.status === 'Converted' || r.status === 'Settled'
  ).length;
  const conversionRate = allReferrals.length > 0
    ? Math.round((convertedOrSettled / allReferrals.length) * 100)
    : 0;

  const memberReferralCounts = members.reduce<Record<string, number>>((acc, member) => {
    acc[member.userId] = allReferrals.filter(r => r.brokerId === member.userId).length;
    return acc;
  }, {});

  const brokerNameMap = allReferrals.reduce<Record<string, string>>((acc, r) => {
    if (r.brokerId && !acc[r.brokerId]) {
      acc[r.brokerId] = r.brokerId;
    }
    return acc;
  }, {});

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-[#ffece1] text-[#425b58]';
      case 'MANAGER': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Settled': return 'bg-green-100 text-green-700';
      case 'Converted': return 'bg-blue-100 text-blue-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getChannelBadgeClass = (channel: string) => {
    switch (channel) {
      case 'SMS': return 'bg-purple-100 text-purple-700';
      case 'QR': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Layout role="BROKER">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4" data-testid="team-header">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground" data-testid="text-page-title">Team Pipeline</h1>
            <p className="text-muted-foreground" data-testid="text-org-name">{organisation.name}</p>
          </div>
          <Link href="/referrer/create">
            <Button className="w-full md:w-auto gap-2" data-testid="button-new-referral">
              <Plus className="h-4 w-4" /> New Referral
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="team-stats">
          <Card data-testid="card-total-referrals">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Team Referrals</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-referrals">{allReferrals.length}</div>
              <p className="text-xs text-muted-foreground">Across all team members</p>
            </CardContent>
          </Card>
          <Card data-testid="card-team-members">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-team-members">{members.length}</div>
              <p className="text-xs text-muted-foreground">Active team members</p>
            </CardContent>
          </Card>
          <Card data-testid="card-conversion-rate">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-conversion-rate">{conversionRate}%</div>
              <p className="text-xs text-muted-foreground">{convertedOrSettled} converted or settled</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4" data-testid="team-members-section">
          <h2 className="text-xl font-bold font-heading" data-testid="text-members-heading">Team Members</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <Card key={member.id} data-testid={`card-member-${member.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" data-testid={`text-member-name-${member.id}`}>
                        {member.userId === user?.id ? user.name : 'Team Member'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={getRoleBadgeClass(member.role)} data-testid={`badge-member-role-${member.id}`}>
                          {member.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground" data-testid={`text-member-referrals-${member.id}`}>
                          {memberReferralCounts[member.userId] || 0} referrals
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4" data-testid="pipeline-section">
          <h2 className="text-xl font-bold font-heading" data-testid="text-pipeline-heading">Pipeline</h2>
          <Card>
            <div className="rounded-md border">
              <table className="w-full text-sm" data-testid="table-pipeline">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="p-4 font-medium">Client</th>
                    <th className="p-4 font-medium">Referred By</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Channel</th>
                    <th className="p-4 font-medium">Property</th>
                    <th className="p-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedReferrals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center" data-testid="empty-pipeline">
                        <div className="space-y-4">
                          <div className="bg-[#e7f6f3] h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                            <FileText className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-heading font-bold text-lg">No referrals yet</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                              Your team hasn't made any referrals yet. Get the ball rolling!
                            </p>
                          </div>
                          <Link href="/referrer/create">
                            <Button className="gap-2" data-testid="button-make-referral">
                              <Plus className="h-4 w-4" /> Make a Referral
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedReferrals.map((referral) => (
                      <tr key={referral.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors" data-testid={`row-referral-${referral.id}`}>
                        <td className="p-4 font-medium" data-testid={`text-client-${referral.id}`}>{referral.clientName}</td>
                        <td className="p-4 text-muted-foreground" data-testid={`text-referred-by-${referral.id}`}>
                          {referral.brokerId === user?.id ? user.name : 'Team Member'}
                        </td>
                        <td className="p-4" data-testid={`badge-status-${referral.id}`}>
                          <Badge variant="secondary" className={getStatusBadgeClass(referral.status)}>
                            {referral.status}
                          </Badge>
                        </td>
                        <td className="p-4" data-testid={`badge-channel-${referral.id}`}>
                          <Badge variant="secondary" className={getChannelBadgeClass(referral.channel)}>
                            {referral.channel}
                          </Badge>
                        </td>
                        <td className="p-4 text-muted-foreground" data-testid={`text-property-${referral.id}`}>
                          {referral.propertyAddress || '—'}
                        </td>
                        <td className="p-4 text-muted-foreground" data-testid={`text-date-${referral.id}`}>
                          {referral.createdAt ? new Date(referral.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
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
