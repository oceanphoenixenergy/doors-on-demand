import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import cartoonVan from "@/assets/images/cartoon-van.png";

const STEPS = [
  { id: 1, label: "Area" },
  { id: 2, label: "Details" },
  { id: 3, label: "Deal" },
  { id: 4, label: "Handles" },
  { id: 5, label: "Quote" },
  { id: 6, label: "Sizes" },
  { id: 7, label: "Date" },
  { id: 8, label: "Address" },
  { id: 9, label: "Pay" },
];

interface OfferProgressBarProps {
  currentStep: number;
}

export function OfferProgressBar({ currentStep }: OfferProgressBarProps) {
  return (
    <div className="w-full bg-card border-b border-border py-4 px-4 sticky top-0 z-50" data-testid="offer-progress-bar">
      <div className="flex justify-center">
        <div className="flex items-center justify-center">
          {STEPS.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center relative">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors",
                      isCompleted && "bg-primary text-primary-foreground",
                      isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                    )}
                    data-testid={`step-indicator-${step.id}`}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : step.id}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] mt-1 text-center hidden sm:block",
                      isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                  {isCurrent && (
                    <img
                      src={cartoonVan}
                      alt="Doors On Demand van"
                      className="w-8 h-auto mt-0.5 sm:mt-1"
                      style={{ mixBlendMode: "multiply" }}
                      data-testid="img-progress-van"
                    />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-3 sm:w-6 h-0.5 mx-0.5 sm:mx-1",
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="sm:hidden mt-2 text-center">
        <span className="text-xs text-muted-foreground">
          Step {currentStep} of 9: {STEPS.find(s => s.id === currentStep)?.label}
        </span>
      </div>
    </div>
  );
}
