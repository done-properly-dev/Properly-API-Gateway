import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Shield, ArrowRight, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TwoFactorSetup() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: tfaStatus } = useQuery<{ enabled: boolean; verified: boolean; phone: string | null }>({
    queryKey: ['/api/2fa/status'],
  });

  const [phone, setPhone] = useState(tfaStatus?.phone || user?.phone || '');

  React.useEffect(() => {
    if (tfaStatus?.phone) setPhone(tfaStatus.phone);
    else if (user?.phone) setPhone(user.phone);
  }, [tfaStatus, user]);

  const setupMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/2fa/setup', { phone });
      await apiRequest('POST', '/api/2fa/send');
    },
    onSuccess: () => {
      toast({ title: 'Verification code sent', description: 'Check your phone for the 6-digit code.' });
      setLocation('/referrer/2fa-verify');
    },
    onError: (err: Error) => {
      toast({ title: 'Setup failed', description: err.message, variant: 'destructive' });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e7f6f3] to-white font-['Inter',sans-serif]">
      <div className="container max-w-lg mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <Logo variant="color" />
        </div>

        <Card className="border-none shadow-lg rounded-xl">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#e7f6f3] mx-auto">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-foreground" data-testid="heading-2fa-setup">
                Secure Your Account
              </h1>
              <p className="text-muted-foreground text-sm" data-testid="subtitle-2fa-setup">
                Add two-factor authentication to protect your referral data
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-[#e7f6f3] rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">How it works</p>
                    <p className="text-xs text-muted-foreground">
                      We'll send a 6-digit code to your phone each time you log in to verify it's really you.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Mobile Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+61 412 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  data-testid="input-phone"
                />
                <p className="text-xs text-muted-foreground">
                  We'll send verification codes to this number
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                onClick={() => setupMutation.mutate()}
                disabled={!phone.trim() || setupMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-white"
                data-testid="button-enable-2fa"
              >
                {setupMutation.isPending ? 'Setting up...' : 'Enable 2FA'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Link href="/referrer/dashboard">
                <button
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  data-testid="link-skip-2fa"
                >
                  Skip for now
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
