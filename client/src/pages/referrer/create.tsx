import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Send, QrCode, Copy } from 'lucide-react';

export default function ReferrerCreate() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Mock API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Referral Sent!",
        description: "We've sent a magic invite link to your client via SMS and Email.",
      });
      setLocation('/referrer/dashboard');
    }, 1500);
  };

  return (
    <Layout role="BROKER">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">New Referral</h1>
          <p className="text-muted-foreground">Invite a client to Properly.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
            <CardDescription>
              We'll send them a secure link to start their onboarding.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="Jane" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="jane@example.com" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <Input id="phone" type="tel" placeholder="0400 000 000" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes for Conveyancer (Optional)</Label>
                <Textarea id="notes" placeholder="First home buyer, settlement needed by..." />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6 bg-muted/20">
              <Button variant="outline" type="button" onClick={() => setLocation('/referrer/dashboard')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Sending...' : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Send Invite
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

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
           <Button variant="outline" className="h-24 flex flex-col gap-2">
             <QrCode className="h-6 w-6" />
             Show QR Code
           </Button>
           <Button variant="outline" className="h-24 flex flex-col gap-2">
             <Copy className="h-6 w-6" />
             Copy Invite Link
           </Button>
        </div>
      </div>
    </Layout>
  );
}
