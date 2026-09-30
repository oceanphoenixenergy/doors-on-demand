import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Lock, Loader2, CheckCircle, Shield, Phone } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";
import type { DoorStyle, DoorSizeEntry } from "@shared/schema";

import doorMexicano from "@/assets/images/door-mexicano.jpg";
import doorIseo from "@/assets/images/door-iseo.jpg";
import doorAston from "@/assets/images/door-aston.jpg";
import door7Panel from "@/assets/images/door-7panel.jpg";
import doorDx30 from "@/assets/images/door-dx30.jpg";
import door4PanelShaker from "@/assets/images/door-4panel-shaker.jpg";
import doorRusticEdwardian from "@/assets/images/door-rustic-edwardian.jpg";

const DOOR_IMAGES: Record<DoorStyle, string> = {
  mexicano: doorMexicano,
  iseo: doorIseo,
  aston: doorAston,
  "7-panel": door7Panel,
  dx30: doorDx30,
  "4-panel-shaker": door4PanelShaker,
  "rustic-edwardian": doorRusticEdwardian,
};

const HANDLE_MODEL_LABELS: Record<string, string> = {
  morley: "Morley",
  shellaston: "Chellaston",
};

const HANDLE_FINISH_LABELS: Record<string, string> = {
  "satin-nickel": "Satin Nickel",
  "matt-black": "Matt Black",
  "polished-brass": "Polished Brass",
};

interface PaymentProps {
  depositAmount: number;
  grandTotal: number;
  customerEmail: string;
  customerName: string;
  customerMobile: string;
  customerPostcode: string;
  customerAddress: string;
  fittingDate: string;
  fittingDateISO: string;
  fittingEndDateISO?: string;
  doorStyle: string;
  doorStyleKey: DoorStyle | null;
  totalDoors: number;
  bathroomLocks: number;
  handleModel: string;
  handleFinish: string;
  doorSizes: DoorSizeEntry[];
  doorSizesFormatted: string;
  onBack: () => void;
  onPaymentSuccess: () => void;
}

function getDoorLineLabel(entry: DoorSizeEntry): string {
  if (entry.isDoubleDoor) {
    const typeStr = entry.doubleDoorType === "french_set"
      ? "French Door Set"
      : "Standard Door Pair";
    const widthMm = entry.doubleDoorWidthMm || entry.widthMm;
    const extras: string[] = [];
    if (entry.wantsPairMaker) extras.push("Pair Maker");
    if (entry.isRebated) extras.push("Rack Bolt");
    const extrasStr = extras.length > 0 ? ` + ${extras.join(" + ")}` : "";
    return `${entry.room} — ${widthMm}mm ${typeStr}${extrasStr}`;
  }
  const typeLabel = entry.isFireDoor
    ? "Fire Door"
    : entry.isGlazedDoor
    ? "Glazed"
    : "Standard";
  return `${entry.room} — ${entry.widthMm}mm ${typeLabel}`;
}

export function Payment({
  depositAmount,
  grandTotal,
  customerEmail,
  customerName,
  customerMobile,
  customerPostcode,
  customerAddress,
  fittingDate,
  fittingDateISO,
  fittingEndDateISO,
  doorStyle,
  doorStyleKey,
  totalDoors,
  bathroomLocks,
  handleModel,
  handleFinish,
  doorSizes,
  doorSizesFormatted,
  onBack,
  onPaymentSuccess,
}: PaymentProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const createCheckoutSession = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/create-checkout-session", {
        depositAmount,
        customerEmail,
        customerName,
        customerMobile,
        customerPostcode,
        customerAddress,
        fittingDate,
        fittingDateISO,
        fittingEndDateISO: fittingEndDateISO || "",
        doorSizesFormatted,
        quoteDetails: {
          totalDoors,
          doorStyle,
          grandTotal,
          bathroomLocks,
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        setIsRedirecting(true);
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error("Payment error:", error);
    },
  });

  const handlePayDeposit = () => {
    createCheckoutSession.mutate();
  };

  const doorImage = doorStyleKey ? DOOR_IMAGES[doorStyleKey] : null;
  const balanceDue = grandTotal - depositAmount;

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-payment">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
          <CreditCard className="w-5 h-5" />
          Pay Your Deposit
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Secure your fitting date with a 50% deposit
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="bg-muted/50 rounded-md p-4 space-y-4">
          <h3 className="font-medium text-foreground">Order Summary</h3>

          {/* Door image + style */}
          {doorImage ? (
            <div className="flex items-center gap-3">
              <div className="w-20 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border" data-testid="img-door-style">
                <img
                  src={doorImage}
                  alt={doorStyle}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm capitalize">{doorStyle.replace(/-/g, " ")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{totalDoors} doors total</p>
              </div>
            </div>
          ) : (
            <div className="text-sm">
              <span className="text-muted-foreground">Door Style: </span>
              <span className="font-medium">{doorStyle}</span>
            </div>
          )}

          {/* Per-door list */}
          {doorSizes.length > 0 && (
            <div className="space-y-1" data-testid="list-door-entries">
              {doorSizes.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm"
                  data-testid={`text-door-entry-${i}`}
                >
                  <span className="text-muted-foreground mt-0.5 flex-shrink-0">•</span>
                  <span className="text-foreground">{getDoorLineLabel(entry)}</span>
                </div>
              ))}
            </div>
          )}

          <hr className="border-border" />

          {/* Handles */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Handles</span>
            <span className="font-medium" data-testid="text-handle-summary">
              {HANDLE_MODEL_LABELS[handleModel] || handleModel} — {HANDLE_FINISH_LABELS[handleFinish] || handleFinish}
            </span>
          </div>

          {/* Bathroom locks */}
          {bathroomLocks > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bathroom Lock{bathroomLocks > 1 ? "s" : ""}</span>
              <span className="font-medium" data-testid="text-bathroom-locks">{bathroomLocks}×</span>
            </div>
          )}

          {/* Fitting date */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fitting Date</span>
            <span className="font-medium">{fittingDate}</span>
          </div>

          <hr className="border-border" />

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quote Total</span>
              <span className="font-medium" data-testid="text-grand-total">£{grandTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-primary font-semibold">
              <span>Deposit Due (50%)</span>
              <span data-testid="text-deposit-due">£{depositAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Balance on Completion</span>
              <span className="font-medium text-muted-foreground" data-testid="text-balance-due">£{balanceDue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>Your payment is secured by Stripe. We never store your card details.</p>
        </div>

        {/* What's Included */}
        <div className="bg-primary/5 rounded-md p-4 space-y-2">
          <h4 className="font-medium text-foreground text-sm">What's included:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-primary" />
              Reserved fitting date: {fittingDate}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-primary" />
              All doors, handles & hardware
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-primary" />
              Professional fitting by me (Mark)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-primary" />
              Balance (£{balanceDue.toLocaleString()}) due on completion
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4 flex-shrink-0 text-primary" />
          <p>Fully insured. Balance only due when you're happy with the work.</p>
        </div>

        {/* Pay Button */}
        <Button
          onClick={handlePayDeposit}
          disabled={createCheckoutSession.isPending || isRedirecting}
          className="w-full h-12 text-base font-semibold"
          data-testid="button-pay-deposit"
        >
          {createCheckoutSession.isPending || isRedirecting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {isRedirecting ? "Redirecting to payment..." : "Creating checkout..."}
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Pay £{depositAmount.toLocaleString()} Deposit
            </>
          )}
        </Button>

        {createCheckoutSession.isError && (
          <p className="text-sm text-destructive text-center">
            There was an error creating your payment session. Please try again.
          </p>
        )}

        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="w-full"
          disabled={createCheckoutSession.isPending || isRedirecting}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-3 flex items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-medium text-foreground">Questions about your booking?</p>
            <p className="text-muted-foreground text-xs">Call or text Mark</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="tel:07854015863"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md"
              data-testid="link-call-mark-payment"
            >
              <Phone className="w-3 h-3" />
              Call
            </a>
            <a
              href="https://wa.me/447854015863"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-md"
              data-testid="link-whatsapp-payment"
            >
              <SiWhatsapp className="w-3 h-3" />
              WhatsApp
            </a>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-muted/50 rounded-md p-4 space-y-3 text-sm text-muted-foreground">
          <p>
            Unfortunately, I cannot remove the old doors. I recommend contacting your local council, who can pick them up for around £30 as a bulky waste collection. However, I can take them off and put them where you want.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
