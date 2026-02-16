import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Mail, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { login } = useStore();
  const [_, setLocation] = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSent(true);
      setLoading(false);
    }, 1000);
  };

  const handleMagicLinkClick = () => {
    // Simulate clicking the link in email
    login(email);
    
    // Redirect based on role (simple heuristic for demo)
    if (email.includes('broker')) setLocation('/referrer/dashboard');
    else if (email.includes('conv')) setLocation('/conveyancer/dashboard');
    else if (email.includes('admin')) setLocation('/admin/dashboard');
    else setLocation('/client/dashboard');
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-500">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We've sent a magic link to <span className="font-bold text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <p className="font-bold mb-1">Demo Mode:</p>
              <p>Since this is a demo, just click the button below to simulate clicking the email link.</p>
            </div>
            <Button className="w-full" size="lg" onClick={handleMagicLinkClick}>
              Simulate "Log In" Click
            </Button>
          </CardContent>
          <CardFooter className="justify-center">
            <Button variant="link" onClick={() => setSent(false)}>Back to login</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background md:bg-muted/20 flex flex-col md:flex-row">
       {/* Hero Side (Hidden on mobile) */}
       <div className="hidden md:flex flex-1 bg-sidebar text-sidebar-foreground p-12 flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
             <h1 className="text-4xl font-heading font-bold mb-4">Properly.</h1>
             <p className="text-lg text-sidebar-foreground/80 max-w-md">
               The transparent, API-driven way to manage property transactions in Australia.
             </p>
          </div>
          
          <div className="relative z-10 space-y-6">
             <div className="flex items-center gap-4">
               <div className="bg-sidebar-primary/20 p-2 rounded-lg">
                 <ShieldCheck className="h-6 w-6 text-sidebar-primary" />
               </div>
               <div>
                 <h3 className="font-bold">Bank-Grade Security</h3>
                 <p className="text-sm text-sidebar-foreground/60">Data sovereign to ap-southeast-2</p>
               </div>
             </div>
          </div>

          {/* Abstract BG Pattern */}
          <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] opacity-10 bg-cover bg-center"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-sidebar via-transparent to-transparent"></div>
       </div>

       {/* Form Side */}
       <div className="flex-1 flex items-center justify-center p-4">
         <Card className="w-full max-w-md border-none shadow-none md:border md:shadow-lg">
           <CardHeader>
             <h2 className="text-2xl font-bold font-heading text-center md:text-left">Welcome back</h2>
             <CardDescription className="text-center md:text-left">
               Enter your email to receive a secure magic link.
             </CardDescription>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleLogin} className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="email">Email address</Label>
                 <Input 
                   id="email" 
                   type="email" 
                   placeholder="name@example.com" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                   className="h-12"
                 />
               </div>
               <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                 {loading ? 'Sending...' : 'Send Magic Link'}
               </Button>
             </form>

             <div className="mt-8">
               <div className="relative">
                 <div className="absolute inset-0 flex items-center">
                   <span className="w-full border-t" />
                 </div>
                 <div className="relative flex justify-center text-xs uppercase">
                   <span className="bg-background px-2 text-muted-foreground">
                     Or try a demo account
                   </span>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-2 mt-4">
                 <Button variant="outline" className="text-xs" onClick={() => { setEmail('sarah@example.com'); }}>
                   Buyer (Sarah)
                 </Button>
                 <Button variant="outline" className="text-xs" onClick={() => { setEmail('mike@broker.com.au'); }}>
                   Broker (Mike)
                 </Button>
                 <Button variant="outline" className="text-xs" onClick={() => { setEmail('admin@legaleagles.com.au'); }}>
                   Conveyancer
                 </Button>
                 <Button variant="outline" className="text-xs" onClick={() => { setEmail('admin@properly.com.au'); }}>
                   Admin
                 </Button>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
    </div>
  );
}
