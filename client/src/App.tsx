import React from 'react';
import { Switch, Route, Redirect } from "wouter";
import { useAuth } from '@/lib/auth';

import LandingPage from '@/pages/landing';
import AuthPage from '@/pages/auth';
import ClientDashboard from '@/pages/client/dashboard';
import ClientDocuments from '@/pages/client/documents';
import ReferrerDashboard from '@/pages/referrer/dashboard';
import ReferrerCreate from '@/pages/referrer/create';
import AdminDashboard from '@/pages/admin/dashboard';
import ConveyancerDashboard from '@/pages/conveyancer/dashboard';
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";

function PrivateRoute({ component: Component, allowedRoles }: { component: any, allowedRoles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Redirect to="/auth" />;
  const hasRole = allowedRoles.includes(user.role);
  if (!hasRole) return <Redirect to="/auth" />; 

  return <Component />;
}

function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
        
        {/* Client Routes */}
        <Route path="/client/dashboard">
          <PrivateRoute component={ClientDashboard} allowedRoles={['CLIENT']} />
        </Route>
        <Route path="/client/documents">
          <PrivateRoute component={ClientDocuments} allowedRoles={['CLIENT']} />
        </Route>
        
        {/* Referrer Routes */}
        <Route path="/referrer/dashboard">
          <PrivateRoute component={ReferrerDashboard} allowedRoles={['BROKER']} />
        </Route>
        <Route path="/referrer/create">
          <PrivateRoute component={ReferrerCreate} allowedRoles={['BROKER']} />
        </Route>

        {/* Conveyancer Routes */}
        <Route path="/conveyancer/dashboard">
          <PrivateRoute component={ConveyancerDashboard} allowedRoles={['CONVEYANCER']} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/dashboard">
          <PrivateRoute component={AdminDashboard} allowedRoles={['ADMIN']} />
        </Route>

        {/* Fallback */}
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
