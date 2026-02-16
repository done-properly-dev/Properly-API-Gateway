import React from 'react';
import { Switch, Route, Redirect } from "wouter";
import { useAuth } from '@/lib/auth';

import LandingPage from '@/pages/landing';
import AuthPage from '@/pages/auth';
import ClientDashboard from '@/pages/client/dashboard';
import ClientDocuments from '@/pages/client/documents';
import ClientOnboarding from '@/pages/client/onboarding';
import ClientPlaybook from '@/pages/client/playbook';
import ReferrerDashboard from '@/pages/referrer/dashboard';
import ReferrerCreate from '@/pages/referrer/create';
import BrokerPayments from '@/pages/referrer/payments';
import BrokerTeam from '@/pages/referrer/team';
import AdminDashboard from '@/pages/admin/dashboard';
import SmokeballTestPage from '@/pages/admin/smokeball-test';
import NotificationTemplatesPage from '@/pages/admin/notification-templates';
import NotificationLogsPage from '@/pages/admin/notification-logs';
import ConveyancerDashboard from '@/pages/conveyancer/dashboard';
import ReferralLanding from '@/pages/referral-landing';
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { ProperlyLoader } from '@/components/properly-loader';

function PrivateRoute({ component: Component, allowedRoles }: { component: any, allowedRoles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ProperlyLoader size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user) return <Redirect to="/auth" />;
  const hasRole = allowedRoles.includes(user.role);
  if (!hasRole) return <Redirect to="/auth" />; 

  if (user.role === 'CLIENT' && !user.onboardingComplete && user.onboardingStep === 0 &&
      !window.location.pathname.startsWith('/client/onboarding')) {
    return <Redirect to="/client/onboarding" />;
  }

  return <Component />;
}

function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/referral/qr/:token" component={ReferralLanding} />
        
        {/* Client Routes */}
        <Route path="/client/onboarding">
          <PrivateRoute component={ClientOnboarding} allowedRoles={['CLIENT']} />
        </Route>
        <Route path="/client/dashboard">
          <PrivateRoute component={ClientDashboard} allowedRoles={['CLIENT']} />
        </Route>
        <Route path="/client/documents">
          <PrivateRoute component={ClientDocuments} allowedRoles={['CLIENT']} />
        </Route>
        <Route path="/client/playbook">
          <PrivateRoute component={ClientPlaybook} allowedRoles={['CLIENT']} />
        </Route>
        
        {/* Referrer Routes */}
        <Route path="/referrer/dashboard">
          <PrivateRoute component={ReferrerDashboard} allowedRoles={['BROKER']} />
        </Route>
        <Route path="/referrer/create">
          <PrivateRoute component={ReferrerCreate} allowedRoles={['BROKER']} />
        </Route>
        <Route path="/referrer/payments">
          <PrivateRoute component={BrokerPayments} allowedRoles={['BROKER']} />
        </Route>
        <Route path="/referrer/team">
          <PrivateRoute component={BrokerTeam} allowedRoles={['BROKER']} />
        </Route>

        {/* Conveyancer Routes */}
        <Route path="/conveyancer/dashboard">
          <PrivateRoute component={ConveyancerDashboard} allowedRoles={['CONVEYANCER']} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/dashboard">
          <PrivateRoute component={AdminDashboard} allowedRoles={['ADMIN']} />
        </Route>
        <Route path="/admin/smokeball-test">
          <PrivateRoute component={SmokeballTestPage} allowedRoles={['ADMIN']} />
        </Route>
        <Route path="/admin/notification-templates">
          <PrivateRoute component={NotificationTemplatesPage} allowedRoles={['ADMIN']} />
        </Route>
        <Route path="/admin/notification-logs">
          <PrivateRoute component={NotificationLogsPage} allowedRoles={['ADMIN']} />
        </Route>

        {/* Fallback */}
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
