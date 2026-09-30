import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOOR_STYLES, type DoorStyle, type DoorFinish } from "@shared/schema";

import doorMexicano from "@/assets/images/door-mexicano.jpg";
import doorMexicanoUnfinished from "@/assets/images/door-mexicano-unfinished.jpg";
import doorMexicanoPrefinished from "@/assets/images/door-mexicano-prefinished.jpg";
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

const FINISH_IMAGES: Partial<Record<DoorStyle, { unfinished?: string; prefinished?: string }>> = {
  mexicano: { unfinished: doorMexicanoUnfinished, prefinished: doorMexicanoPrefinished },
};

interface DoorRangeProps {
  initialStyle?: DoorStyle;
  initialFinish?: DoorFinish;
  onSelect: (style: DoorStyle, finish: DoorFinish) => void;
  onBack: () => void;
}

export function DoorRange({ initialStyle, initialFinish, onSelect, onBack }: DoorRangeProps) {
  const [selectedStyle, setSelectedStyle] = useState<DoorStyle | null>(initialStyle || null);
  const [showFinishStep, setShowFinishStep] = useState(false);

  const doorStyles = Object.entries(DOOR_STYLES) as [DoorStyle, typeof DOOR_STYLES[DoorStyle]][];

  const handleStyleSelect = (style: DoorStyle) => {
    const styleConfig = DOOR_STYLES[style];
    setSelectedStyle(style);
    
    if (styleConfig.finishes.length === 1) {
      onSelect(style, styleConfig.finishes[0] as DoorFinish);
    } else {
      setShowFinishStep(true);
    }
  };

  const handleFinishSelect = (finish: DoorFinish) => {
    if (selectedStyle) {
      onSelect(selectedStyle, finish);
    }
  };

  const handleBackFromFinish = () => {
    setShowFinishStep(false);
    setSelectedStyle(null);
  };

  if (showFinishStep && selectedStyle) {
    const styleConfig = DOOR_STYLES[selectedStyle];
    const finishImages = FINISH_IMAGES[selectedStyle];
    const unfinishedImage = finishImages?.unfinished || DOOR_IMAGES[selectedStyle];
    const prefinishedImage = finishImages?.prefinished || DOOR_IMAGES[selectedStyle];
    
    return (
      <Card className="w-full max-w-md mx-auto" data-testid="card-door-finish">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-semibold text-foreground">
            Choose Your Finish
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{styleConfig.name}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            type="button"
            onClick={() => handleFinishSelect("unfinished")}
            className={cn(
              "w-full p-4 rounded-md border text-left transition-all hover-elevate",
              initialFinish === "unfinished" && initialStyle === selectedStyle
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            )}
            data-testid="option-unfinished"
          >
            <div className="flex items-start gap-4">
              <div className="w-20 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={unfinishedImage}
                  alt="Unfinished door"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">Unfinished</h3>
                  {initialFinish === "unfinished" && initialStyle === selectedStyle && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Natural oak veneer, ready for your choice of finish</p>
                <p className="text-xs text-oak mt-2">Requires varnishing after fitting (not included)</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleFinishSelect("prefinished")}
            className={cn(
              "w-full p-4 rounded-md border text-left transition-all hover-elevate relative",
              initialFinish === "prefinished" && initialStyle === selectedStyle
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            )}
            data-testid="option-prefinished"
          >
            <div className="absolute -top-2 right-4">
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                Most popular
              </span>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-20 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={prefinishedImage}
                  alt="Pre-finished door"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">Pre-finished</h3>
                  {initialFinish === "prefinished" && initialStyle === selectedStyle && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Factory-applied lacquer finish, no additional work required</p>
              </div>
            </div>
          </button>

          <Button
            type="button"
            variant="outline"
            onClick={handleBackFromFinish}
            className="w-full mt-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to styles
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-door-range">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-semibold text-foreground">
          Choose Your Door Style
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {doorStyles.map(([styleKey, style]) => {
          const finishLabel = style.finishes.length === 1
            ? style.finishes[0] === "prefinished" ? "(Pre-finished only)" : "(Unfinished only)"
            : "";
          
          return (
            <button
              key={styleKey}
              type="button"
              onClick={() => handleStyleSelect(styleKey)}
              className={cn(
                "w-full p-3 rounded-md border text-left transition-all hover-elevate",
                initialStyle === styleKey
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
              data-testid={`option-style-${styleKey}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-18 flex-shrink-0 rounded overflow-hidden bg-muted">
                  <img
                    src={DOOR_IMAGES[styleKey]}
                    alt={style.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-foreground">{style.name}</h3>
                    {finishLabel && (
                      <span className="text-xs text-muted-foreground">{finishLabel}</span>
                    )}
                    {initialStyle === styleKey && (
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{style.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            </button>
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="w-full mt-4"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </CardContent>
    </Card>
  );
}
