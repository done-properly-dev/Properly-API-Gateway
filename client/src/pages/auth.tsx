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
        
        const meRes = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          queryClient.setQueryData(["/api/auth/me"], meData);
          redirectByRole(meData.role);
        } else {
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        }
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
    <div className="min-h-screen bg-white flex flex-col font-['Inter',sans-serif] relative">
      {/* Grid Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          opacity: 0.4,
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)'
        }}>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 w-full bg-white border-b" style={{ borderColor: '#e9eaeb', height: '80px' }}>
        <div className="max-w-[1280px] mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Logo variant="color" />
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-[16px] font-semibold hover:opacity-80" style={{ color: '#414651' }}>Features</Link>
              <Link href="/" className="text-[16px] font-semibold hover:opacity-80" style={{ color: '#414651' }}>Become a Partner</Link>
              <Link href="/" className="text-[16px] font-semibold hover:opacity-80" style={{ color: '#414651' }}>About</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAuthMode('login')}
              className="px-4 py-2.5 text-[14px] font-semibold rounded-lg bg-white border shadow-sm hover:bg-gray-50"
              style={{ color: '#414651', borderColor: '#d5d7da' }}
            >
              Log in
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className="px-4 py-2.5 text-[14px] font-semibold rounded-lg text-white shadow-sm hover:opacity-90"
              style={{ backgroundColor: '#415b58' }}
            >
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex justify-center pt-[96px] px-4 pb-12">
        <div className="w-full max-w-[360px] space-y-8">
          
          <div className="flex flex-col items-center text-center space-y-3">
            <img src="/images/logo-icon.png" alt="Properly" className="h-[40px] w-[40px] object-contain mb-3" />
            
            <h1 className="text-[30px] leading-[38px] font-semibold" style={{ color: '#181d27' }}>
              {authMode === 'signup' ? 'Sign up' : 'Log in to your account'}
            </h1>
            <p className="text-[16px] leading-[24px] font-normal" style={{ color: '#535862' }}>
              {authMode === 'signup' ? 'Get started with Properly today.' : 'Welcome back! Please enter your details.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-5">
              {authMode === 'signup' && (
                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-[14px] font-medium" style={{ color: '#414651' }}>Name*</label>
                  <input 
                    id="name" 
                    type="text" 
                    placeholder="Enter your name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-white rounded-[8px] px-[14px] py-[10px] text-[16px] font-normal outline-none focus:ring-2 focus:ring-[#415b58]/20 focus:border-[#415b58]"
                    style={{ 
                      color: '#0c0d0e', 
                      borderWidth: '1px', 
                      borderStyle: 'solid', 
                      borderColor: '#d5d7da',
                      boxShadow: '0px 1px 2px 0px rgba(10,13,18,0.05)'
                    }}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[14px] font-medium" style={{ color: '#414651' }}>Email*</label>
                <input 
                  id="email" 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white rounded-[8px] px-[14px] py-[10px] text-[16px] font-normal outline-none focus:ring-2 focus:ring-[#415b58]/20 focus:border-[#415b58]"
                  style={{ 
                    color: '#0c0d0e', 
                    borderWidth: '1px', 
                    borderStyle: 'solid', 
                    borderColor: '#d5d7da',
                    boxShadow: '0px 1px 2px 0px rgba(10,13,18,0.05)'
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-[14px] font-medium" style={{ color: '#414651' }}>Password*</label>
                <input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white rounded-[8px] px-[14px] py-[10px] text-[16px] font-normal outline-none focus:ring-2 focus:ring-[#415b58]/20 focus:border-[#415b58]"
                  style={{ 
                    color: '#0c0d0e', 
                    borderWidth: '1px', 
                    borderStyle: 'solid', 
                    borderColor: '#d5d7da',
                    boxShadow: '0px 1px 2px 0px rgba(10,13,18,0.05)'
                  }}
                />
                {authMode === 'signup' && (
                  <p className="text-[14px] font-normal mt-1.5" style={{ color: '#535862' }}>Must be at least 8 characters.</p>
                )}
              </div>
            </div>

            {authMode === 'login' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 rounded-[4px] accent-[#415b58]"
                    style={{ borderColor: '#d5d7da' }}
                  />
                  <label
                    htmlFor="remember"
                    className="text-[14px] font-medium leading-none"
                    style={{ color: '#414651' }}
                  >
                    Remember for 30 days
                  </label>
                </div>
                <a href="#" className="text-[14px] font-semibold hover:underline" style={{ color: '#383e42' }}>Forgot password</a>
              </div>
            )}

            <div className="space-y-4 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[8px] py-[10px] text-[16px] font-semibold text-white disabled:opacity-50"
                style={{ 
                  backgroundColor: '#415b58',
                  border: '2px solid rgba(255,255,255,0.12)',
                  boxShadow: 'inset 0px 0px 0px 1px rgba(10,13,18,0.18), inset 0px -2px 0px 0px rgba(10,13,18,0.05)'
                }}
              >
                {loading ? (authMode === 'signup' ? 'Creating account...' : 'Signing in...') : (authMode === 'signup' ? 'Get started' : 'Sign in')}
              </button>
              
              <button
                type="button"
                className="w-full flex items-center justify-center rounded-[8px] py-[10px] text-[16px] font-semibold bg-white hover:bg-gray-50"
                style={{ 
                  color: '#414651',
                  border: '1px solid #d5d7da',
                  boxShadow: '0px 1px 2px 0px rgba(10,13,18,0.05)'
                }}
              >
                <GoogleIcon />
                {authMode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
              </button>
            </div>
          </form>

          <div className="text-center text-[14px]">
            {authMode === 'login' ? (
              <>
                <span style={{ color: '#535862' }}>Don't have an account? </span>
                <a href="#" className="font-semibold hover:underline" style={{ color: '#383e42' }} onClick={(e) => { e.preventDefault(); setAuthMode('signup'); }}>Sign up</a>
              </>
            ) : (
              <>
                <span style={{ color: '#535862' }}>Already have an account? </span>
                <a href="#" className="font-semibold hover:underline" style={{ color: '#383e42' }} onClick={(e) => { e.preventDefault(); setAuthMode('login'); }}>Log in</a>
              </>
            )}
          </div>

          {/* Quick Demo Login Helpers */}
          <div className="pt-8 border-t mt-8" style={{ borderColor: '#e9eaeb' }}>
            <p className="text-xs text-center mb-4 uppercase tracking-wider font-semibold" style={{ color: '#535862' }}>Demo Access</p>
            <div className="grid grid-cols-2 gap-3">
              <button className="text-xs py-2 px-3 rounded-[8px] border border-dashed hover:opacity-80" style={{ borderColor: '#d5d7da', color: '#535862' }} onClick={() => handleDemoLogin('sarah@example.com', 'password')} data-testid="demo-login-buyer">
                Login as Buyer
              </button>
              <button className="text-xs py-2 px-3 rounded-[8px] border border-dashed hover:opacity-80" style={{ borderColor: '#d5d7da', color: '#535862' }} onClick={() => handleDemoLogin('james@buyer.com.au', 'password')} data-testid="demo-login-buyer-midway">
                Login as Buyer (Midway)
              </button>
              <button className="text-xs py-2 px-3 rounded-[8px] border border-dashed hover:opacity-80" style={{ borderColor: '#d5d7da', color: '#535862' }} onClick={() => handleDemoLogin('mike@broker.com.au', 'password')} data-testid="demo-login-broker">
                Login as Broker
              </button>
              <button className="text-xs py-2 px-3 rounded-[8px] border border-dashed hover:opacity-80" style={{ borderColor: '#d5d7da', color: '#535862' }} onClick={() => handleDemoLogin('admin@legaleagles.com.au', 'password')} data-testid="demo-login-conveyancer">
                Login as Conveyancer
              </button>
              <button className="text-xs py-2 px-3 rounded-[8px] border border-dashed hover:opacity-80" style={{ borderColor: '#d5d7da', color: '#535862' }} onClick={() => handleDemoLogin('admin@properly.com.au', 'password')} data-testid="demo-login-admin">
                Login as Admin
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t bg-white" style={{ borderColor: '#e9eaeb' }}>
        <div className="max-w-[1280px] mx-auto px-8 pt-[32px] pb-[32px] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[14px] font-normal" style={{ color: '#535862' }}>
            © 2026 Properly. All rights reserved.
          </div>
          <div className="flex gap-6 text-[14px] font-normal" style={{ color: '#535862' }}>
            <a href="#" className="hover:opacity-80">Terms</a>
            <a href="#" className="hover:opacity-80">Privacy</a>
            <a href="#" className="hover:opacity-80">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
