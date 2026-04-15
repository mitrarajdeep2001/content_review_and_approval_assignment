import type { ContentItem } from '../types';
import { clsx } from 'clsx';
import { Check, Clock, AlertCircle, XCircle } from 'lucide-react';

interface Props {
  item: ContentItem;
}

type StepStatus = 'completed' | 'active' | 'pending' | 'rejected';

interface Step {
  label: string;
  sublabel: string;
  status: StepStatus;
}

export function WorkflowProgress({ item }: Props) {
  const getSteps = (): Step[] => {
    const isRejected = item.status === 'CHANGES_REQUESTED';
    const isDraft = item.status === 'DRAFT';
    const isApproved = item.status === 'APPROVED';

    const step1Status = (): StepStatus => {
      if (isRejected) return 'rejected';
      if (isDraft) return 'pending';
      if (item.currentStage === 1 && item.status === 'IN_REVIEW') return 'active';
      if (item.currentStage >= 2 || isApproved) return 'completed';
      return 'pending';
    };

    const step2Status = (): StepStatus => {
      if (isRejected || isDraft) return 'pending';
      if (item.currentStage === 2 && item.status === 'IN_REVIEW') return 'active';
      if (isApproved) return 'completed';
      return 'pending';
    };

    return [
      {
        label: 'Draft',
        sublabel: 'Creator',
        status: isDraft ? 'active' : isRejected ? 'rejected' : 'completed',
      },
      {
        label: 'Stage 1 Review',
        sublabel: 'Reviewer L1',
        status: step1Status(),
      },
      {
        label: 'Stage 2 Review',
        sublabel: 'Reviewer L2',
        status: step2Status(),
      },
      {
        label: 'Published',
        sublabel: 'Final',
        status: isApproved ? 'completed' : 'pending',
      },
    ];
  };

  const steps = getSteps();

  const StepIcon = ({ status }: { status: StepStatus }) => {
    if (status === 'completed') return <Check className="h-3.5 w-3.5 text-white" />;
    if (status === 'active') return <Clock className="h-3.5 w-3.5 text-white" />;
    if (status === 'rejected') return <XCircle className="h-3.5 w-3.5 text-white" />;
    return <AlertCircle className="h-3.5 w-3.5 text-gray-400" />;
  };

  return (
    <div className="flex items-center">
      {steps.map((step, idx) => (
        <div key={step.label} className="flex items-center flex-1 last:flex-none">
          {/* Step */}
          <div className="flex flex-col items-center gap-1">
            <div
              className={clsx(
                'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all',
                step.status === 'completed' && 'bg-emerald-500 border-emerald-500',
                step.status === 'active' && 'bg-blue-500 border-blue-500 ring-4 ring-blue-100',
                step.status === 'rejected' && 'bg-red-500 border-red-500',
                step.status === 'pending' && 'bg-white border-gray-200'
              )}
            >
              <StepIcon status={step.status} />
            </div>
            <div className="text-center">
              <div
                className={clsx(
                  'text-xs font-semibold leading-none whitespace-nowrap',
                  step.status === 'completed' && 'text-emerald-700',
                  step.status === 'active' && 'text-blue-700',
                  step.status === 'rejected' && 'text-red-700',
                  step.status === 'pending' && 'text-gray-400'
                )}
              >
                {step.label}
              </div>
              <div className="text-xs text-gray-400 mt-0.5 hidden sm:block">{step.sublabel}</div>
            </div>
          </div>

          {/* Connector */}
          {idx < steps.length - 1 && (
            <div
              className={clsx(
                'flex-1 h-0.5 mx-2 mb-5 sm:mb-6 rounded',
                steps[idx + 1].status !== 'pending' && step.status !== 'pending'
                  ? 'bg-emerald-200'
                  : 'bg-gray-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
