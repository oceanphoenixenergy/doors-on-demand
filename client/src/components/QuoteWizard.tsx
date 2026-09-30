import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ProgressBar } from "./ProgressBar";
import { OfferProgressBar } from "./OfferProgressBar";
import { Footer } from "./Footer";
import { AreaCheck } from "./steps/AreaCheck";
import { YourDetails } from "./steps/YourDetails";
import { AddressDetails } from "./steps/AddressDetails";
import { DoorRange } from "./steps/DoorRange";
import { Quantities } from "./steps/Quantities";
import { DealCustomization } from "./steps/DealCustomization";
import { Handles } from "./steps/Handles";
import { Quote } from "./steps/Quote";
import { DoorSizes } from "./steps/DoorSizes";
import { FittingDate } from "./steps/FittingDate";
import { Payment } from "./steps/Payment";
import { AskQuestion } from "./steps/AskQuestion";
import { calculateQuote } from "@/lib/quoteCalculator";
import type {
  QuoteData,
  QuoteCalculation,
  QuickDetails,
  AddressDetails as AddressDetailsType,
  DoorStyle,
  DoorFinish,
  Handles as HandlesType,
  DoorSizeEntry,
} from "@shared/schema";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type Intent = "proceed" | "question" | null;

const DEAL_PRICE = 999;
const DEAL_DOORS = 6;
const BATHROOM_LOCK_PRICE = 50;
const HANDLE_UPGRADE_PRICE = 30;

export interface WizardState {
  postcode: string;
  distanceMiles: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  doorStyle: DoorStyle | null;
  doorFinish: DoorFinish | null;
  totalDoors: number;
  glazedDoors: number;
  glazedStyle: string | null;
  fireDoors: number;
  doubleDoorSets: number;
  bathroomLocks: number;
  handleModel: string;
  handleFinish: string;
  doorSizes: DoorSizeEntry[];
  hasMetricDoors: boolean;
  selectedFittingDate: string;
  selectedFittingDateDisplay: string;
  selectedFittingEndDate: string;
  grandTotalOverride?: number;
  depositDueOverride?: number;
}

const DEFAULT_STATE: WizardState = {
  postcode: "",
  distanceMiles: 0,
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  doorStyle: null,
  doorFinish: null,
  totalDoors: 3,
  glazedDoors: 0,
  glazedStyle: null,
  fireDoors: 0,
  doubleDoorSets: 0,
  bathroomLocks: 0,
  handleModel: "morley",
  handleFinish: "satin-nickel",
  doorSizes: [],
  hasMetricDoors: false,
  selectedFittingDate: "",
  selectedFittingDateDisplay: "",
  selectedFittingEndDate: "",
};

interface QuoteWizardProps {
  initialState?: Partial<WizardState>;
  initialStep?: Step;
  discountPercent?: number;
}

const DEAL_STEP_MAP: Record<number, number> = {
  1: 1, 2: 2, 3: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 9,
};

const WIZARD_STEP_NAMES: Record<number, string> = {
  2: "Details",
  3: "Door Style",
  4: "Quantities",
  5: "Handles",
  6: "Quote & Proceed",
  7: "Door Sizes",
  8: "Fitting Date",
  9: "Address",
  10: "Payment page",
};

export function QuoteWizard({ initialState, initialStep, discountPercent = 0 }: QuoteWizardProps = {}) {
  const [step, setStep] = useState<Step>(initialStep || 1);
  const [intent, setIntent] = useState<Intent>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDealMode, setIsDealMode] = useState(false);
  const [isUpgraded, setIsUpgraded] = useState(false);
  const [quoteId, setQuoteId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);
  
  const [state, setState] = useState<WizardState>({
    ...DEFAULT_STATE,
    ...initialState,
  });

  const getDealTotal = (): number => {
    const locksTotal = state.bathroomLocks * BATHROOM_LOCK_PRICE;
    const hasHandleUpgrade = state.handleFinish === "matt-black" || state.handleFinish === "polished-brass";
    const handleTotal = hasHandleUpgrade ? DEAL_DOORS * HANDLE_UPGRADE_PRICE : 0;
    return DEAL_PRICE + locksTotal + handleTotal;
  };

  const submitQuote = useMutation({
    mutationFn: async (data: {
      intent: string;
      preferredTiming?: string;
      notes?: string;
      question?: string;
    }) => {
      const quoteData = getQuoteData();
      const rawCalc = calculateQuote(quoteData);
      let calculation = rawCalc;

      if (isDealMode && !isUpgraded) {
        const dealTotal = getDealTotal();
        calculation = {
          ...rawCalc,
          grandTotal: dealTotal,
          depositDue: dealTotal / 2,
        };
      } else if (state.grandTotalOverride !== undefined && state.grandTotalOverride > 0) {
        calculation = {
          ...rawCalc,
          grandTotal: state.grandTotalOverride,
          depositDue: state.depositDueOverride ?? Math.ceil(state.grandTotalOverride / 2),
        };
      } else if (discountPercent > 0) {
        calculation = {
          ...rawCalc,
          grandTotal: Math.round(rawCalc.grandTotal * (1 - discountPercent / 100)),
          depositDue: Math.ceil(Math.round(rawCalc.grandTotal * (1 - discountPercent / 100)) / 2),
        };
      }
      
      const doorSizesFormatted = state.doorSizes.map((entry) => {
        if (entry.isDoubleDoor) {
          const typeStr = entry.doubleDoorType === 'french_set' ? 'French Door Set' : 'Double Door Pair';
          const extras = [];
          if (entry.wantsPairMaker) extras.push('Pair Maker');
          if (entry.isRebated) extras.push('Rebated');
          const extrasStr = extras.length > 0 ? ` [${extras.join(', ')}]` : '';
          return `${entry.room} (${typeStr}): ${entry.doubleDoorWidthMm || entry.widthMm}mm${extrasStr}`;
        }
        const typeLabel = entry.isFireDoor ? " (Fire Door)" : entry.isGlazedDoor ? " (Glazed)" : "";
        return `${entry.room}${typeLabel}: ${entry.widthMm}mm`;
      }).join(", ");

      const dealNote = isDealMode ? `Facebook Ad Deal (6 Mexicano ${isUpgraded ? "Pre-finished" : "Unfinished"}). ` : "";
      
      const payload = {
        firstName: state.firstName,
        lastName: state.lastName || "",
        email: state.email,
        mobile: state.mobile,
        postcode: state.postcode,
        addressLine1: state.addressLine1 || "",
        addressLine2: state.addressLine2 || "",
        city: state.city || "",
        distanceMiles: state.distanceMiles,
        doorStyle: state.doorStyle,
        doorFinish: state.doorFinish,
        totalDoors: state.totalDoors,
        glazedDoors: state.glazedDoors,
        glazedStyle: state.glazedStyle,
        fireDoors: state.fireDoors,
        bathroomLocks: state.bathroomLocks,
        handleModel: state.handleModel,
        handleFinish: state.handleFinish,
        grandTotal: calculation.grandTotal,
        depositDue: calculation.depositDue,
        estimatedDays: rawCalc.estimatedDays,
        intent: data.intent,
        preferredTiming: state.selectedFittingDateDisplay || data.preferredTiming || null,
        notes: `${dealNote}Door sizes: ${doorSizesFormatted}${state.hasMetricDoors ? " (METRIC DOORS DETECTED - quote may differ)" : ""}${data.notes ? ". Additional notes: " + data.notes : ""}`,
        question: data.question || null,
      };
      
      const response = await apiRequest("POST", "/api/quotes", payload);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
  });

  const getQuoteData = (): QuoteData => ({
    postcode: state.postcode,
    distanceMiles: state.distanceMiles,
    firstName: state.firstName,
    lastName: state.lastName,
    email: state.email,
    mobile: state.mobile,
    doorStyle: state.doorStyle!,
    doorFinish: state.doorFinish!,
    totalDoors: state.totalDoors,
    glazedDoors: state.glazedDoors,
    glazedStyle: state.glazedStyle,
    fireDoors: state.fireDoors,
    doubleDoorSets: state.doubleDoorSets,
    bathroomLocks: state.bathroomLocks,
    handleModel: state.handleModel,
    handleFinish: state.handleFinish,
    doorSizes: state.doorSizes,
  });

  const getCalculation = (): QuoteCalculation | null => {
    if (!state.doorStyle || !state.doorFinish) return null;
    const calc = calculateQuote(getQuoteData());

    if (isDealMode && !isUpgraded) {
      const dealTotal = getDealTotal();
      return {
        ...calc,
        grandTotal: dealTotal,
        depositDue: dealTotal / 2,
      };
    }

    if (state.grandTotalOverride !== undefined && state.grandTotalOverride > 0) {
      return {
        ...calc,
        grandTotal: state.grandTotalOverride,
        depositDue: state.depositDueOverride ?? Math.ceil(state.grandTotalOverride / 2),
      };
    }
    if (discountPercent > 0) {
      const discountedTotal = Math.round(calc.grandTotal * (1 - discountPercent / 100));
      return {
        ...calc,
        grandTotal: discountedTotal,
        depositDue: Math.ceil(discountedTotal / 2),
      };
    }
    return calc;
  };

  const handleAreaValid = (postcode: string, distance: number) => {
    setIsDealMode(false);
    setIsUpgraded(false);
    setState((prev) => ({
      ...prev,
      postcode,
      distanceMiles: distance,
      doorStyle: null,
      doorFinish: null,
      totalDoors: 3,
      glazedDoors: 0,
      fireDoors: 0,
    }));
    setStep(2);
  };

  const handleClaimDeal = (postcode: string, distance: number) => {
    setIsDealMode(true);
    setState((prev) => ({
      ...prev,
      postcode,
      distanceMiles: distance,
      doorStyle: "mexicano",
      doorFinish: "unfinished",
      totalDoors: DEAL_DOORS,
      glazedDoors: 0,
      fireDoors: 0,
    }));
    setStep(2);
  };

  const trackFunnelStage = (email: string, stage: string) => {
    apiRequest("POST", "/api/funnel-stage", { email, stage })
      .catch((err) => console.error("Failed to track funnel stage:", err));
  };

  const trackWizardStep = (id: string | null, stepNum: number) => {
    const stepName = WIZARD_STEP_NAMES[stepNum];
    if (!id || !stepName) return;
    apiRequest("PATCH", `/api/quotes/${id}/step`, { step: stepName })
      .catch((err) => console.error("Failed to track wizard step:", err));
  };

  const handleDetails = (data: QuickDetails) => {
    setState((prev) => ({ ...prev, ...data }));
    const leadPayload: Record<string, unknown> = {
      firstName: data.firstName,
      email: data.email,
      mobile: data.mobile,
      postcode: state.postcode,
      distanceMiles: state.distanceMiles,
    };
    if (isDealMode) {
      leadPayload.leadSource = "meta_ad";
      leadPayload.tags = ["meta_offer"];
    }
    apiRequest("POST", "/api/leads", leadPayload)
      .then((res) => res.json())
      .then((result: { id?: string }) => {
        if (result.id) {
          setQuoteId(result.id);
          trackWizardStep(result.id, 3);
        }
      })
      .catch((err) => console.error("Failed to save lead:", err));
    setStep(3);
  };

  const handleDoorSelection = (style: DoorStyle, finish: DoorFinish) => {
    setState((prev) => ({ ...prev, doorStyle: style, doorFinish: finish }));
    if (state.email) trackFunnelStage(state.email, "door_range");
    trackWizardStep(quoteId, 4);
    setStep(4);
  };

  const handleDealCustomization = (data: { isUpgraded: boolean; bathroomLocks: number }) => {
    setIsUpgraded(data.isUpgraded);
    setState((prev) => ({
      ...prev,
      doorFinish: data.isUpgraded ? "prefinished" : "unfinished",
      bathroomLocks: data.bathroomLocks,
    }));
    if (state.email) trackFunnelStage(state.email, "quantities");
    trackWizardStep(quoteId, 5);
    setStep(5);
  };

  const handleQuantities = (data: {
    totalDoors: number;
    glazedDoors: number;
    glazedStyle: string | null;
    fireDoors: number;
    doubleDoorSets: number;
    bathroomLocks: number;
  }) => {
    setState((prev) => ({ ...prev, ...data }));
    if (state.email) trackFunnelStage(state.email, "quantities");
    trackWizardStep(quoteId, 5);
    setStep(5);
  };

  const handleHandles = async (data: HandlesType) => {
    const updatedState = {
      ...state,
      handleModel: data.handleModel,
      handleFinish: data.handleFinish,
    };
    setState(updatedState);
    
    const quoteData = {
      postcode: updatedState.postcode,
      distanceMiles: updatedState.distanceMiles,
      firstName: updatedState.firstName,
      lastName: updatedState.lastName || "",
      email: updatedState.email,
      mobile: updatedState.mobile,
      doorStyle: updatedState.doorStyle!,
      doorFinish: updatedState.doorFinish!,
      totalDoors: updatedState.totalDoors,
      glazedDoors: updatedState.glazedDoors,
      glazedStyle: updatedState.glazedStyle,
      fireDoors: updatedState.fireDoors,
      doubleDoorSets: updatedState.doubleDoorSets,
      bathroomLocks: updatedState.bathroomLocks,
      handleModel: data.handleModel,
      handleFinish: data.handleFinish,
      doorSizes: updatedState.doorSizes,
    };
    let calculation = calculateQuote(quoteData);

    if (isDealMode && !isUpgraded) {
      const locksTotal = updatedState.bathroomLocks * BATHROOM_LOCK_PRICE;
      const hasHandleUpgrade = data.handleFinish === "matt-black" || data.handleFinish === "polished-brass";
      const handleTotal = hasHandleUpgrade ? DEAL_DOORS * HANDLE_UPGRADE_PRICE : 0;
      const dealTotal = DEAL_PRICE + locksTotal + handleTotal;
      calculation = { ...calculation, grandTotal: dealTotal, depositDue: dealTotal / 2 };
    }
    
    const wizardState = {
      ...updatedState,
      doorStyle: updatedState.doorStyle!,
      doorFinish: updatedState.doorFinish!,
    };
    apiRequest("POST", "/api/quote-preview", {
      ...quoteData,
      grandTotal: calculation.grandTotal,
      deposit: calculation.depositDue,
      wizardState,
    })
      .then((res) => res.json())
      .then((result: { quoteId?: string }) => {
        if (result.quoteId && !quoteId) {
          setQuoteId(result.quoteId);
          trackWizardStep(result.quoteId, 6);
        } else {
          trackWizardStep(quoteId, 6);
        }
      })
      .catch((err) => console.error("Failed to send preview notification:", err));
    
    if (state.email) trackFunnelStage(state.email, "handles");
    setStep(6);
  };

  const handleProceed = () => {
    setIntent("proceed");
    if (state.email) trackFunnelStage(state.email, "quote_viewed");
    trackWizardStep(quoteId, 7);
    setStep(7);
  };

  const handleAskQuestion = () => {
    setIntent("question");
    if (state.email) trackFunnelStage(state.email, "asked_question");
    setStep(10);
  };

  const handleDoorSizes = (doorSizes: DoorSizeEntry[], isMetric: boolean) => {
    setState((prev) => ({ ...prev, doorSizes, hasMetricDoors: isMetric }));
    if (state.email) trackFunnelStage(state.email, "sizes_completed");
    trackWizardStep(quoteId, 8);
    setStep(8);
  };

  const handleFittingDate = (date: string, displayDate: string, endDate?: string) => {
    setState((prev) => ({ 
      ...prev, 
      selectedFittingDate: date, 
      selectedFittingDateDisplay: displayDate,
      selectedFittingEndDate: endDate || "",
    }));
    if (state.email) trackFunnelStage(state.email, "date_selected");
    trackWizardStep(quoteId, 9);
    setStep(9);
  };

  const handleAddressDetails = (data: AddressDetailsType) => {
    setState((prev) => ({ ...prev, ...data }));
    if (state.email) trackFunnelStage(state.email, "address_completed");
    trackWizardStep(quoteId, 10);
    setStep(10);
  };

  const handlePaymentSuccess = async () => {
    if (state.email) trackFunnelStage(state.email, "deposit_paid");
    trackWizardStep(quoteId, 10);
    await submitQuote.mutateAsync({
      intent: "proceed",
      preferredTiming: state.selectedFittingDateDisplay,
      notes: "Deposit paid via Stripe",
    });
  };

  const handleQuestionSubmit = async (question: string, notes: string) => {
    await submitQuote.mutateAsync({
      intent: "question",
      question,
      notes,
    });
  };

  const goBack = (targetStep: Step) => {
    setStep(targetStep);
    if (targetStep <= 6) {
      setIntent(null);
    }
    setIsSubmitted(false);
  };

  const calculation = getCalculation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {isDealMode ? (
        <OfferProgressBar currentStep={DEAL_STEP_MAP[step] || step} />
      ) : (
        <ProgressBar currentStep={step} />
      )}
      
      <main className="flex-1 flex items-start justify-center p-4 pt-8">
        {step === 1 && (
          <AreaCheck
            onValidPostcode={handleAreaValid}
            onClaimDeal={handleClaimDeal}
          />
        )}
        
        {step === 2 && (
          <YourDetails
            initialData={{
              firstName: state.firstName,
              email: state.email,
              mobile: state.mobile,
            }}
            onSubmit={handleDetails}
            onBack={() => goBack(1)}
          />
        )}
        
        {step === 3 && !isDealMode && (
          <DoorRange
            initialStyle={state.doorStyle || undefined}
            initialFinish={state.doorFinish || undefined}
            onSelect={handleDoorSelection}
            onBack={() => goBack(2)}
          />
        )}

        {step === 3 && isDealMode && (
          <DealCustomization
            initialData={{
              isUpgraded,
              bathroomLocks: state.bathroomLocks,
            }}
            onSubmit={handleDealCustomization}
            onBack={() => goBack(2)}
          />
        )}
        
        {step === 4 && !isDealMode && (
          <Quantities
            initialData={{
              totalDoors: state.totalDoors,
              glazedDoors: state.glazedDoors,
              glazedStyle: state.glazedStyle,
              fireDoors: state.fireDoors,
              doubleDoorSets: state.doubleDoorSets,
              bathroomLocks: state.bathroomLocks,
            }}
            doorStyle={state.doorStyle!}
            onSubmit={handleQuantities}
            onBack={() => goBack(3)}
          />
        )}
        
        {step === 5 && (
          <Handles
            initialData={{
              handleModel: state.handleModel as "morley" | "shellaston",
              handleFinish: state.handleFinish as "satin-nickel" | "matt-black" | "polished-brass",
            }}
            onSubmit={handleHandles}
            onBack={() => goBack(isDealMode ? 3 : 4)}
          />
        )}
        
        {step === 6 && calculation && (
          <Quote
            data={getQuoteData()}
            calculation={calculation}
            onProceed={handleProceed}
            onAskQuestion={handleAskQuestion}
            onBack={() => goBack(5)}
          />
        )}
        
        {step === 7 && calculation && (
          <DoorSizes
            totalDoors={state.totalDoors}
            fireDoors={state.fireDoors}
            glazedDoors={state.glazedDoors}
            doubleDoorSets={state.doubleDoorSets}
            doorFinish={state.doorFinish!}
            onSubmit={handleDoorSizes}
            onBack={() => goBack(6)}
          />
        )}
        
        {step === 8 && calculation && (
          <FittingDate
            estimatedDays={calculation.estimatedDays}
            onSubmit={handleFittingDate}
            onBack={() => goBack(7)}
          />
        )}

        {step === 9 && intent === "proceed" && (
          <AddressDetails
            initialData={{
              lastName: state.lastName,
              addressLine1: state.addressLine1,
              addressLine2: state.addressLine2,
              city: state.city,
            }}
            onSubmit={handleAddressDetails}
            onBack={() => goBack(8)}
          />
        )}
        
        {step === 10 && intent === "proceed" && calculation && (
          <Payment
            depositAmount={calculation.depositDue}
            grandTotal={calculation.grandTotal}
            customerEmail={state.email}
            customerName={`${state.firstName} ${state.lastName}`}
            customerMobile={state.mobile}
            customerPostcode={state.postcode}
            customerAddress={[state.addressLine1, state.addressLine2, state.city, state.postcode].filter(Boolean).join(", ")}
            fittingDate={state.selectedFittingDateDisplay}
            fittingDateISO={state.selectedFittingDate}
            fittingEndDateISO={state.selectedFittingEndDate || undefined}
            doorStyle={`${state.doorStyle} ${state.doorFinish}`}
            doorStyleKey={state.doorStyle}
            totalDoors={state.totalDoors}
            bathroomLocks={state.bathroomLocks || 0}
            handleModel={state.handleModel}
            handleFinish={state.handleFinish}
            doorSizes={state.doorSizes}
            doorSizesFormatted={state.doorSizes.map((entry) => {
              if (entry.isDoubleDoor) {
                const typeStr = entry.doubleDoorType === 'french_set' 
                  ? 'French Door Set' 
                  : 'Double Door Pair';
                const extras = [];
                if (entry.wantsPairMaker) extras.push('Pair Maker');
                if (entry.isRebated) extras.push('Rebated');
                const extrasStr = extras.length > 0 ? ` [${extras.join(', ')}]` : '';
                return `${entry.room}: ${entry.doubleDoorWidthMm || entry.widthMm}mm (${typeStr})${extrasStr}`;
              }
              const typeLabel = entry.isFireDoor ? " (Fire Door)" : entry.isGlazedDoor ? " (Glazed)" : " (Standard)";
              return `${entry.room}: ${entry.widthMm}mm${typeLabel}`;
            }).join(" | ")}
            onBack={() => goBack(9)}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
        
        {step === 10 && intent === "question" && (
          <AskQuestion
            onSubmit={handleQuestionSubmit}
            onBack={() => goBack(6)}
            isSubmitting={submitQuote.isPending}
            isSubmitted={isSubmitted}
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
}
