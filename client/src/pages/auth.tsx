import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { CheckCircle2, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('CLIENT');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const { login, signup, user, isAuthenticated } = useAuth();
  const [_, setLocation] = useLocation();

  const loading = login.isPending || signup.isPending || demoLoading;

  useEffect(() => {
    if (isAuthenticated && user) {
      redirectByRole(user.role);
    }
  }, [isAuthenticated, user]);

  const redirectByRole = (userRole: string) => {
    if (userRole === 'BROKER') setLocation('/referrer/dashboard');
    else if (userRole === 'CONVEYANCER') setLocation('/conveyancer/dashboard');
    else if (userRole === 'ADMIN') setLocation('/admin/dashboard');
    else setLocation('/client/dashboard');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    
    try {
      if (authMode === 'signup') {
        await signup.mutateAsync({ email, password, name, role });
      } else {
        await login.mutateAsync({ email, password });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setAuthMode('login');
    setError('');
    setDemoLoading(true);
    
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Demo login failed');
      
      if (data.session) {
        const { data: sessionData, error } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        if (error) throw new Error(error.message);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans relative">
      {/* Grid Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          opacity: 0.4,
          maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)'
        }}>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 w-full bg-white/80 backdrop-blur-sm border-b border-slate-100">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Logo variant="color" />
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link href="/" className="hover:text-slate-900">Features</Link>
              <Link href="/" className="hover:text-slate-900">Become a Partner</Link>
              <Link href="/" className="hover:text-slate-900">About</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-50" onClick={() => setAuthMode('login')}>Log in</Button>
            <Button className="bg-[#2D3748] hover:bg-[#1A202C] text-white font-medium shadow-sm" onClick={() => setAuthMode('signup')}>Sign up</Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-[440px] space-y-8">
          
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="flex items-center justify-center">
              <img src="/images/properly-logo-stacked.png" alt="Properly" className="h-24 w-auto object-contain" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-heading font-bold text-slate-900">
                {authMode === 'signup' ? 'Create your account' : 'Log in to your account'}
              </h1>
              <p className="text-slate-500">
                {authMode === 'signup' ? 'Get started with Properly today.' : 'Welcome back! Please enter your details.'}
              </p>
            </div>

            {/* Toggle */}
            <div className="bg-slate-100 p-1 rounded-lg flex w-full max-w-[320px]">
              <button 
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMode === 'signup' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setAuthMode('signup')}
              >
                Sign up
              </button>
              <button 
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMode === 'login' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setAuthMode('login')}
              >
                Log in
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {authMode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 font-medium">Full Name</Label>
                    <Input 
                      id="name" 
                      type="text" 
                      placeholder="Enter your name" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-11 bg-white border-slate-200 focus:border-[#425b58] focus:ring-[#425b58]/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-slate-700 font-medium">Role</Label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#425b58] focus:ring-[#425b58]/20 transition-all"
                    >
                      <option value="CLIENT">Client / Buyer</option>
                      <option value="BROKER">Broker / Referrer</option>
                      <option value="CONVEYANCER">Conveyancer</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-white border-slate-200 focus:border-[#425b58] focus:ring-[#425b58]/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-white border-slate-200 focus:border-[#425b58] focus:ring-[#425b58]/20 transition-all"
                />
              </div>
            </div>

            {authMode === 'login' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" className="border-slate-300 data-[state=checked]:bg-[#425b58] data-[state=checked]:border-[#425b58]" />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
                  >
                    Remember for 30 days
                  </label>
                </div>
                <a href="#" className="text-sm font-bold text-slate-900 hover:underline">Forgot password</a>
              </div>
            )}

            <div className="space-y-4 pt-2">
              <Button type="submit" className="w-full h-11 bg-[#425b58] hover:bg-[#2d3f3d] text-white font-semibold text-base shadow-sm" disabled={loading}>
                {loading ? (authMode === 'signup' ? 'Creating account...' : 'Signing in...') : (authMode === 'signup' ? 'Sign up' : 'Sign in')}
              </Button>
              
              <Button type="button" variant="outline" className="w-full h-11 bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-50">
                <GoogleIcon />
                {authMode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
              </Button>
            </div>
          </form>

          <div className="text-center text-sm text-slate-500">
            {authMode === 'login' ? (
              <>Don't have an account? <a href="#" className="font-bold text-slate-900 hover:underline" onClick={() => setAuthMode('signup')}>Sign up</a></>
            ) : (
              <>Already have an account? <a href="#" className="font-bold text-slate-900 hover:underline" onClick={() => setAuthMode('login')}>Log in</a></>
            )}
          </div>

          {/* Quick Demo Login Helpers */}
          <div className="pt-8 border-t border-slate-100 mt-8">
            <p className="text-xs text-center text-slate-400 mb-4 uppercase tracking-wider font-semibold">Demo Access</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" size="sm" className="text-xs h-auto py-2 border border-dashed border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-400" onClick={() => handleDemoLogin('sarah@example.com', 'password')}>
                Login as Buyer
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-auto py-2 border border-dashed border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-400" onClick={() => handleDemoLogin('mike@broker.com.au', 'password')}>
                Login as Broker
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-auto py-2 border border-dashed border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-400" onClick={() => handleDemoLogin('admin@legaleagles.com.au', 'password')}>
                Login as Conveyancer
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-auto py-2 border border-dashed border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-400" onClick={() => handleDemoLogin('admin@properly.com.au', 'password')}>
                Login as Admin
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-100 bg-white py-8">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-slate-500">
            © 2026 Properly. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-900">Terms</a>
            <a href="#" className="hover:text-slate-900">Privacy</a>
            <a href="#" className="hover:text-slate-900">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
