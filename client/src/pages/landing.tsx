import React from 'react';
import { useStore } from '@/lib/store';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, MessageSquare, Zap, LayoutTemplate, Shield, Clock, Users } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function LandingPage() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Navigation */}
      <nav className="bg-[#D1E8E2] py-4">
        <div className="container max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Logo variant="color" />
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
              <a href="#" className="hover:text-slate-900">Features</a>
              <a href="#" className="hover:text-slate-900">Become a Partner</a>
              <a href="#" className="hover:text-slate-900">About</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="bg-white/50 hover:bg-white/80 text-slate-900 font-medium" onClick={() => setLocation('/auth')}>Log in</Button>
            <Button className="bg-[#2D3748] hover:bg-[#1A202C] text-white font-medium" onClick={() => setLocation('/auth')}>Sign up</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#D1E8E2] pb-20 pt-10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <h1 className="text-5xl md:text-6xl font-heading font-bold text-slate-900 mb-6 leading-[1.1]">
                Welcome to Properly! <br/>
                The smarter way to buy or sell property.
              </h1>
              <p className="text-lg text-slate-700 mb-8 leading-relaxed">
                Properly turns a complicated process into a clear, step-by-step journey for Conveyancers, buyers and sellers alike.
              </p>
              <Button size="lg" className="bg-[#2D3748] hover:bg-[#1A202C] text-white h-12 px-8 text-base font-semibold" onClick={() => setLocation('/auth')}>
                Get started
              </Button>
            </div>
            <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl">
              <img 
                src="/images/hero-hands.jpg" 
                alt="Hands holding house model and keys" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16 border-b-2 border-dashed border-slate-200 pb-8">
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-4">Smart features that keep you moving</h2>
            <p className="text-slate-500">
              Everything you need to track, manage, and settle your property transaction without the stress.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-x-8 gap-y-12">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Direct Messaging</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Stay in touch with your conveyancer and broker in one secure place. No more lost emails.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Speed & Efficiency</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Automated workflows and real-time updates mean faster settlements and fewer delays.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                <LayoutTemplate className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Process Management</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                See exactly where you are in the journey with our 5-pillar progress tracker.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Bank-Grade Security</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Your data is stored securely in Australia (ap-southeast-2) and protected by enterprise-grade encryption.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">24/7 Access</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Check your settlement status, upload documents, and view tasks anytime, anywhere.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Team Collaboration</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Everyone involved - buyers, sellers, brokers, and conveyancers - on the same page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 bg-[#FFD8C2]">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-heading font-medium text-slate-900 mb-8 leading-relaxed">
            "Properly made buying my first home simple and stress-free, with simple tasks, helpful updates, and a clear end in sight."
          </h2>
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-white">
              <img src="/images/avatar-graham.jpg" alt="Graham Laurent" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-bold text-slate-900">Graham Laurent</div>
              <div className="text-sm text-slate-700">Home owner, Brisbane</div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="py-24 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-4">Complete your purchase, Properly</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              From contract to settlement, our platform handles the complexity so you can focus on the excitement of your new property.
            </p>
          </div>

          <div className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-200 bg-white p-2 mb-16 max-w-4xl mx-auto">
            <img src="/assets/Screenshot_2026-02-16_at_10.30.22_1771237826799.png" alt="Properly Dashboard Interface" className="w-full h-auto rounded-lg" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto border-t pt-12">
            <div>
              <h3 className="font-bold text-slate-900 mb-2">Interactive checklists</h3>
              <p className="text-sm text-slate-500">Know exactly what to do and when to do it.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2">Smart document uploads</h3>
              <p className="text-sm text-slate-500">Securely store and share critical files.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2">Real-time status</h3>
              <p className="text-sm text-slate-500">Instant updates from PEXA and Smokeball.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Section */}
      <section className="py-24 bg-[#E8F5F3]">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-4">Partner with us</h2>
            <p className="text-slate-600 max-w-2xl">
              We work with mortgage brokers, real estate agents, and property professionals who want a reliable conveyancing partner that keeps their clients informed and their deals on track.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div className="pl-4 border-l-2 border-slate-900">
                <h3 className="font-bold text-slate-900 mb-2">Why choose Properly</h3>
                <p className="text-sm text-slate-600 mb-2">
                  Properly reduces follow-ups, improves client experience, and gives you real-time visibility into each transaction. Your clients feel supported, and you stay informed without extra admin.
                </p>
                <a href="#" className="text-sm font-bold text-slate-900 hover:underline">Learn more →</a>
              </div>

              <div className="pl-4 border-l-2 border-slate-300">
                <h3 className="font-bold text-slate-900 mb-2">How referrals work</h3>
                <p className="text-sm text-slate-600 mb-2">
                  Referring a client takes seconds. Submit a referral, upload the contract when available, and we take care of onboarding, communication, and progress updates throughout the transaction.
                </p>
                <a href="#" className="text-sm font-bold text-slate-900 hover:underline">Learn more →</a>
              </div>

              <div className="pl-4 border-l-2 border-slate-300">
                <h3 className="font-bold text-slate-900 mb-2">Referral fees & payment</h3>
                <p className="text-sm text-slate-600 mb-2">
                  Partners receive referral fees for every transaction that settles. Payments are handled automatically after settlement, with clear reporting and full visibility of referral performance.
                </p>
                <a href="#" className="text-sm font-bold text-slate-900 hover:underline">Learn more →</a>
              </div>
            </div>

            <div className="bg-[#FFE4D6] p-8 rounded-xl shadow-sm">
               <div className="bg-white rounded-lg p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-6">
                   <h4 className="font-bold text-slate-900">Referral portal</h4>
                   <div className="h-2 w-12 bg-slate-200 rounded-full"></div>
                 </div>
                 <div className="flex gap-4 mb-6">
                   <div className="flex-1 p-4 border rounded-lg">
                     <div className="text-2xl font-bold text-slate-900">$400,000</div>
                     <div className="text-xs text-slate-500 mt-1">Total Volume</div>
                   </div>
                   <div className="flex-1 p-4 border rounded-lg">
                     <div className="text-2xl font-bold text-slate-900">2,440</div>
                     <div className="text-xs text-slate-500 mt-1">Commission</div>
                   </div>
                 </div>
                 <div className="space-y-2">
                   <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                   <div className="h-2 w-3/4 bg-slate-100 rounded-full"></div>
                   <div className="h-2 w-5/6 bg-slate-100 rounded-full"></div>
                   <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="container max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
           <Logo variant="color" />
           <div className="flex gap-6 text-sm text-slate-500">
             <a href="#" className="hover:text-slate-900">Terms</a>
             <a href="#" className="hover:text-slate-900">Privacy</a>
             <a href="#" className="hover:text-slate-900">Cookies</a>
           </div>
           <div className="text-sm text-slate-500">
             © 2026 Properly Pty Ltd. All rights reserved.
           </div>
        </div>
      </footer>
    </div>
  );
}
