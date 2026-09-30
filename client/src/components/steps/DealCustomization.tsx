import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle, Minus, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/quoteCalculator";
import doorMexicano from "@/assets/images/door-mexicano.jpg";

const DEAL_PRICE = 999;
const PREFINISHED_PER_DOOR = 240;
const TOTAL_DOORS = 6;
const PREFINISHED_TOTAL = PREFINISHED_PER_DOOR * TOTAL_DOORS;
const BATHROOM_LOCK_PRICE = 50;

interface DealCustomizationProps {
  initialData?: {
    isUpgraded: boolean;
    bathroomLocks: number;
  };
  onSubmit: (data: { isUpgraded: boolean; bathroomLocks: number }) => void;
  onBack: () => void;
}

export function DealCustomization({ initialData, onSubmit, onBack }: DealCustomizationProps) {
  const [isUpgraded, setIsUpgraded] = useState(initialData?.isUpgraded || false);
  const [bathroomLocks, setBathroomLocks] = useState(initialData?.bathroomLocks || 0);

  const basePrice = isUpgraded ? PREFINISHED_TOTAL : DEAL_PRICE;
  const locksTotal = bathroomLocks * BATHROOM_LOCK_PRICE;
  const currentTotal = basePrice + locksTotal;

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-deal-customization">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-semibold text-foreground">
          Your Deal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex justify-center pb-2">
          <div className="w-28 h-40 rounded-lg overflow-hidden bg-muted shadow-md flex items-center justify-center">
            <img
              src={doorMexicano}
              alt="Mexicano Oak Door"
              className="max-w-full max-h-full object-contain"
              data-testid="img-deal-door"
            />
          </div>
        </div>

        <div className="bg-primary/5 rounded-md p-4 text-center space-y-1">
          <p className="text-sm text-muted-foreground">6 Mexicano Oak Doors</p>
          <p className="text-sm text-muted-foreground">Supplied & Fitted</p>
          <p className="text-3xl font-bold text-primary" data-testid="text-deal-price">
            {isUpgraded ? formatCurrency(PREFINISHED_TOTAL) : formatCurrency(DEAL_PRICE)}
          </p>
          {!isUpgraded && (
            <p className="text-xs text-muted-foreground">
              That's just {formatCurrency(Math.round(DEAL_PRICE / TOTAL_DOORS))} per door
            </p>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium text-foreground text-xs uppercase tracking-wide">What's included:</p>
          <div className="grid grid-cols-1 gap-1.5">
            {[
              "6 Mexicano oak doors",
              "Expert fitting by Mark",
              "Premium latches & ball bearing hinges",
              "Morley or Chellaston handles (Satin Nickel)",
              "All waste removed",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground text-xs">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => setIsUpgraded(!isUpgraded)}
            className={cn(
              "w-full p-4 text-left transition-all",
              isUpgraded
                ? "bg-primary/5 border-primary"
                : "bg-card hover:bg-muted/50"
            )}
            data-testid="button-upgrade-toggle"
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0",
                isUpgraded ? "border-primary bg-primary" : "border-muted-foreground"
              )}>
                {isUpgraded && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-sm text-foreground">Upgrade to Pre-finished</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pre-finished doors come ready with a beautiful factory-applied finish — no staining or varnishing needed.
                </p>
                <p className="text-xs font-medium text-oak mt-1">
                  {formatCurrency(PREFINISHED_TOTAL)} total ({formatCurrency(PREFINISHED_PER_DOOR)}/door)
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Bathroom locks</p>
              <p className="text-xs text-muted-foreground">+{formatCurrency(BATHROOM_LOCK_PRICE)} per lock</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setBathroomLocks(Math.max(0, bathroomLocks - 1))}
                disabled={bathroomLocks === 0}
                data-testid="button-locks-minus"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-6 text-center font-medium text-sm" data-testid="text-locks-count">
                {bathroomLocks}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setBathroomLocks(Math.min(TOTAL_DOORS, bathroomLocks + 1))}
                disabled={bathroomLocks === TOTAL_DOORS}
                data-testid="button-locks-plus"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {(bathroomLocks > 0) && (
          <div className="bg-muted/50 rounded-md p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {isUpgraded ? "6 Pre-finished Mexicano doors" : "6 Unfinished Mexicano doors"}
              </span>
              <span className="font-medium">{formatCurrency(basePrice)}</span>
            </div>
            {bathroomLocks > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bathroom locks × {bathroomLocks}</span>
                <span className="font-medium">{formatCurrency(locksTotal)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1 mt-1">
              <span className="font-medium text-foreground">Total</span>
              <span className="font-bold text-primary" data-testid="text-running-total">{formatCurrency(currentTotal)}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            type="button"
            onClick={() => onSubmit({ isUpgraded, bathroomLocks })}
            className="flex-1"
            data-testid="button-continue"
          >
            {isUpgraded ? "Continue" : "Claim This Deal"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
