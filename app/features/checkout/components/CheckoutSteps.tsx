import { Link } from '@remix-run/react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import type { CheckoutStep } from '../types/checkout.types';

interface CheckoutStepsProps {
  currentStep: CheckoutStep;
  sessionId?: string;
  completedSteps: CheckoutStep[];
}

/**
 * Component that displays the checkout process steps
 */
export function CheckoutSteps({ currentStep, sessionId, completedSteps = [] }: CheckoutStepsProps) {
  const steps: { name: string; key: CheckoutStep }[] = [
    { name: 'Information', key: 'information' },
    { name: 'Shipping', key: 'shipping' },
    { name: 'Payment', key: 'payment' },
    { name: 'Review', key: 'review' },
    { name: 'Confirmation', key: 'confirmation' },
  ];

  return (
    <nav aria-label="Checkout process" className="mb-8">
      <ol className="flex items-center justify-center space-x-2 md:space-x-6 text-sm md:text-base">
        {steps.map((step, index) => {
          const isActive = step.key === currentStep;
          const isCompleted = completedSteps.includes(step.key);
          const isClickable = isCompleted && sessionId && step.key !== 'confirmation';

          // Determine styling based on step status
          const stepClasses = [
            'flex items-center',
            isActive ? 'text-blue-600 font-semibold' : '',
            isCompleted && !isActive ? 'text-green-600' : '',
            !isActive && !isCompleted ? 'text-gray-500' : '',
          ].join(' ');

          // Determine link for completed steps
          const linkUrl = isClickable ? `/checkout/${step.key}?session=${sessionId}` : undefined;

          return (
            <li key={step.key} className={stepClasses} aria-label={step.key}>
              <div className="flex items-center">
                {index > 0 && (
                  <div className="hidden md:block h-0.5 w-4 md:w-8 bg-gray-200 mx-1 md:mx-2"></div>
                )}
                {isCompleted ? (
                  <CheckCircleIcon
                    className="h-5 w-5 text-green-600 mr-1"
                    data-testid="check-icon"
                  />
                ) : (
                  <span
                    className={`
                    flex items-center justify-center h-5 w-5 rounded-full mr-1
                    ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
                  `}
                  >
                    {index + 1}
                  </span>
                )}
                {linkUrl ? (
                  <Link to={linkUrl} className="hover:text-blue-800">
                    {step.name}
                  </Link>
                ) : (
                  <span>{step.name}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
