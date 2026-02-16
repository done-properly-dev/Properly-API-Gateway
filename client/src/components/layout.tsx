import React from 'react';
import { useStore } from '@/lib/store';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, FileText, Settings, Users, Shield, LogOut, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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

  // Mobile layout for clients
  if (role === 'CLIENT') {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4">
            <div className="font-heading font-bold text-xl text-primary">Properly.</div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        <main className="container max-w-md mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </main>
        {/* Bottom Nav for Mobile */}
        <nav className="fixed bottom-0 left-0 right-0 border-t bg-background h-16 flex items-center justify-around z-50 pb-safe">
           <Link href="/client/dashboard">
             <div className={`flex flex-col items-center gap-1 p-2 ${location === '/client/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}>
               <Home className="h-5 w-5" />
               <span className="text-[10px] font-medium">Home</span>
             </div>
           </Link>
           <Link href="/client/documents">
             <div className={`flex flex-col items-center gap-1 p-2 ${location === '/client/documents' ? 'text-primary' : 'text-muted-foreground'}`}>
               <FileText className="h-5 w-5" />
               <span className="text-[10px] font-medium">Docs</span>
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
    );
  }

  // Desktop/Sidebar layout for Pros
  return (
    <div className="min-h-screen bg-muted/20 flex">
      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="p-6">
          <h1 className="font-heading font-bold text-2xl text-sidebar-primary">Properly.</h1>
          <p className="text-xs text-sidebar-foreground/60 mt-1 uppercase tracking-wider">Pro Portal</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <NavLinks role={role} location={location} />
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
             <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold">
               {currentUser?.name.charAt(0)}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-medium truncate">{currentUser?.name}</p>
               <p className="text-xs text-sidebar-foreground/60 truncate">{currentUser?.email}</p>
             </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-sidebar-border" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Log out
          </Button>
        </div>
      </aside>

      {/* Mobile Header for Pros */}
      <div className="flex-1 flex flex-col min-h-0">
         <header className="md:hidden h-14 border-b bg-background flex items-center px-4 sticky top-0 z-50">
           <Sheet>
             <SheetTrigger asChild>
               <Button variant="ghost" size="icon"><Menu className="h-5 w-5"/></Button>
             </SheetTrigger>
             <SheetContent side="left" className="bg-sidebar text-sidebar-foreground p-0 border-r-sidebar-border">
                <div className="p-6">
                  <h1 className="font-heading font-bold text-2xl text-sidebar-primary">Properly.</h1>
                </div>
                <nav className="px-4 space-y-2">
                  <NavLinks role={role} location={location} />
                </nav>
             </SheetContent>
           </Sheet>
           <span className="ml-4 font-bold">Properly Pro</span>
         </header>

         <main className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
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
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      location === path 
        ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
        : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/80'
    }`;

  return (
    <>
      {isBroker && (
        <>
          <Link href="/referrer/dashboard">
            <div className={linkClass('/referrer/dashboard')}>
              <Home className="h-4 w-4" /> Dashboard
            </div>
          </Link>
          <Link href="/referrer/create">
            <div className={linkClass('/referrer/create')}>
              <Users className="h-4 w-4" /> New Referral
            </div>
          </Link>
        </>
      )}

      {isConveyancer && (
        <>
          <Link href="/conveyancer/dashboard">
            <div className={linkClass('/conveyancer/dashboard')}>
              <Home className="h-4 w-4" /> Master View
            </div>
          </Link>
          <Link href="/conveyancer/clients">
            <div className={linkClass('/conveyancer/clients')}>
              <Users className="h-4 w-4" /> Clients
            </div>
          </Link>
          <Link href="/conveyancer/settings">
             <div className={linkClass('/conveyancer/settings')}>
               <Settings className="h-4 w-4" /> Settings
             </div>
          </Link>
        </>
      )}

      {isAdmin && (
        <>
           <Link href="/admin/dashboard">
            <div className={linkClass('/admin/dashboard')}>
              <Shield className="h-4 w-4" /> Sovereignty & Status
            </div>
          </Link>
          <Link href="/admin/templates">
            <div className={linkClass('/admin/templates')}>
              <FileText className="h-4 w-4" /> Notification Templates
            </div>
          </Link>
        </>
      )}
    </>
  );
}
