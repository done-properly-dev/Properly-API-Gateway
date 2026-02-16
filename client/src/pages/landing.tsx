import React from 'react';
import { useStore } from '@/lib/store';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="font-heading font-extrabold text-2xl text-primary tracking-tight">Properly.</div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation('/auth')}>Log in</Button>
            <Button onClick={() => setLocation('/auth')}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32 overflow-hidden relative">
        <div className="container max-w-6xl mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              Property settlement, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                simplified.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
              The transparent platform connecting Buyers, Sellers, Brokers, and Conveyancers. Track every step, from contract to keys.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" onClick={() => setLocation('/auth')}>
                Start for free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full bg-white hover:bg-slate-50" onClick={() => setLocation('/auth')}>
                Book a demo
              </Button>
            </div>
            
            <div className="mt-12 flex items-center gap-8 text-sm font-medium text-slate-500">
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                 <span>Bank-grade security</span>
               </div>
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                 <span>Real-time tracking</span>
               </div>
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                 <span>Mobile ready</span>
               </div>
            </div>
          </div>
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-50/50 to-transparent -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-50 to-transparent -z-10 pointer-events-none"></div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-slate-50">
        <div className="container max-w-6xl mx-auto px-4">
           <div className="text-center max-w-2xl mx-auto mb-16">
             <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-4">Built for everyone involved</h2>
             <p className="text-lg text-slate-600">
               Whether you're buying your first home or managing a conveyancing firm, Properly keeps you in the loop.
             </p>
           </div>

           <div className="grid md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                 <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 text-emerald-600 font-bold text-xl">
                   B
                 </div>
                 <h3 className="text-xl font-bold font-heading mb-3">Buyers & Sellers</h3>
                 <p className="text-slate-600">
                   Track your settlement progress in real-time. Upload documents securely and know exactly what's next.
                 </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                 <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600 font-bold text-xl">
                   R
                 </div>
                 <h3 className="text-xl font-bold font-heading mb-3">Referrers</h3>
                 <p className="text-slate-600">
                   Send referrals in seconds and track their status. See your commissions grow and keep clients happy.
                 </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                 <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600 font-bold text-xl">
                   C
                 </div>
                 <h3 className="text-xl font-bold font-heading mb-3">Conveyancers</h3>
                 <p className="text-slate-600">
                   A master view of all your matters. Syncs with Smokeball and PEXA to automate client updates.
                 </p>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="container max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="font-heading font-bold text-xl text-primary">Properly.</div>
           <div className="text-sm text-slate-500">
             © 2026 Properly Pty Ltd. All rights reserved.
           </div>
        </div>
      </footer>
    </div>
  );
}
