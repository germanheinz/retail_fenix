import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, label: 'Shipping' },
  { id: 2, label: 'Delivery' },
  { id: 3, label: 'Payment' },
  { id: 4, label: 'Confirm' },
]

interface CheckoutProgressProps {
  currentStep: number
}

export function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  return (
    <nav aria-label="Checkout progress" className="mb-8">
      <ol className="flex items-center justify-center gap-0">
        {STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isUpcoming = step.id > currentStep

          return (
            <li key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    isUpcoming && 'bg-gray-100 text-gray-400'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'mt-1 text-xs font-medium hidden sm:block',
                    isCurrent && 'text-primary',
                    isCompleted && 'text-gray-500',
                    isUpcoming && 'text-gray-400'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-12 sm:w-20 mx-1',
                    step.id < currentStep ? 'bg-primary' : 'bg-gray-200'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
