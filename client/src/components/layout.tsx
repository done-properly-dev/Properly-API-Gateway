import React from 'react';
import { useStore } from '@/lib/store';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, FileText, Settings, Users, Shield, LogOut, Menu, Search, Bell } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

interface LayoutProps {
  children: React.ReactNode;
  role?: 'CLIENT' | 'BROKER' | 'CONVEYANCER' | 'ADMIN';
  showNav?: boolean;
}

export function Layout({ children, role, showNav = true }: LayoutProps) {
  const { logout, currentUser } = useStore();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  if (!showNav) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  // Unified layout for Clients (Mobile & Web)
  if (role === 'CLIENT') {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        {/* Desktop Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
          <div className="flex h-16 items-center px-4 max-w-5xl mx-auto justify-between">
            <div className="flex items-center gap-8">
               <div className="font-heading font-extrabold text-2xl text-primary tracking-tight">Properly.</div>
               
               {/* Desktop Nav Links */}
               <nav className="hidden md:flex items-center gap-6">
                 <Link href="/client/dashboard">
                   <a className={`text-sm font-medium transition-colors hover:text-primary ${location === '/client/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}>Dashboard</a>
                 </Link>
                 <Link href="/client/documents">
                   <a className={`text-sm font-medium transition-colors hover:text-primary ${location === '/client/documents' ? 'text-primary' : 'text-muted-foreground'}`}>Documents</a>
                 </Link>
                 <Link href="/client/settings">
                   <a className={`text-sm font-medium transition-colors hover:text-primary ${location === '/client/settings' ? 'text-primary' : 'text-muted-foreground'}`}>Settings</a>
                 </Link>
               </nav>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 mr-2">
                 <span className="text-sm font-medium text-foreground">{currentUser?.name}</span>
                 <Button variant="ghost" size="sm" onClick={handleLogout}>Log out</Button>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5 text-foreground/70" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container max-w-5xl mx-auto p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Nav - Only visible on small screens */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white h-20 flex items-start justify-around z-50 pt-3 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
           <Link href="/client/dashboard">
             <div className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${location === '/client/dashboard' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
               <Home className={`h-6 w-6 ${location === '/client/dashboard' ? 'fill-current' : ''}`} />
               <span className="text-[10px] font-medium">Home</span>
             </div>
           </Link>
           <Link href="/client/documents">
             <div className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${location === '/client/documents' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
               <FileText className={`h-6 w-6 ${location === '/client/documents' ? 'fill-current' : ''}`} />
               <span className="text-[10px] font-medium">Vault</span>
             </div>
           </Link>
           <Link href="/client/settings">
             <div className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${location === '/client/settings' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
               <Settings className={`h-6 w-6 ${location === '/client/settings' ? 'fill-current' : ''}`} />
               <span className="text-[10px] font-medium">Settings</span>
             </div>
           </Link>
        </nav>
      </div>
    );
  }

  // Desktop/Sidebar layout for Pros (Figma Inspired) - Remains unchanged
  return (
    <div className="min-h-screen bg-[#fafafa] flex">
      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex w-72 flex-col border-r bg-white text-sidebar-foreground fixed inset-y-0 left-0 z-30">
        <div className="p-6 h-20 flex items-center border-b border-transparent">
          <h1 className="font-heading font-extrabold text-2xl text-primary tracking-tight">Properly.</h1>
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
               {currentUser?.name.charAt(0)}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-bold text-foreground truncate">{currentUser?.name}</p>
               <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
             </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Log out
          </Button>
        </div>
      </aside>

      {/* Mobile Header for Pros */}
      <div className="flex-1 flex flex-col min-h-0 md:pl-72 transition-all">
         <header className="md:hidden h-16 border-b bg-white flex items-center px-4 sticky top-0 z-50">
           <Sheet>
             <SheetTrigger asChild>
               <Button variant="ghost" size="icon"><Menu className="h-6 w-6"/></Button>
             </SheetTrigger>
             <SheetContent side="left" className="bg-white p-0 w-72">
                <div className="p-6 border-b">
                  <h1 className="font-heading font-bold text-2xl text-primary">Properly.</h1>
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
