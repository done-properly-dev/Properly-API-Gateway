import React from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, FileText, Settings, Users, Menu, Search, BookOpen, CheckSquare, MessageSquare, Headphones, ChevronDown, Bell, ScrollText, ShieldCheck } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from '@/components/logo';
import type { Matter } from '@shared/schema';

interface LayoutProps {
  children: React.ReactNode;
  role?: 'CLIENT' | 'BROKER' | 'CONVEYANCER' | 'ADMIN';
  showNav?: boolean;
}

const navLinkClass = (path: string, location: string) =>
  `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 relative rounded-r-lg ${
    location === path
      ? 'bg-[#e7f6f3] text-[#425b58] font-semibold border-l-[3px] border-[#425b58]'
      : 'text-[#414651] hover:bg-gray-50 border-l-[3px] border-transparent'
  }`;

export function Layout({ children, role, showNav = true }: LayoutProps) {
  const { logout, user } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation('/');
      }
    });
  };

  if (!showNav) {
    return <div className="min-h-screen bg-background font-['Inter',sans-serif]">{children}</div>;
  }

  if (role === 'CLIENT') {
    return <ClientSidebarLayout user={user} location={location} handleLogout={handleLogout}>{children}</ClientSidebarLayout>;
  }

  const rolePrefix = role === 'BROKER' ? '/referrer' : role === 'CONVEYANCER' ? '/conveyancer' : '/admin';

  const sidebarContent = (
    <>
      <div className="p-5">
        <Logo variant="color" />
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#717680]" />
          <input
            placeholder="Search"
            className="w-full pl-9 pr-14 bg-[#fafafa] border border-[#e9eaeb] rounded-lg h-9 text-sm text-[#414651] placeholder:text-[#717680] outline-none focus:border-[#425b58] transition-colors font-['Inter',sans-serif]"
            data-testid="input-search"
          />
          <span className="absolute right-3 top-2 text-xs text-[#717680] bg-white border border-[#e9eaeb] rounded px-1.5 py-0.5 font-['Inter',sans-serif]">⌘K</span>
        </div>
      </div>

      <nav className="flex-1 pr-3 space-y-0.5 mt-1 font-['Inter',sans-serif]">
        <Link href={`${rolePrefix}/dashboard`}>
          <div className={navLinkClass(`${rolePrefix}/dashboard`, location)} data-testid="link-dashboard">
            <Home className="h-[18px] w-[18px]" /> Dashboard
          </div>
        </Link>

        {(role === 'BROKER' || role === 'CONVEYANCER' || role === 'ADMIN') && (
          <Link href={`${rolePrefix}/clients`}>
            <div className={navLinkClass(`${rolePrefix}/clients`, location)} data-testid="link-clients">
              <Users className="h-[18px] w-[18px]" /> Clients
            </div>
          </Link>
        )}

        {(role === 'BROKER' || role === 'CONVEYANCER') && (
          <Link href={`${rolePrefix}/messages`}>
            <div className={navLinkClass(`${rolePrefix}/messages`, location)} data-testid="link-messages">
              <MessageSquare className="h-[18px] w-[18px]" /> Messages
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full" data-testid="badge-message-count">8</span>
            </div>
          </Link>
        )}

        {role === 'ADMIN' && (
          <>
            <Link href="/admin/notification-templates">
              <div className={navLinkClass('/admin/notification-templates', location)} data-testid="link-notification-templates">
                <Bell className="h-[18px] w-[18px]" /> Templates
              </div>
            </Link>
            <Link href="/admin/notification-logs">
              <div className={navLinkClass('/admin/notification-logs', location)} data-testid="link-notification-logs">
                <ScrollText className="h-[18px] w-[18px]" /> Notification Log
              </div>
            </Link>
          </>
        )}
      </nav>

      <div className="pr-3 space-y-0.5 mt-2 font-['Inter',sans-serif]">
        {role === 'BROKER' && (
          <Link href="/referrer/2fa-setup">
            <div className={navLinkClass('/referrer/2fa-setup', location)} data-testid="link-security">
              <ShieldCheck className="h-[18px] w-[18px]" /> Security
            </div>
          </Link>
        )}
        <Link href={`${rolePrefix}/settings`}>
          <div className={navLinkClass(`${rolePrefix}/settings`, location)} data-testid="link-settings">
            <Settings className="h-[18px] w-[18px]" /> Settings
          </div>
        </Link>
        <div className={`flex items-center gap-3 px-3 py-2.5 text-sm text-[#414651] cursor-pointer hover:bg-gray-50 border-l-[3px] border-transparent rounded-r-lg`} data-testid="link-support">
          <Headphones className="h-[18px] w-[18px]" /> Support
          <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600" data-testid="status-support-online">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Online
          </span>
        </div>
      </div>

      <div className="mt-auto border-t border-[#e9eaeb]">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group" onClick={handleLogout} data-testid="button-user-menu">
            <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-[#535862] font-semibold text-sm font-['Inter',sans-serif]">
              {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-[#181d27] truncate font-['Inter',sans-serif]" data-testid="text-user-name">{user?.name}</p>
              <p className="text-xs text-[#717680] truncate font-['Inter',sans-serif]" data-testid="text-user-email">{user?.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-[#717680]" />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] flex font-['Inter',sans-serif]">
      <aside className="hidden md:flex w-[296px] flex-col border-r border-[#e9eaeb] bg-white fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      <div className="flex-1 flex flex-col min-h-0 md:pl-[296px] transition-all">
        <header className="md:hidden h-14 border-b border-[#e9eaeb] bg-white flex items-center px-4 sticky top-0 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-white p-0 w-[296px]">
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <div className="ml-3">
            <Logo variant="color" />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-5 md:p-8 animate-in fade-in duration-500">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function ClientSidebarLayout({ children, user, location, handleLogout }: { children: React.ReactNode; user: any; location: string; handleLogout: () => void }) {
  const { data: matters } = useQuery<Matter[]>({ queryKey: ["/api/matters"] });
  const matter = matters?.find((m: Matter) => m.clientUserId === user?.id) || matters?.[0];

  const completedPillars = matter ? [matter.pillarPreSettlement, matter.pillarExchange, matter.pillarConditions, matter.pillarPreCompletion, matter.pillarSettlement].filter(s => s === 'complete').length : 0;
  const progressPercent = matter ? Math.round((completedPillars / 5) * 100) : 0;

  const clientLinkClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 relative rounded-r-lg font-['Inter',sans-serif] ${
      location === path
        ? 'bg-[#e7f6f3] text-[#425b58] font-semibold border-l-[3px] border-[#425b58]'
        : 'text-[#414651] hover:bg-gray-50 border-l-[3px] border-transparent'
    }`;

  const sidebarContent = (
    <>
      <div className="p-5">
        <Logo variant="color" />
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#717680]" />
          <input
            placeholder="Search"
            className="w-full pl-9 pr-14 bg-[#fafafa] border border-[#e9eaeb] rounded-lg h-9 text-sm text-[#414651] placeholder:text-[#717680] outline-none focus:border-[#425b58] transition-colors font-['Inter',sans-serif]"
            data-testid="input-search"
          />
          <span className="absolute right-3 top-2 text-xs text-[#717680] bg-white border border-[#e9eaeb] rounded px-1.5 py-0.5 font-['Inter',sans-serif]">⌘K</span>
        </div>
      </div>

      <nav className="flex-1 pr-3 space-y-0.5 mt-1" data-testid="client-sidebar-nav">
        <Link href="/client/dashboard">
          <div className={clientLinkClass('/client/dashboard')} data-testid="link-dashboard">
            <Home className="h-[18px] w-[18px]" /> Dashboard
          </div>
        </Link>
        <Link href="/client/tasks">
          <div className={clientLinkClass('/client/tasks')} data-testid="link-tasks">
            <CheckSquare className="h-[18px] w-[18px]" /> Tasks
          </div>
        </Link>
        <Link href="/client/documents">
          <div className={clientLinkClass('/client/documents')} data-testid="link-document-vault">
            <FileText className="h-[18px] w-[18px]" /> Document Vault
          </div>
        </Link>
        <Link href="/client/messages">
          <div className={clientLinkClass('/client/messages')} data-testid="link-messages">
            <MessageSquare className="h-[18px] w-[18px]" /> Messages
            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full" data-testid="badge-message-count">8</span>
          </div>
        </Link>
        <Link href="/client/playbook">
          <div className={clientLinkClass('/client/playbook')} data-testid="link-playbook">
            <BookOpen className="h-[18px] w-[18px]" /> Properly Playbook
          </div>
        </Link>
      </nav>

      <div className="pr-3 space-y-0.5 mt-2">
        <Link href="/client/settings">
          <div className={clientLinkClass('/client/settings')} data-testid="link-settings">
            <Settings className="h-[18px] w-[18px]" /> Settings
          </div>
        </Link>
        <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#414651] cursor-pointer hover:bg-gray-50 border-l-[3px] border-transparent rounded-r-lg font-['Inter',sans-serif]" data-testid="link-support">
          <Headphones className="h-[18px] w-[18px]" /> Support
          <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600" data-testid="status-support-online">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Online
          </span>
        </div>
      </div>

      <div className="mt-auto border-t border-[#e9eaeb]">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <svg className="h-12 w-12" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="#e9eaeb" strokeWidth="3" />
                <circle cx="24" cy="24" r="20" fill="none" stroke="#425b58" strokeWidth="3"
                  strokeDasharray={`${progressPercent * 1.256} 125.6`}
                  strokeLinecap="round" transform="rotate(-90 24 24)" />
                <text x="24" y="26" textAnchor="middle" className="text-[10px] font-bold fill-[#181d27]" style={{ fontFamily: 'Inter, sans-serif' }}>{progressPercent}%</text>
              </svg>
            </div>
            <span className="bg-[#e7f6f3] text-[#425b58] text-xs font-semibold px-2.5 py-1 rounded-full font-['Inter',sans-serif]" data-testid="badge-role">Buyer</span>
          </div>
          <p className="text-sm font-medium text-[#181d27] font-['Inter',sans-serif]">
            Your <span className="text-[#425b58] font-bold">buying</span> journey
          </p>
          <p className="text-xs text-[#717680] font-['Inter',sans-serif]">You are {progressPercent}% complete!</p>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group" onClick={handleLogout} data-testid="button-user-menu">
            <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-[#535862] font-semibold text-sm font-['Inter',sans-serif]">
              {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-[#181d27] truncate font-['Inter',sans-serif]" data-testid="text-user-name">{user?.name}</p>
              <p className="text-xs text-[#717680] truncate font-['Inter',sans-serif]" data-testid="text-user-email">{user?.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-[#717680]" />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] flex font-['Inter',sans-serif]">
      <aside className="hidden md:flex w-[296px] flex-col border-r border-[#e9eaeb] bg-white fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      <header className="md:hidden h-14 border-b border-[#e9eaeb] bg-white flex items-center px-4 sticky top-0 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-white p-0 w-[296px]">
            {sidebarContent}
          </SheetContent>
        </Sheet>
        <div className="ml-3">
          <Logo variant="color" />
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0 md:pl-[296px] transition-all">
        <main className="flex-1 overflow-auto p-5 md:p-8 animate-in fade-in duration-500 pb-24 md:pb-8">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[#e9eaeb] bg-white h-16 flex items-center justify-around z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
          <Link href="/client/dashboard">
            <div className={`flex flex-col items-center gap-1 p-2 ${location === '/client/dashboard' ? 'text-[#425b58]' : 'text-[#717680]'}`}>
              <Home className="h-5 w-5" />
              <span className="text-[10px] font-medium font-['Inter',sans-serif]">Home</span>
            </div>
          </Link>
          <Link href="/client/documents">
            <div className={`flex flex-col items-center gap-1 p-2 ${location === '/client/documents' ? 'text-[#425b58]' : 'text-[#717680]'}`}>
              <FileText className="h-5 w-5" />
              <span className="text-[10px] font-medium font-['Inter',sans-serif]">Vault</span>
            </div>
          </Link>
          <Link href="/client/playbook">
            <div className={`flex flex-col items-center gap-1 p-2 ${location === '/client/playbook' ? 'text-[#425b58]' : 'text-[#717680]'}`}>
              <BookOpen className="h-5 w-5" />
              <span className="text-[10px] font-medium font-['Inter',sans-serif]">Playbook</span>
            </div>
          </Link>
          <Link href="/client/settings">
            <div className={`flex flex-col items-center gap-1 p-2 ${location === '/client/settings' ? 'text-[#425b58]' : 'text-[#717680]'}`}>
              <Settings className="h-5 w-5" />
              <span className="text-[10px] font-medium font-['Inter',sans-serif]">Settings</span>
            </div>
          </Link>
        </nav>
      </div>
    </div>
  );
}
