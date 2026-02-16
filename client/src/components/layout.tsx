import React from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, FileText, Settings, Users, Shield, LogOut, Menu, Search, Bell, BookOpen, CheckSquare, MessageSquare, Headphones, ChevronDown } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Logo } from '@/components/logo';
import type { Matter } from '@shared/schema';

interface LayoutProps {
  children: React.ReactNode;
  role?: 'CLIENT' | 'BROKER' | 'CONVEYANCER' | 'ADMIN';
  showNav?: boolean;
}

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
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  if (role === 'CLIENT') {
    return <ClientSidebarLayout user={user} location={location} handleLogout={handleLogout}>{children}</ClientSidebarLayout>;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex">
      <aside className="hidden md:flex w-72 flex-col border-r bg-white text-sidebar-foreground fixed inset-y-0 left-0 z-30">
        <div className="p-6 h-20 flex items-center border-b border-transparent">
          <Logo variant="color" />
        </div>
        
        <div className="px-4 py-4">
           <div className="relative">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input placeholder="Search..." className="pl-9 bg-secondary/50 border-transparent focus:bg-white focus:border-input transition-all" />
           </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-2">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Menu</p>
          <NavLinks role={role} location={location} />
        </nav>

        <div className="p-4 border-t border-sidebar-border mt-auto bg-gray-50/50">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-gray-100 hover:shadow-sm">
             <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
               {user?.name?.charAt(0)}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-bold text-foreground truncate">{user?.name}</p>
               <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
             </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Log out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-0 md:pl-72 transition-all">
         <header className="md:hidden h-16 border-b bg-white flex items-center px-4 sticky top-0 z-50">
           <Sheet>
             <SheetTrigger asChild>
               <Button variant="ghost" size="icon"><Menu className="h-6 w-6"/></Button>
             </SheetTrigger>
             <SheetContent side="left" className="bg-white p-0 w-72">
                <div className="p-6 border-b">
                  <Logo variant="color" />
                </div>
                <nav className="px-4 py-6 space-y-2">
                  <NavLinks role={role} location={location} />
                </nav>
             </SheetContent>
           </Sheet>
           <span className="ml-4 font-bold text-lg">Properly Pro</span>
         </header>

         <main className="flex-1 overflow-auto p-4 md:p-10">
            <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
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
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      location === path
        ? 'bg-[#e7f6f3] text-primary font-semibold'
        : 'hover:bg-gray-50 text-gray-600 hover:text-foreground'
    }`;

  const sidebarContent = (
    <>
      <div className="p-5 pb-4">
        <Logo variant="color" />
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search" className="pl-9 pr-12 bg-gray-50 border-gray-200 rounded-lg h-9 text-sm" data-testid="input-search" />
          <span className="absolute right-3 top-2 text-xs text-muted-foreground bg-white border rounded px-1.5 py-0.5">⌘K</span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 mt-1" data-testid="client-sidebar-nav">
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
            <span className="ml-auto bg-[#e7f6f3] text-primary text-xs font-semibold px-2 py-0.5 rounded-full" data-testid="badge-message-count">8</span>
          </div>
        </Link>
        <Link href="/client/playbook">
          <div className={clientLinkClass('/client/playbook')} data-testid="link-playbook">
            <BookOpen className="h-[18px] w-[18px]" /> Properly Playbook
          </div>
        </Link>
      </nav>

      <div className="px-3 space-y-0.5 mt-2">
        <Link href="/client/settings">
          <div className={clientLinkClass('/client/settings')} data-testid="link-settings">
            <Settings className="h-[18px] w-[18px]" /> Settings
          </div>
        </Link>
        <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 rounded-lg" data-testid="link-support">
          <Headphones className="h-[18px] w-[18px]" /> Support
          <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600" data-testid="status-support-online">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Online
          </span>
        </div>
      </div>

      <div className="mt-auto border-t border-gray-100">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <svg className="h-12 w-12" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle cx="24" cy="24" r="20" fill="none" stroke="#425b58" strokeWidth="3"
                  strokeDasharray={`${progressPercent * 1.256} 125.6`}
                  strokeLinecap="round" transform="rotate(-90 24 24)" />
                <text x="24" y="26" textAnchor="middle" className="text-[10px] font-bold fill-foreground">{progressPercent}%</text>
              </svg>
            </div>
            <span className="bg-[#e7f6f3] text-primary text-xs font-semibold px-2.5 py-1 rounded-full" data-testid="badge-role">Buyer</span>
          </div>
          <p className="text-sm font-medium text-foreground">
            Your <span className="text-primary font-bold">buying</span> journey
          </p>
          <p className="text-xs text-muted-foreground">You are {progressPercent}% complete!</p>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group" onClick={handleLogout} data-testid="button-user-menu">
            <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
              {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-foreground truncate" data-testid="text-user-name">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">{user?.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] flex">
      <aside className="hidden md:flex w-64 flex-col border-r border-gray-200 bg-white fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      <header className="md:hidden h-14 border-b bg-white flex items-center px-4 sticky top-0 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-white p-0 w-64">
            {sidebarContent}
          </SheetContent>
        </Sheet>
        <div className="ml-3">
          <Logo variant="color" />
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0 md:pl-64 transition-all">
        <main className="flex-1 overflow-auto p-5 md:p-8 animate-in fade-in duration-500 pb-24 md:pb-8">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white h-16 flex items-center justify-around z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
          <Link href="/client/dashboard">
            <div className={`flex flex-col items-center gap-1 p-2 ${location === '/client/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}>
              <Home className="h-5 w-5" />
              <span className="text-[10px] font-medium">Home</span>
            </div>
          </Link>
          <Link href="/client/documents">
            <div className={`flex flex-col items-center gap-1 p-2 ${location === '/client/documents' ? 'text-primary' : 'text-muted-foreground'}`}>
              <FileText className="h-5 w-5" />
              <span className="text-[10px] font-medium">Vault</span>
            </div>
          </Link>
          <Link href="/client/playbook">
            <div className={`flex flex-col items-center gap-1 p-2 ${location === '/client/playbook' ? 'text-primary' : 'text-muted-foreground'}`}>
              <BookOpen className="h-5 w-5" />
              <span className="text-[10px] font-medium">Playbook</span>
            </div>
          </Link>
          <Link href="/client/settings">
            <div className={`flex flex-col items-center gap-1 p-2 ${location === '/client/settings' ? 'text-primary' : 'text-muted-foreground'}`}>
              <Settings className="h-5 w-5" />
              <span className="text-[10px] font-medium">Settings</span>
            </div>
          </Link>
        </nav>
      </div>
    </div>
  );
}

function NavLinks({ role, location }: { role: any, location: string }) {
  const isBroker = role === 'BROKER';
  const isConveyancer = role === 'CONVEYANCER';
  const isAdmin = role === 'ADMIN';

  const linkClass = (path: string) => 
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      location === path 
        ? 'bg-secondary text-primary shadow-sm' 
        : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
    }`;

  return (
    <>
      {isBroker && (
        <>
          <Link href="/referrer/dashboard">
            <div className={linkClass('/referrer/dashboard')}>
              <Home className="h-5 w-5" /> Dashboard
            </div>
          </Link>
          <Link href="/referrer/create">
            <div className={linkClass('/referrer/create')}>
              <Users className="h-5 w-5" /> New Referral
            </div>
          </Link>
        </>
      )}

      {isConveyancer && (
        <>
          <Link href="/conveyancer/dashboard">
            <div className={linkClass('/conveyancer/dashboard')}>
              <Home className="h-5 w-5" /> Master View
            </div>
          </Link>
          <Link href="/conveyancer/clients">
            <div className={linkClass('/conveyancer/clients')}>
              <Users className="h-5 w-5" /> Clients
            </div>
          </Link>
          <Link href="/conveyancer/settings">
             <div className={linkClass('/conveyancer/settings')}>
               <Settings className="h-5 w-5" /> Settings
             </div>
          </Link>
        </>
      )}

      {isAdmin && (
        <>
           <Link href="/admin/dashboard">
            <div className={linkClass('/admin/dashboard')}>
              <Shield className="h-5 w-5" /> Sovereignty & Status
            </div>
          </Link>
          <Link href="/admin/templates">
            <div className={linkClass('/admin/templates')}>
              <FileText className="h-5 w-5" /> Notification Templates
            </div>
          </Link>
        </>
      )}
    </>
  );
}
