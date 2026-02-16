import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Send, QrCode, Copy, MessageSquare, Monitor, Download, Check, Upload, ChevronDown, Home } from 'lucide-react';
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
  const [state, setState] = useState('');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setState('');
    setNotes('');
    setConsent(false);
    setUploadedFile(null);
  };

  const handleChannelChange = (newChannel: Channel) => {
    setChannel(newChannel);
    resetForm();
    setQrDataUrl(null);
    setQrLink(null);
  };

  const handlePortalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      toast({ title: "Consent required", description: "Please confirm you have obtained written consent.", variant: "destructive" });
      return;
    }
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const inputStyles = "bg-white border-[#d5d7da] rounded-[8px] px-[14px] py-[10px] shadow-xs focus:border-[#425b58] focus:ring-[#425b58]";
  const labelStyles = "text-[14px] font-medium text-[#414651]";

  return (
    <Layout role="BROKER">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-1">
          <Breadcrumb data-testid="breadcrumb-nav">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/referrer/dashboard" className="text-[#425b58] flex items-center gap-1" data-testid="breadcrumb-home">
                  <Home className="h-4 w-4" />
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[#425b58] font-medium" data-testid="breadcrumb-current">Make a referral</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-[24px] font-semibold text-foreground" data-testid="text-page-title">Make a referral</h1>
        </div>

        <div className="bg-white border border-[#d5d7da] rounded-[8px] shadow-xs" data-testid="card-portal-form">
          <form onSubmit={handlePortalSubmit} data-testid="form-portal">
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className={labelStyles}>First name</Label>
                  <Input
                    data-testid="input-first-name"
                    id="firstName"
                    placeholder="First name"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className={inputStyles}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className={labelStyles}>Last name</Label>
                  <Input
                    data-testid="input-last-name"
                    id="lastName"
                    placeholder="Last name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputStyles}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className={labelStyles}>Email</Label>
                <Input
                  data-testid="input-email"
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className={inputStyles}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className={labelStyles}>Mobile Number</Label>
                <Input
                  data-testid="input-phone"
                  id="phone"
                  type="tel"
                  placeholder="0400 000 000"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className={inputStyles}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="transactionType" className={labelStyles}>Buying or selling</Label>
                <Select value={transactionType} onValueChange={setTransactionType} data-testid="select-transaction-type">
                  <SelectTrigger data-testid="select-trigger-transaction-type" className={inputStyles}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Purchase" data-testid="select-item-purchase">Purchase</SelectItem>
                    <SelectItem value="Sale" data-testid="select-item-sale">Sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="state" className={labelStyles}>State</Label>
                <Select value={state} onValueChange={setState} data-testid="select-state">
                  <SelectTrigger data-testid="select-trigger-state" className={inputStyles}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NSW" data-testid="select-item-nsw">NSW</SelectItem>
                    <SelectItem value="VIC" data-testid="select-item-vic">VIC</SelectItem>
                    <SelectItem value="QLD" data-testid="select-item-qld">QLD</SelectItem>
                    <SelectItem value="WA" data-testid="select-item-wa">WA</SelectItem>
                    <SelectItem value="SA" data-testid="select-item-sa">SA</SelectItem>
                    <SelectItem value="TAS" data-testid="select-item-tas">TAS</SelectItem>
                    <SelectItem value="ACT" data-testid="select-item-act">ACT</SelectItem>
                    <SelectItem value="NT" data-testid="select-item-nt">NT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className={labelStyles}>Upload contract</Label>
                <div
                  data-testid="upload-contract-zone"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[8px] p-6 text-center cursor-pointer transition-colors ${
                    isDragging ? 'border-[#425b58] bg-[#f0f7f6]' : 'border-[#d5d7da] bg-white hover:border-[#425b58]/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-[#f0f7f6] border border-[#d5d7da] flex items-center justify-center">
                      <Upload className="h-5 w-5 text-[#425b58]" />
                    </div>
                    {uploadedFile ? (
                      <p className="text-sm text-[#414651] font-medium" data-testid="text-uploaded-file">{uploadedFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm text-[#414651]">
                          <span className="text-[#425b58] font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-[#717680]">PDF, JPEG or PNG</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                  data-testid="checkbox-consent"
                  className="mt-0.5"
                />
                <Label htmlFor="consent" className="text-sm text-[#414651] leading-5 font-normal cursor-pointer">
                  I confirm that I have obtained written consent from the buyer/seller to share their details with Properly
                </Label>
              </div>
            </div>

            <div className="px-6 pb-6">
              <Button
                data-testid="button-submit-portal"
                type="submit"
                disabled={loading || !consent}
                className="w-full bg-[#415b58] hover:bg-[#354a47] text-white rounded-[8px] py-[10px] px-[18px] text-base font-semibold shadow-xs relative overflow-hidden"
              >
                {loading ? 'Sending...' : 'Make referral'}
                <span className="absolute inset-x-0 top-0 h-px bg-white/20" />
              </Button>
            </div>
          </form>
        </div>

        <div className="flex items-center gap-3 justify-center">
          <button
            data-testid="button-channel-sms"
            type="button"
            onClick={() => {
              const phone = prompt("Enter client's mobile number (e.g. 0400 000 000):");
              if (phone) {
                const name = prompt("Enter client's name:") || "";
                createSmsReferral.mutate({
                  clientName: name,
                  clientPhone: phone,
                  propertyAddress: undefined,
                  notes: undefined,
                });
              }
            }}
            className="inline-flex items-center gap-2 text-sm text-[#425b58] hover:text-[#354a47] font-medium transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Send via SMS
          </button>
          <span className="text-[#d5d7da]">|</span>
          <button
            data-testid="button-channel-qr"
            type="button"
            onClick={() => {
              createQrReferral.mutate({
                brokerId: user?.id,
                clientName: "Walk-in",
                status: "Pending",
                commission: 0,
                channel: "QR",
              });
            }}
            className="inline-flex items-center gap-2 text-sm text-[#425b58] hover:text-[#354a47] font-medium transition-colors"
          >
            <QrCode className="h-4 w-4" />
            Generate QR Code
          </button>
          {qrDataUrl && (
            <>
              <span className="text-[#d5d7da]">|</span>
              <button
                data-testid="button-show-qr-dialog"
                type="button"
                onClick={() => setShowQrDialog(true)}
                className="inline-flex items-center gap-2 text-sm text-[#425b58] hover:text-[#354a47] font-medium transition-colors"
              >
                <QrCode className="h-4 w-4" />
                View QR Code
              </button>
            </>
          )}
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
