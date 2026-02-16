import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { ShieldCheck, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TwoFactorVerify() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { data: tfaStatus } = useQuery<{ enabled: boolean; verified: boolean; phone: string | null }>({
    queryKey: ['/api/2fa/status'],
  });

  const maskedPhone = tfaStatus?.phone
    ? '****' + tfaStatus.phone.slice(-4)
    : '****';

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest('POST', '/api/2fa/verify', { code });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.verified) {
        toast({ title: 'Verified!', description: 'Two-factor authentication is now active.' });
        queryClient.invalidateQueries({ queryKey: ['/api/2fa/status'] });
        setLocation('/referrer/dashboard');
      } else {
        toast({ title: 'Invalid code', description: 'The code you entered is incorrect or expired.', variant: 'destructive' });
        setDigits(Array(6).fill(''));
        inputRefs.current[0]?.focus();
      }
    },
    onError: (err: Error) => {
      toast({ title: 'Verification failed', description: err.message, variant: 'destructive' });
      setDigits(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/2fa/send');
    },
    onSuccess: () => {
      toast({ title: 'Code resent', description: 'A new verification code has been sent to your phone.' });
      setCooldown(60);
    },
    onError: (err: Error) => {
      toast({ title: 'Resend failed', description: err.message, variant: 'destructive' });
    },
  });

  const handleSubmit = useCallback(() => {
    const code = digits.join('');
    if (code.length === 6) {
      verifyMutation.mutate(code);
    }
  }, [digits]);

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 5) {
      const code = newDigits.join('');
      if (code.length === 6) {
        verifyMutation.mutate(code);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = Array(6).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    if (pasted.length === 6) {
      verifyMutation.mutate(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

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
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-foreground" data-testid="heading-2fa-verify">
                Enter verification code
              </h1>
              <p className="text-muted-foreground text-sm" data-testid="subtitle-2fa-verify">
                We've sent a 6-digit code to your phone
              </p>
              <p className="text-sm font-medium text-foreground" data-testid="text-masked-phone">
                {maskedPhone}
              </p>
            </div>

            <div className="flex justify-center gap-3" onPaste={handlePaste} data-testid="otp-inputs">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold border border-[#d5d7da] rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  data-testid={`input-otp-${i}`}
                />
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={digits.join('').length !== 6 || verifyMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-white"
                data-testid="button-verify"
              >
                {verifyMutation.isPending ? 'Verifying...' : 'Verify'}
              </Button>

              <div className="text-center">
                <button
                  onClick={() => resendMutation.mutate()}
                  disabled={cooldown > 0 || resendMutation.isPending}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                  data-testid="button-resend"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
