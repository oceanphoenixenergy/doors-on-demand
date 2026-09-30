import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Handles as HandlesType } from "@shared/schema";

import handleMorleySatin from "@/assets/images/handle-morley.jpg";
import handleMorleyBlack from "@/assets/images/handle-morley-black.jpg";
import handleMorleyBrass from "@/assets/images/handle-morley-brass.jpg";
import handleChellastonSatin from "@/assets/images/handle-chellaston.jpg";
import handleChellastonBlack from "@/assets/images/handle-chellaston-black.jpg";
import handleChellastonBrass from "@/assets/images/handle-chellaston-brass.jpg";

const HANDLE_IMAGES: Record<string, Record<string, string>> = {
  morley: {
    "satin-nickel": handleMorleySatin,
    "matt-black": handleMorleyBlack,
    "polished-brass": handleMorleyBrass,
  },
  shellaston: {
    "satin-nickel": handleChellastonSatin,
    "matt-black": handleChellastonBlack,
    "polished-brass": handleChellastonBrass,
  },
};

interface HandlesProps {
  initialData?: Partial<HandlesType>;
  onSubmit: (data: HandlesType) => void;
  onBack: () => void;
}

export function Handles({ initialData, onSubmit, onBack }: HandlesProps) {
  const [handleModel, setHandleModel] = useState<"morley" | "shellaston">(
    initialData?.handleModel || "morley"
  );
  const [handleFinish, setHandleFinish] = useState<"satin-nickel" | "matt-black" | "polished-brass">(
    initialData?.handleFinish || "satin-nickel"
  );

  const handleSubmitForm = () => {
    onSubmit({ handleModel, handleFinish });
  };

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-handles">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-semibold text-foreground">
          Choose Your Handles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Handle model</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setHandleModel("morley")}
              className={cn(
                "p-4 rounded-md border text-center transition-all hover-elevate",
                handleModel === "morley"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
              data-testid="option-morley"
            >
              <div className="w-24 h-24 rounded-md mx-auto mb-2 overflow-hidden bg-muted">
                <img
                  src={HANDLE_IMAGES.morley[handleFinish]}
                  alt="Morley handle"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm font-medium">Morley</span>
              {handleModel === "morley" && (
                <Check className="w-4 h-4 text-primary mx-auto mt-1" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setHandleModel("shellaston")}
              className={cn(
                "p-4 rounded-md border text-center transition-all hover-elevate",
                handleModel === "shellaston"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
              data-testid="option-shellaston"
            >
              <div className="w-24 h-24 rounded-md mx-auto mb-2 overflow-hidden bg-muted">
                <img
                  src={HANDLE_IMAGES.shellaston[handleFinish]}
                  alt="Chellaston handle"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm font-medium">Chellaston</span>
              {handleModel === "shellaston" && (
                <Check className="w-4 h-4 text-primary mx-auto mt-1" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Handle finish</Label>
          <RadioGroup
            value={handleFinish}
            onValueChange={(value) => setHandleFinish(value as typeof handleFinish)}
            className="space-y-2"
          >
            <label
              className={cn(
                "flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all hover-elevate",
                handleFinish === "satin-nickel"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
              data-testid="option-satin-nickel"
            >
              <RadioGroupItem value="satin-nickel" id="satin-nickel" />
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 border border-gray-400" />
              <div className="flex-1">
                <span className="text-sm font-medium">Satin Nickel</span>
                <span className="text-xs text-muted-foreground ml-2">(included)</span>
              </div>
            </label>

            <label
              className={cn(
                "flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all hover-elevate",
                handleFinish === "matt-black"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
              data-testid="option-matt-black"
            >
              <RadioGroupItem value="matt-black" id="matt-black" />
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700" />
              <div className="flex-1">
                <span className="text-sm font-medium">Matt Black</span>
                <span className="text-xs text-oak ml-2">(+£30 per door)</span>
              </div>
            </label>

            <label
              className={cn(
                "flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all hover-elevate",
                handleFinish === "polished-brass"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
              data-testid="option-polished-brass"
            >
              <RadioGroupItem value="polished-brass" id="polished-brass" />
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-600" />
              <div className="flex-1">
                <span className="text-sm font-medium">Polished Brass</span>
                <span className="text-xs text-oak ml-2">(+£30 per door)</span>
              </div>
            </label>
          </RadioGroup>
        </div>

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
            onClick={handleSubmitForm}
            className="flex-1"
            data-testid="button-continue"
          >
            See Quote
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
