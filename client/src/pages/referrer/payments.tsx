import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import { ProperlyLoader } from '@/components/properly-loader';
import type { Payment, Referral } from '@shared/schema';

export default function BrokerPayments() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<'referrals' | 'payments'>('payments');
  const [payoutFrequency, setPayoutFrequency] = useState<'monthly' | 'per_settlement'>('monthly');

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ["/api/referrals"],
  });

  const isLoading = paymentsLoading || referralsLoading;

  useEffect(() => {
    if (activeTab === 'referrals') {
      navigate('/referrer/dashboard');
    }
  }, [activeTab, navigate]);

  if (isLoading) {
    return (
      <Layout role="BROKER">
        <ProperlyLoader size="lg" text="Loading payments..." fullPage />
      </Layout>
    );
  }

  return (
    <Layout role="BROKER">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground" data-testid="text-page-title">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground" data-testid="text-page-subtitle">
            Track and manage your client referrals.
          </p>
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

        <div className="border border-[#d5d7da] rounded-[8px] bg-white" data-testid="card-referrer-info">
          <div className="flex items-center justify-between p-5 pb-4">
            <h2 className="text-lg font-semibold text-[#181d27]">Referrer information</h2>
            <Button variant="ghost" className="text-sm text-[#535862] hover:text-[#181d27]" data-testid="button-edit-info">
              Edit
            </Button>
          </div>
          <div className="border-t border-[#e9eaeb]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              <div className="flex flex-col gap-1 p-5 border-b border-[#e9eaeb] sm:border-r" data-testid="field-full-name">
                <span className="text-sm text-[#535862]">Full name</span>
                <span className="text-sm font-medium text-[#181d27]">{user?.name || '—'}</span>
              </div>
              <div className="flex flex-col gap-1 p-5 border-b border-[#e9eaeb]" data-testid="field-email">
                <span className="text-sm text-[#535862]">Email address</span>
                <span className="text-sm font-medium text-[#181d27]">{user?.email || '—'}</span>
              </div>
              <div className="flex flex-col gap-1 p-5 border-b border-[#e9eaeb] sm:border-r" data-testid="field-mobile">
                <span className="text-sm text-[#535862]">Mobile number</span>
                <span className="text-sm font-medium text-[#181d27]">{user?.phone || '—'}</span>
              </div>
              <div className="flex flex-col gap-1 p-5 border-b border-[#e9eaeb]" data-testid="field-company">
                <span className="text-sm text-[#535862]">Company / Organisation</span>
                <span className="text-sm font-medium text-[#181d27]">—</span>
              </div>
              <div className="flex flex-col gap-1 p-5 sm:border-r" data-testid="field-role">
                <span className="text-sm text-[#535862]">Role</span>
                <span className="text-sm font-medium text-[#181d27]">{user?.role || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-[#d5d7da] rounded-[8px] bg-white" data-testid="card-payment-method">
          <div className="flex items-center justify-between p-5 pb-4">
            <h2 className="text-lg font-semibold text-[#181d27]">Referral payment method</h2>
            <Button variant="ghost" className="text-sm text-[#535862] hover:text-[#181d27]" data-testid="button-edit-payment">
              Edit
            </Button>
          </div>
          <div className="border-t border-[#e9eaeb]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
              <div className="flex flex-col gap-1 p-5 border-b sm:border-b-0 border-[#e9eaeb] sm:border-r" data-testid="field-bank-name">
                <span className="text-sm text-[#535862]">Bank name</span>
                <span className="text-sm font-medium text-[#181d27]">—</span>
              </div>
              <div className="flex flex-col gap-1 p-5 border-b sm:border-b-0 border-[#e9eaeb] sm:border-r" data-testid="field-bsb">
                <span className="text-sm text-[#535862]">BSB</span>
                <span className="text-sm font-medium text-[#181d27]">—</span>
              </div>
              <div className="flex flex-col gap-1 p-5" data-testid="field-account-number">
                <span className="text-sm text-[#535862]">Account number</span>
                <span className="text-sm font-medium text-[#181d27]">—</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-[#d5d7da] rounded-[8px] bg-white" data-testid="card-payout-frequency">
          <div className="p-5 pb-4">
            <h2 className="text-lg font-semibold text-[#181d27]">Frequency of payouts</h2>
          </div>
          <div className="border-t border-[#e9eaeb] p-5">
            <div className="inline-flex rounded-lg bg-[#fafafa] border border-[#e9eaeb] p-1" data-testid="toggle-payout-frequency">
              <button
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${payoutFrequency === 'monthly' ? 'bg-white shadow-sm border border-[#e9eaeb] text-[#181d27]' : 'text-[#535862] hover:text-[#181d27]'}`}
                onClick={() => setPayoutFrequency('monthly')}
                data-testid="toggle-monthly"
              >
                Monthly
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${payoutFrequency === 'per_settlement' ? 'bg-white shadow-sm border border-[#e9eaeb] text-[#181d27]' : 'text-[#535862] hover:text-[#181d27]'}`}
                onClick={() => setPayoutFrequency('per_settlement')}
                data-testid="toggle-per-settlement"
              >
                Per Settlement
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
