import React from 'react';
import { Link } from 'wouter';
import { AlertTriangle, ArrowRight, Shield, User as UserIcon, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User as UserType } from '@shared/schema';

type SafeUser = Omit<UserType, 'password'>;

interface OnboardingAlertProps {
  user: SafeUser;
  hasDocuments?: boolean;
  onDismiss?: () => void;
}

export function OnboardingAlert({ user, hasDocuments = false, onDismiss }: OnboardingAlertProps) {
  const incompleteSteps: { label: string; icon: React.ReactNode; step: number }[] = [];

  const missingPersonalDetails = !user.phone || !user.dateOfBirth ||
    (user.phone === '') || (user.dateOfBirth === '');

  if (missingPersonalDetails) {
    incompleteSteps.push({
      label: 'Complete your personal details',
      icon: <UserIcon className="h-4 w-4" />,
      step: 1,
    });
  }

  if (user.voiStatus !== 'verified') {
    incompleteSteps.push({
      label: 'Verify your identity (VOI)',
      icon: <Shield className="h-4 w-4" />,
      step: 2,
    });
  }

  if (!hasDocuments) {
    incompleteSteps.push({
      label: 'Upload your contract',
      icon: <FileText className="h-4 w-4" />,
      step: 3,
    });
  }

  if (incompleteSteps.length === 0) return null;

  return (
    <div className="relative bg-gradient-to-r from-[#ffece1] to-[#ffece1]/60 border border-[#f5d0b9] rounded-xl p-4 sm:p-5" data-testid="onboarding-alert">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-[#8b6a50] hover:text-[#5a3e2e] transition-colors"
          data-testid="button-dismiss-alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="flex items-start gap-3">
        <div className="bg-[#f5d0b9] p-2 rounded-lg shrink-0 mt-0.5">
          <AlertTriangle className="h-5 w-5 text-[#8b5c3a]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-[#5a3e2e] text-base mb-1">
            Finish setting up your account
          </h3>
          <p className="text-sm text-[#8b6a50] mb-3">
            A few things still need your attention to keep your settlement on track.
          </p>
          <div className="flex flex-wrap gap-2">
            {incompleteSteps.map((step) => (
              <Link key={step.step} href={`/client/onboarding?resumeStep=${step.step}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/80 border-[#f5d0b9] text-[#5a3e2e] hover:bg-white hover:border-[#8b5c3a] text-xs h-8 gap-1.5"
                  data-testid={`button-resume-step-${step.step}`}
                >
                  {step.icon}
                  {step.label}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
