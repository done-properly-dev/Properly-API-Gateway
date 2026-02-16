import React, { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, MapPin } from 'lucide-react';

interface ReferralData {
  referral: {
    clientName: string;
    status: string;
    channel: string;
    propertyAddress: string | null;
    transactionType: string | null;
    createdAt: string;
  };
  broker: {
    name: string;
    email: string;
  };
}

export default function ReferralLanding() {
  const [, params] = useRoute('/referral/qr/:token');
  const token = params?.token;
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(true);
      setLoading(false);
      return;
    }

    fetch(`/api/referrals/qr/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#ffece1' }}
        data-testid="referral-loading"
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#425b58' }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: '#ffece1' }}
        data-testid="referral-error"
      >
        <div className="text-center max-w-md">
          <Logo className="justify-center mb-8" />
          <div
            className="rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#e7f6f3' }}
          >
            <AlertCircle className="h-8 w-8" style={{ color: '#425b58' }} />
          </div>
          <h1
            className="text-2xl font-bold mb-3"
            style={{ color: '#425b58' }}
            data-testid="text-error-heading"
          >
            Link Not Found
          </h1>
          <p className="text-gray-600 mb-6" data-testid="text-error-message">
            This referral link is invalid or has expired. Please contact your broker for a new link.
          </p>
          <a href="/auth">
            <Button
              style={{ backgroundColor: '#425b58' }}
              className="text-white hover:opacity-90"
              data-testid="button-error-auth"
            >
              Go to Login
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#ffece1' }}
      data-testid="referral-landing"
    >
      <header className="px-6 py-4">
        <Logo data-testid="logo-properly" />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="max-w-lg w-full text-center">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{ color: '#425b58' }}
            data-testid="text-welcome-heading"
          >
            Welcome to Properly
          </h1>

          <p
            className="text-lg mb-8"
            style={{ color: '#425b58' }}
            data-testid="text-referred-by"
          >
            You've been referred by{' '}
            <span className="font-semibold">{data.broker.name}</span>
          </p>

          <div
            className="rounded-2xl p-8 mb-8 text-left"
            style={{ backgroundColor: '#e7f6f3' }}
            data-testid="card-referral-info"
          >
            {data.referral.propertyAddress && (
              <div className="flex items-start gap-3 mb-5">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#425b58' }} />
                <div>
                  <p className="text-sm text-gray-500">Property</p>
                  <p
                    className="font-medium"
                    style={{ color: '#425b58' }}
                    data-testid="text-property-address"
                  >
                    {data.referral.propertyAddress}
                  </p>
                </div>
              </div>
            )}

            <p className="text-gray-700 leading-relaxed" data-testid="text-description">
              Properly makes your property settlement simple and stress-free.
              Your broker has set things up for you — let's get started.
            </p>
          </div>

          <a href="/auth">
            <Button
              size="lg"
              className="w-full text-white text-lg py-6 rounded-xl hover:opacity-90"
              style={{ backgroundColor: '#425b58' }}
              data-testid="button-get-started"
            >
              Get Started
            </Button>
          </a>

          <p className="text-sm text-gray-500 mt-6" data-testid="text-footer">
            Powered by Properly · Simple, transparent settlements
          </p>
        </div>
      </main>
    </div>
  );
}
