import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/logo';

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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-500 border shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 p-4 rounded-full w-fit mb-4">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold font-heading">Check your email</CardTitle>
            <CardDescription className="text-base">
              We've sent a magic link to <span className="font-bold text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-secondary/50 border border-secondary rounded-xl p-4 text-sm text-foreground/80">
              <p className="font-bold mb-1 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600"/> Demo Mode Active</p>
              <p>Since this is a demo, you don't need to check your actual email. Just click the button below.</p>
            </div>
            <Button className="w-full h-12 text-base font-medium" size="lg" onClick={handleMagicLinkClick}>
              Open Magic Link
            </Button>
          </CardContent>
          <CardFooter className="justify-center pb-8">
            <Button variant="ghost" onClick={() => setSent(false)} className="text-muted-foreground hover:text-foreground">
              Back to login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
       {/* Hero Side - Full height, immersive */}
       <div className="hidden md:flex flex-1 bg-[#101828] text-white p-16 flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
             <div className="mb-8">
                <span className="bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                  Trusted by 500+ Conveyancers
                </span>
             </div>
             <h1 className="text-5xl font-heading font-bold mb-6 leading-tight">
               Property transactions, <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">properly done.</span>
             </h1>
             <p className="text-xl text-slate-300 max-w-md leading-relaxed">
               The transparent, API-driven platform that brings Buyers, Sellers, Brokers, and Conveyancers together.
             </p>
          </div>
          
          <div className="relative z-10 space-y-8">
             <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-fit">
               <div className="bg-emerald-500/20 p-2.5 rounded-xl">
                 <ShieldCheck className="h-6 w-6 text-emerald-400" />
               </div>
               <div>
                 <h3 className="font-bold text-white">Bank-Grade Security</h3>
                 <p className="text-sm text-slate-400">Data sovereign to ap-southeast-2</p>
               </div>
             </div>
             
             <div className="flex gap-2 text-sm text-slate-500">
                <span>© 2026 Properly</span>
                <span>•</span>
                <span>Privacy Policy</span>
                <span>•</span>
                <span>Terms</span>
             </div>
          </div>

          {/* Abstract BG Pattern */}
          <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#101828]/90 via-[#101828]/50 to-[#101828]/90"></div>
       </div>

       {/* Form Side - Centered, clean */}
       <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white">
         <div className="w-full max-w-md space-y-8">
           <div className="text-center md:text-left space-y-2">
             <div className="md:hidden mb-8 flex justify-center">
               <Logo variant="color" />
             </div>
             <h2 className="text-3xl font-bold font-heading text-slate-900">Welcome back</h2>
             <p className="text-slate-500 text-lg">
               Enter your email to access your dashboard.
             </p>
           </div>

           <form onSubmit={handleLogin} className="space-y-6">
             <div className="space-y-2">
               <Label htmlFor="email" className="text-slate-700 font-medium">Email address</Label>
               <Input 
                 id="email" 
                 type="email" 
                 placeholder="name@example.com" 
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 required
                 className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all"
               />
             </div>
             <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={loading}>
               {loading ? 'Sending...' : 'Send Magic Link'}
               {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
             </Button>
           </form>

           <div className="pt-8">
             <div className="relative">
               <div className="absolute inset-0 flex items-center">
                 <span className="w-full border-t border-slate-200" />
               </div>
               <div className="relative flex justify-center text-xs uppercase">
                 <span className="bg-white px-4 text-slate-400 font-medium tracking-wider">
                   Or try a demo persona
                 </span>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-3 mt-6">
               <Button variant="outline" className="h-auto py-3 px-4 flex flex-col items-start gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all" onClick={() => { setEmail('sarah@example.com'); }}>
                 <span className="font-semibold text-slate-900">Buyer</span>
                 <span className="text-xs text-slate-500 font-normal">Sarah Jenkins</span>
               </Button>
               <Button variant="outline" className="h-auto py-3 px-4 flex flex-col items-start gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all" onClick={() => { setEmail('mike@broker.com.au'); }}>
                 <span className="font-semibold text-slate-900">Broker</span>
                 <span className="text-xs text-slate-500 font-normal">Mike The Broker</span>
               </Button>
               <Button variant="outline" className="h-auto py-3 px-4 flex flex-col items-start gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all" onClick={() => { setEmail('admin@legaleagles.com.au'); }}>
                 <span className="font-semibold text-slate-900">Conveyancer</span>
                 <span className="text-xs text-slate-500 font-normal">Legal Eagles</span>
               </Button>
               <Button variant="outline" className="h-auto py-3 px-4 flex flex-col items-start gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all" onClick={() => { setEmail('admin@properly.com.au'); }}>
                 <span className="font-semibold text-slate-900">Admin</span>
                 <span className="text-xs text-slate-500 font-normal">Properly Admin</span>
               </Button>
             </div>
           </div>
         </div>
       </div>
    </div>
  );
}
