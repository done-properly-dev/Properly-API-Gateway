import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation, useSearch } from 'wouter';
import { CheckCircle2, User, Shield, Upload, ArrowRight, ArrowLeft, PartyPopper, Loader2, AlertCircle, ExternalLink, Smartphone, Monitor } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const STEPS = [
  { id: 'welcome', title: "G'day!", icon: PartyPopper },
  { id: 'personal', title: 'About You', icon: User },
  { id: 'voi', title: 'Verify Identity', icon: Shield },
  { id: 'contract', title: 'Upload Contract', icon: Upload },
];

type VoiState = 'idle' | 'starting' | 'in_progress' | 'completed' | 'failed' | 'not_configured';

function useIsMobile() {
  return useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || window.innerWidth < 768;
  }, []);
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const isMobile = useIsMobile();
  const [step, setStep] = useState(user?.onboardingStep || 0);
  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    address: user?.address || '',
    state: user?.state || '',
    postcode: user?.postcode || '',
    voiMethod: user?.voiMethod || '',
  });

  const [voiState, setVoiState] = useState<VoiState>(
    user?.voiStatus === 'verified' ? 'completed' : 'idle'
  );
  const [voiError, setVoiError] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [voiSessionId, setVoiSessionId] = useState<string | null>(null);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const resumeStep = params.get('resumeStep');
    if (resumeStep) {
      setStep(parseInt(resumeStep, 10));
    } else if (params.get('voi') === 'complete') {
      setStep(2);
      (async () => {
        try {
          const meRes = await apiRequest('GET', '/api/auth/me');
          const me = await meRes.json();
          if (me.voiStatus === 'verified') {
            setVoiState('completed');
          } else if (me.voiSessionId) {
            setVoiSessionId(me.voiSessionId);
            const statusRes = await apiRequest('GET', `/api/verification/status/${me.voiSessionId}`);
            const statusData = await statusRes.json();
            if (statusData.status === 'Approved') {
              setVoiState('completed');
            } else {
              setVoiState('in_progress');
              setCheckMessage('Verification is being processed. Please check again shortly.');
            }
          }
        } catch {
          setVoiState('idle');
        }
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      })();
    }
  }, [searchString]);

  const updateOnboarding = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest('PATCH', '/api/auth/onboarding', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  const startVerification = useCallback(async () => {
    setVoiState('starting');
    setVoiError(null);
    setVerificationUrl(null);
    try {
      const res = await apiRequest('POST', '/api/verification/start');
      if (!res.ok) {
        const err = await res.json();
        if (res.status === 503) {
          setVoiState('not_configured');
          return;
        }
        throw new Error(err.message || 'Failed to start verification');
      }
      const session = await res.json();

      if (session.verificationUrl) {
        setVerificationUrl(session.verificationUrl);
        setVoiSessionId(session.sessionId);
        setCheckMessage(null);
        setVoiState('in_progress');

        if (isMobile) {
          window.location.href = session.verificationUrl;
        }
      }
    } catch (err: any) {
      setVoiError(err.message);
      setVoiState('failed');
    }
  }, [isMobile]);

  const handleNext = async () => {
    if (step === 1) {
      await updateOnboarding.mutateAsync({
        ...formData,
        onboardingStep: 2,
      });
    } else if (step === 2) {
      await updateOnboarding.mutateAsync({
        voiMethod: voiState === 'completed' ? 'didit' : formData.voiMethod || 'skip',
        voiStatus: voiState === 'completed' ? 'verified' : (voiState === 'in_progress' ? 'pending' : 'not_started'),
        onboardingStep: 3,
      });
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleComplete = async () => {
    await updateOnboarding.mutateAsync({
      onboardingComplete: true,
      onboardingStep: 4,
    });
    setLocation('/client/dashboard');
  };

  const handleSkip = async () => {
    await updateOnboarding.mutateAsync({
      onboardingComplete: true,
      onboardingStep: 4,
    });
    setLocation('/client/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e7f6f3] to-white">
      <div className="container max-w-lg mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <Logo variant="color" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-8" data-testid="onboarding-steps">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div
                className={`flex items-center justify-center h-10 w-10 rounded-full text-sm font-bold transition-all ${
                  i < step
                    ? 'bg-primary text-white'
                    : i === step
                    ? 'bg-primary text-white ring-4 ring-primary/20'
                    : 'bg-gray-200 text-gray-500'
                }`}
                data-testid={`step-indicator-${i}`}
              >
                {i < step ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 ${i < step ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {step === 0 && (
          <Card className="border-none shadow-lg">
            <CardContent className="p-8 text-center space-y-6">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-[#e7f6f3] mx-auto">
                <PartyPopper className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-heading font-bold text-foreground" data-testid="welcome-heading">
                Welcome to Properly, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We're stoked to have you on board. Let's get you set up so your conveyancer 
                can hit the ground running on your property settlement.
              </p>
              <p className="text-sm text-muted-foreground">
                This will only take a couple of minutes — promise!
              </p>
              <Button
                onClick={() => setStep(1)}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
                data-testid="button-get-started"
              >
                Let's Go <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card className="border-none shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-heading font-bold" data-testid="personal-heading">Tell Us About You</h2>
                <p className="text-muted-foreground mt-2">Just the basics — we'll keep it quick.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Mobile Number</Label>
                  <Input
                    id="phone"
                    placeholder="0412 345 678"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    data-testid="input-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    data-testid="input-dob"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Residential Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Smith Street, Sydney"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    data-testid="input-address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Select value={formData.state} onValueChange={val => setFormData({ ...formData, state: val })}>
                      <SelectTrigger data-testid="select-state">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NSW">NSW</SelectItem>
                        <SelectItem value="VIC">VIC</SelectItem>
                        <SelectItem value="QLD">QLD</SelectItem>
                        <SelectItem value="WA">WA</SelectItem>
                        <SelectItem value="SA">SA</SelectItem>
                        <SelectItem value="TAS">TAS</SelectItem>
                        <SelectItem value="ACT">ACT</SelectItem>
                        <SelectItem value="NT">NT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      placeholder="2000"
                      value={formData.postcode}
                      onChange={e => setFormData({ ...formData, postcode: e.target.value })}
                      data-testid="input-postcode"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(0)} data-testid="button-back">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-primary hover:bg-primary/90"
                  disabled={updateOnboarding.isPending}
                  data-testid="button-next"
                >
                  {updateOnboarding.isPending ? 'Saving...' : 'Next'} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-none shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-heading font-bold" data-testid="voi-heading">Verify Your Identity</h2>
                <p className="text-muted-foreground mt-2">
                  It's a legal requirement for property transactions in Australia. 
                  We use secure verification powered by Didit.
                </p>
              </div>

              {voiState === 'idle' && (
                <div className="space-y-4">
                  <div className="bg-[#e7f6f3] rounded-xl p-6 text-center space-y-4">
                    <Shield className="h-12 w-12 text-primary mx-auto" />
                    <h3 className="font-heading font-semibold text-lg">Quick & Secure Verification</h3>
                    <p className="text-sm text-muted-foreground">
                      You'll need a valid photo ID (driver's licence or passport) and your phone camera.
                      The process takes about 2 minutes.
                    </p>

                    {isMobile ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          <Smartphone className="h-4 w-4" />
                          <span>You'll verify right here on your phone</span>
                        </div>
                        <Button
                          onClick={startVerification}
                          className="bg-primary hover:bg-primary/90 text-white px-8 py-3 w-full"
                          data-testid="button-start-voi"
                        >
                          <Shield className="mr-2 h-5 w-5" />
                          Verify Now
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          <Monitor className="h-4 w-4" />
                          <span>We'll generate a QR code to scan with your phone</span>
                        </div>
                        <Button
                          onClick={startVerification}
                          className="bg-primary hover:bg-primary/90 text-white px-8 py-3"
                          data-testid="button-start-voi"
                        >
                          <Shield className="mr-2 h-5 w-5" />
                          Start Verification
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {voiState === 'starting' && (
                <div className="bg-[#e7f6f3] rounded-xl p-8 text-center space-y-4">
                  <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
                  <h3 className="font-heading font-semibold text-lg">Setting up verification...</h3>
                  <p className="text-sm text-muted-foreground">Hang tight, we're getting things ready for you.</p>
                </div>
              )}

              {voiState === 'in_progress' && !isMobile && verificationUrl && (
                <div className="bg-white border-2 border-primary/20 rounded-xl p-6 text-center space-y-5">
                  <div className="space-y-2">
                    <Smartphone className="h-8 w-8 text-primary mx-auto" />
                    <h3 className="font-heading font-semibold text-lg">Scan with your phone</h3>
                    <p className="text-sm text-muted-foreground">
                      Open your phone camera and point it at this QR code to start the verification process.
                    </p>
                  </div>

                  <div className="flex justify-center" data-testid="voi-qr-code">
                    <div className="bg-white p-4 rounded-xl shadow-md inline-block">
                      <QRCodeSVG
                        value={verificationUrl}
                        size={200}
                        level="H"
                        fgColor="#425b58"
                        includeMargin={false}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                      <p className="text-sm text-amber-700 font-medium">Waiting for verification to complete...</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Once you've finished on your phone, click "Check Verification Status" below.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      onClick={async () => {
                        try {
                          const res = await apiRequest('GET', `/api/verification/status/${voiSessionId}`);
                          if (res.ok) {
                            const result = await res.json();
                            if (result.status === 'Approved') {
                              setVoiState('completed');
                              queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
                            } else if (result.status === 'Declined') {
                              setVoiState('failed');
                              setVoiError('Your verification was not approved. Please try again.');
                            } else {
                              setVoiError(null);
                              setCheckMessage("We haven't received your results yet. Finish verification on your phone and check again.");
                            }
                          }
                        } catch {
                          setCheckMessage("Couldn't check status. Try again in a moment.");
                        }
                      }}
                      className="bg-primary hover:bg-primary/90 text-white"
                      data-testid="button-voi-check"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Check Verification Status
                    </Button>
                    {checkMessage && (
                      <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg text-center">{checkMessage}</p>
                    )}
                    <Button
                      onClick={() => window.open(verificationUrl, '_blank')}
                      variant="ghost"
                      className="text-muted-foreground text-xs"
                      data-testid="button-open-voi-link"
                    >
                      <ExternalLink className="mr-2 h-3 w-3" />
                      Or open in a new browser tab instead
                    </Button>
                  </div>
                </div>
              )}

              {voiState === 'in_progress' && isMobile && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center space-y-4">
                  <Loader2 className="h-10 w-10 text-blue-600 mx-auto animate-spin" />
                  <h3 className="font-heading font-semibold text-lg text-blue-900">Redirecting to verification...</h3>
                  <p className="text-sm text-blue-700">
                    If you're not redirected automatically, tap the button below.
                  </p>
                  <Button
                    onClick={() => { if (verificationUrl) window.location.href = verificationUrl; }}
                    variant="outline"
                    className="border-blue-300 text-blue-700"
                    data-testid="button-redirect-voi"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Verification
                  </Button>
                </div>
              )}

              {voiState === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                  <h3 className="font-heading font-semibold text-lg text-green-900">Identity Verified!</h3>
                  <p className="text-sm text-green-700">
                    Bonzer! Your identity has been verified successfully. You're all set to proceed.
                  </p>
                </div>
              )}

              {voiState === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                  <h3 className="font-heading font-semibold text-lg text-red-900">Verification Issue</h3>
                  <p className="text-sm text-red-700">
                    {voiError || "Something went wrong with the verification. Give it another go."}
                  </p>
                  <Button
                    onClick={startVerification}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    data-testid="button-retry-voi"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {voiState === 'not_configured' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
                  <h3 className="font-heading font-semibold text-lg text-amber-900">Verification Not Available Yet</h3>
                  <p className="text-sm text-amber-700">
                    Identity verification is being set up. You can skip this step for now and 
                    complete it later from your dashboard.
                  </p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  No worries if you're not ready yet — you can complete VOI later from your dashboard. 
                  Your conveyancer will remind you when it's time.
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(1)} data-testid="button-back">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-primary hover:bg-primary/90"
                  disabled={updateOnboarding.isPending}
                  data-testid="button-next"
                >
                  {updateOnboarding.isPending ? 'Saving...' : 'Next'} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="border-none shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-heading font-bold" data-testid="contract-heading">Upload Your Contract</h2>
                <p className="text-muted-foreground mt-2">
                  Got your contract of sale? Upload it here and your conveyancer will review it straight away.
                </p>
              </div>

              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                data-testid="upload-dropzone"
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium text-foreground">Drop your contract here</p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse (PDF, max 25MB)</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Don't have the contract yet? No dramas — skip this step and upload it later from your Document Vault.
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(2)} data-testid="button-back">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSkip} data-testid="button-skip">
                    Skip for Now
                  </Button>
                  <Button
                    onClick={handleComplete}
                    className="bg-primary hover:bg-primary/90"
                    disabled={updateOnboarding.isPending}
                    data-testid="button-complete"
                  >
                    {updateOnboarding.isPending ? 'Finishing...' : "I'm Done!"} <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          You can update all of this later in Settings. No pressure!
        </p>
      </div>
    </div>
  );
}
