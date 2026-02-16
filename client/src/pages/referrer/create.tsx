import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Send, QrCode, Copy, MessageSquare, Monitor, Download, Check } from 'lucide-react';
import QRCode from 'qrcode';

type Channel = 'PORTAL' | 'SMS' | 'QR';

export default function ReferrerCreate() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const [channel, setChannel] = useState<Channel>('PORTAL');

  const [clientName, setClientName] = useState('');
  const [lastName, setLastName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [transactionType, setTransactionType] = useState('Purchase');
  const [notes, setNotes] = useState('');

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState<string | null>(null);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQrImage = useCallback(async (url: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: '#425b58', light: '#ffffff' },
      });
      setQrDataUrl(dataUrl);
      setQrLink(url);
    } catch {
      console.error('Failed to generate QR code');
    }
  }, []);

  const createPortalReferral = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/referrals", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
      toast({
        title: "Referral Sent!",
        description: "We've sent a magic invite link to your client via email.",
      });
      setLocation('/referrer/dashboard');
    },
  });

  const createSmsReferral = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/referrals/sms", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
      toast({
        title: "SMS invite sent!",
        description: "Your client will receive an SMS with their invite link.",
      });
      setLocation('/referrer/dashboard');
    },
  });

  const createQrReferral = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/referrals", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
      const token = data.qrToken;
      if (token) {
        const url = `${window.location.origin}/referral/qr/${token}`;
        generateQrImage(url);
      }
      toast({
        title: "QR Referral Created!",
        description: "Your QR code is ready to share.",
      });
    },
  });

  const loading = createPortalReferral.isPending || createSmsReferral.isPending || createQrReferral.isPending;

  const resetForm = () => {
    setClientName('');
    setLastName('');
    setClientEmail('');
    setClientPhone('');
    setPropertyAddress('');
    setTransactionType('Purchase');
    setNotes('');
  };

  const handleChannelChange = (newChannel: Channel) => {
    setChannel(newChannel);
    resetForm();
    setQrDataUrl(null);
    setQrLink(null);
  };

  const handlePortalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPortalReferral.mutate({
      brokerId: user?.id,
      clientName: `${clientName} ${lastName}`.trim(),
      clientEmail,
      clientPhone,
      propertyAddress: propertyAddress || undefined,
      transactionType,
      notes,
      status: "Pending",
      commission: 0,
      channel: "PORTAL",
    });
  };

  const handleSmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSmsReferral.mutate({
      clientName: `${clientName} ${lastName}`.trim(),
      clientPhone,
      propertyAddress: propertyAddress || undefined,
      notes: notes || undefined,
    });
  };

  const handleQrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = `${clientName} ${lastName}`.trim();
    createQrReferral.mutate({
      brokerId: user?.id,
      clientName: name || "Walk-in",
      propertyAddress: propertyAddress || undefined,
      notes: notes || undefined,
      status: "Pending",
      commission: 0,
      channel: "QR",
    });
  };

  const copyLink = async () => {
    if (!qrLink) return;
    try {
      await navigator.clipboard.writeText(qrLink);
      setCopied(true);
      toast({ title: "Link copied!", description: "The referral link has been copied to your clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Please copy the link manually.", variant: "destructive" });
    }
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = 'properly-referral-qr.png';
    link.href = qrDataUrl;
    link.click();
  };

  const channelCards = [
    { id: 'PORTAL' as Channel, icon: Monitor, label: 'Portal', desc: 'Full form with email invite' },
    { id: 'SMS' as Channel, icon: MessageSquare, label: 'SMS', desc: 'Quick text message invite' },
    { id: 'QR' as Channel, icon: QrCode, label: 'QR Code', desc: 'Generate a scannable code' },
  ];

  return (
    <Layout role="BROKER">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold" data-testid="text-page-title">New Referral</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">Invite a client to Properly.</p>
        </div>

        <div className="grid grid-cols-3 gap-3" data-testid="channel-selector">
          {channelCards.map((ch) => (
            <button
              key={ch.id}
              type="button"
              data-testid={`button-channel-${ch.id.toLowerCase()}`}
              onClick={() => handleChannelChange(ch.id)}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all text-center ${
                channel === ch.id
                  ? 'border-[#425b58] bg-[#e7f6f3] text-[#425b58]'
                  : 'border-border bg-card hover:border-[#425b58]/40 text-muted-foreground'
              }`}
            >
              <ch.icon className="h-6 w-6" />
              <span className="font-heading font-semibold text-sm">{ch.label}</span>
              <span className="text-xs leading-tight">{ch.desc}</span>
            </button>
          ))}
        </div>

        {channel === 'PORTAL' && (
          <Card data-testid="card-portal-form">
            <CardHeader>
              <CardTitle>Client Details</CardTitle>
              <CardDescription>
                We'll send them a secure link to start their onboarding.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePortalSubmit} data-testid="form-portal">
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input data-testid="input-first-name" id="firstName" placeholder="Jane" required value={clientName} onChange={(e) => setClientName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input data-testid="input-last-name" id="lastName" placeholder="Doe" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input data-testid="input-email" id="email" type="email" placeholder="jane@example.com" required value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile Number</Label>
                  <Input data-testid="input-phone" id="phone" type="tel" placeholder="0400 000 000" required value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyAddress">Property Address (Optional)</Label>
                  <Input data-testid="input-property-address" id="propertyAddress" placeholder="123 George St, Sydney NSW 2000" value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transactionType">Transaction Type</Label>
                  <Select value={transactionType} onValueChange={setTransactionType} data-testid="select-transaction-type">
                    <SelectTrigger data-testid="select-trigger-transaction-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Purchase" data-testid="select-item-purchase">Purchase</SelectItem>
                      <SelectItem value="Sale" data-testid="select-item-sale">Sale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes for Conveyancer (Optional)</Label>
                  <Textarea data-testid="input-notes" id="notes" placeholder="First home buyer, settlement needed by..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-6 bg-muted/20">
                <Button data-testid="button-cancel" variant="outline" type="button" onClick={() => setLocation('/referrer/dashboard')}>
                  Cancel
                </Button>
                <Button data-testid="button-submit-portal" type="submit" disabled={loading}>
                  {loading ? 'Sending...' : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Send Invite
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {channel === 'SMS' && (
          <Card data-testid="card-sms-form">
            <CardHeader>
              <CardTitle>SMS Invite</CardTitle>
              <CardDescription>
                Send a quick text message with a secure onboarding link.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSmsSubmit} data-testid="form-sms">
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smsFirstName">First Name</Label>
                    <Input data-testid="input-sms-first-name" id="smsFirstName" placeholder="Jane" required value={clientName} onChange={(e) => setClientName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smsLastName">Last Name</Label>
                    <Input data-testid="input-sms-last-name" id="smsLastName" placeholder="Doe" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smsPhone">Mobile Number</Label>
                  <Input data-testid="input-sms-phone" id="smsPhone" type="tel" placeholder="0400 000 000" required value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smsAddress">Property Address (Optional)</Label>
                  <Input data-testid="input-sms-property-address" id="smsAddress" placeholder="123 George St, Sydney NSW 2000" value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smsNotes">Notes (Optional)</Label>
                  <Textarea data-testid="input-sms-notes" id="smsNotes" placeholder="Any additional info for the team..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-6 bg-muted/20">
                <Button data-testid="button-sms-cancel" variant="outline" type="button" onClick={() => setLocation('/referrer/dashboard')}>
                  Cancel
                </Button>
                <Button data-testid="button-submit-sms" type="submit" disabled={loading}>
                  {loading ? 'Sending...' : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" /> Send SMS Invite
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {channel === 'QR' && (
          <>
            <Card data-testid="card-qr-form">
              <CardHeader>
                <CardTitle>QR Code Referral</CardTitle>
                <CardDescription>
                  Generate a QR code your client can scan — perfect for walk-ins and open homes.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleQrSubmit} data-testid="form-qr">
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="qrFirstName">Client First Name (Optional)</Label>
                      <Input data-testid="input-qr-first-name" id="qrFirstName" placeholder="Jane" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qrLastName">Client Last Name (Optional)</Label>
                      <Input data-testid="input-qr-last-name" id="qrLastName" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="qrAddress">Property Address (Optional)</Label>
                    <Input data-testid="input-qr-property-address" id="qrAddress" placeholder="123 George St, Sydney NSW 2000" value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="qrNotes">Notes (Optional)</Label>
                    <Textarea data-testid="input-qr-notes" id="qrNotes" placeholder="Walk-in at open home..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t p-6 bg-muted/20">
                  <Button data-testid="button-qr-cancel" variant="outline" type="button" onClick={() => setLocation('/referrer/dashboard')}>
                    Cancel
                  </Button>
                  <Button data-testid="button-submit-qr" type="submit" disabled={loading}>
                    {loading ? 'Generating...' : (
                      <>
                        <QrCode className="mr-2 h-4 w-4" /> Generate QR Code
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {qrDataUrl && qrLink && (
              <Card data-testid="card-qr-result" className="border-[#425b58]">
                <CardContent className="pt-6 flex flex-col items-center gap-4">
                  <img
                    src={qrDataUrl}
                    alt="Referral QR Code"
                    className="w-[250px] h-[250px] rounded-lg border"
                    data-testid="img-qr-code"
                  />
                  <p className="text-sm text-muted-foreground text-center max-w-sm break-all" data-testid="text-qr-link">
                    {qrLink}
                  </p>
                  <div className="flex gap-3">
                    <Button data-testid="button-copy-link" variant="outline" onClick={copyLink}>
                      {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                    <Button data-testid="button-download-qr" variant="outline" onClick={downloadQr}>
                      <Download className="mr-2 h-4 w-4" /> Download QR
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or share directly
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            data-testid="button-show-qr-dialog"
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => {
              if (qrDataUrl) {
                setShowQrDialog(true);
              } else {
                toast({ title: "No QR code yet", description: "Generate a QR referral first to view the code." });
              }
            }}
          >
            <QrCode className="h-6 w-6" />
            Show QR Code
          </Button>
          <Button
            data-testid="button-copy-invite-link"
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => {
              if (qrLink) {
                copyLink();
              } else {
                toast({ title: "No link available", description: "Generate a QR referral first to get a shareable link." });
              }
            }}
          >
            <Copy className="h-6 w-6" />
            Copy Invite Link
          </Button>
        </div>
      </div>

      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-qr-code">
          <DialogHeader>
            <DialogTitle className="font-heading">Referral QR Code</DialogTitle>
            <DialogDescription>
              Have your client scan this code to start their onboarding with Properly.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Referral QR Code"
                className="w-[280px] h-[280px] rounded-lg border"
                data-testid="img-dialog-qr-code"
              />
            )}
            {qrLink && (
              <p className="text-xs text-muted-foreground text-center break-all max-w-sm" data-testid="text-dialog-qr-link">
                {qrLink}
              </p>
            )}
            <div className="flex gap-3">
              <Button data-testid="button-dialog-copy-link" variant="outline" size="sm" onClick={copyLink}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button data-testid="button-dialog-download-qr" variant="outline" size="sm" onClick={downloadQr}>
                <Download className="mr-2 h-4 w-4" /> Download QR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
