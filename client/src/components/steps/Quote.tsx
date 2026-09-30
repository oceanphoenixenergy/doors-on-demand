import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, MessageSquare, Shield, Star, AlertTriangle, Phone, CheckCircle } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { QuoteData, QuoteCalculation, DoorStyle } from "@shared/schema";
import {
  formatCurrency,
  getFullDoorLabel,
  getHandleFinishLabel,
  getHandleModelLabel,
  getGlazedStyleLabel,
} from "@/lib/quoteCalculator";

import doorMexicano from "@/assets/images/door-mexicano.jpg";
import doorIseo from "@/assets/images/door-iseo.jpg";
import doorAston from "@/assets/images/door-aston.jpg";
import door7Panel from "@/assets/images/door-7panel.jpg";
import doorDx30 from "@/assets/images/door-dx30.jpg";
import door4PanelShaker from "@/assets/images/door-4panel-shaker.jpg";
import doorRusticEdwardian from "@/assets/images/door-rustic-edwardian.jpg";

import glazedMexicano2xg from "@/assets/images/glazed-mexicano-2xg.jpg";
import glazedMexicanoFrosted from "@/assets/images/glazed-mexicano-frosted.jpg";
import glazedMexicano6l from "@/assets/images/glazed-mexicano-6l.jpg";
import glazedMexicanoPattern10 from "@/assets/images/glazed-mexicano-pattern10.jpg";
import glazedIseoClear from "@/assets/images/glazed-iseo-clear.jpg";
import glazedIseoFrosted from "@/assets/images/glazed-iseo-frosted.jpg";
import glazedIseoPattern10Clear from "@/assets/images/glazed-iseo-pattern10-clear.jpg";
import glazedIseoPattern10Frosted from "@/assets/images/glazed-iseo-pattern10-frosted.jpg";
import glazedAstonClear from "@/assets/images/glazed-aston-clear.jpg";
import glazedAstonFrosted from "@/assets/images/glazed-aston-frosted.jpg";
import glazed7panelClear from "@/assets/images/glazed-7panel-clear.jpg";
import glazed7panelFrosted from "@/assets/images/glazed-7panel-frosted.jpg";
import glazedDx30Clear from "@/assets/images/glazed-dx30-clear.jpg";
import glazedDx30Frosted from "@/assets/images/glazed-dx30-frosted.jpg";
import glazedShakerClear from "@/assets/images/glazed-shaker-clear.jpg";
import glazedShakerFrosted from "@/assets/images/glazed-shaker-frosted.jpg";
import glazedEdwardianClear from "@/assets/images/glazed-edwardian-clear.jpg";

const DOOR_IMAGES: Record<DoorStyle, string> = {
  mexicano: doorMexicano,
  iseo: doorIseo,
  aston: doorAston,
  "7-panel": door7Panel,
  dx30: doorDx30,
  "4-panel-shaker": door4PanelShaker,
  "rustic-edwardian": doorRusticEdwardian,
};

const GLAZED_IMAGES: Record<string, Record<string, string>> = {
  mexicano: {
    "2xg": glazedMexicano2xg,
    "frosted": glazedMexicanoFrosted,
    "6l": glazedMexicano6l,
    "pattern10": glazedMexicanoPattern10,
  },
  iseo: {
    "clear": glazedIseoClear,
    "frosted": glazedIseoFrosted,
    "pattern10-clear": glazedIseoPattern10Clear,
    "pattern10-frosted": glazedIseoPattern10Frosted,
  },
  aston: {
    "clear": glazedAstonClear,
    "frosted": glazedAstonFrosted,
  },
  "7-panel": {
    "clear": glazed7panelClear,
    "frosted": glazed7panelFrosted,
  },
  dx30: {
    "clear": glazedDx30Clear,
    "frosted": glazedDx30Frosted,
  },
  "4-panel-shaker": {
    "clear": glazedShakerClear,
    "frosted": glazedShakerFrosted,
  },
  "rustic-edwardian": {
    "clear": glazedEdwardianClear,
  },
};

interface QuoteProps {
  data: QuoteData;
  calculation: QuoteCalculation;
  onProceed: () => void;
  onAskQuestion: () => void;
  onBack: () => void;
}

export function Quote({ data, calculation, onProceed, onAskQuestion, onBack }: QuoteProps) {
  const glazedImage = data.glazedDoors > 0 && data.glazedStyle 
    ? GLAZED_IMAGES[data.doorStyle]?.[data.glazedStyle] 
    : null;
  
  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-quote">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-semibold text-foreground">
          Your Quote
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center gap-4 pb-4 border-b border-border">
          <div className="flex flex-col items-center gap-2">
            <div className="w-28 h-40 rounded-lg overflow-hidden bg-muted shadow-md flex items-center justify-center">
              <img
                src={DOOR_IMAGES[data.doorStyle]}
                alt={getFullDoorLabel(data.doorStyle, data.doorFinish)}
                className="max-w-full max-h-full object-contain"
                data-testid="img-selected-door"
              />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground text-sm" data-testid="text-door-style">
                {getFullDoorLabel(data.doorStyle, data.doorFinish)}
              </h3>
              <p className="text-xs text-muted-foreground">Standard door</p>
            </div>
          </div>
          
          {glazedImage && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-28 h-40 rounded-lg overflow-hidden bg-muted shadow-md flex items-center justify-center">
                <img
                  src={glazedImage}
                  alt={`${getFullDoorLabel(data.doorStyle, data.doorFinish)} - ${getGlazedStyleLabel(data.doorStyle, data.glazedStyle)}`}
                  className="max-w-full max-h-full object-contain"
                  data-testid="img-glazed-door"
                />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-foreground text-sm">
                  {getGlazedStyleLabel(data.doorStyle, data.glazedStyle)}
                </h3>
                <p className="text-xs text-muted-foreground">Glazed door</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Total doors</span>
            <span className="font-medium" data-testid="text-total-doors">{data.totalDoors}</span>
          </div>
          
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Standard doors</span>
            <span className="font-medium" data-testid="text-standard-doors">{calculation.standardDoors}</span>
          </div>
          
          {data.fireDoors > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Fire doors</span>
              <span className="font-medium" data-testid="text-fire-doors">{data.fireDoors}</span>
            </div>
          )}
          
          {data.glazedDoors > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Glazed doors ({getGlazedStyleLabel(data.doorStyle, data.glazedStyle)})</span>
              <span className="font-medium" data-testid="text-glazed-doors">{data.glazedDoors}</span>
            </div>
          )}

          {data.doubleDoorSets > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Double door sets</span>
              <span className="font-medium" data-testid="text-double-doors">{data.doubleDoorSets}</span>
            </div>
          )}

          {data.doubleDoorSets > 0 && calculation.doubleDoorTotal > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Double doors total</span>
              <span className="font-medium" data-testid="text-double-door-total">{formatCurrency(calculation.doubleDoorTotal)}</span>
            </div>
          )}
          
          {data.bathroomLocks > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Bathroom locks</span>
              <span className="font-medium" data-testid="text-bathroom-locks">{data.bathroomLocks}</span>
            </div>
          )}
          
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Handles</span>
            <span className="font-medium" data-testid="text-handles">
              {getHandleModelLabel(data.handleModel)} - {getHandleFinishLabel(data.handleFinish)}
            </span>
          </div>
          
          <div className="flex justify-between py-1 border-t border-border pt-2 mt-2">
            <span className="text-muted-foreground">Premium latches & ball bearing hinges</span>
            <span className="font-medium text-green-600" data-testid="text-hardware-included">Included</span>
          </div>
        </div>

        <div className="bg-muted/50 rounded-md p-3 space-y-1 text-sm">
          <p className="font-medium text-foreground text-xs uppercase tracking-wide">What's included per door:</p>
          <div className="grid grid-cols-2 gap-1 text-muted-foreground text-xs">
            <span>Premium oak door</span>
            <span>Expert fitting</span>
            <span>Ball bearing hinges</span>
            <span>Premium latch</span>
            <span>Handle</span>
            <span>All waste removed</span>
          </div>
        </div>

        <div className="bg-primary/5 rounded-md p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-foreground">Grand Total</span>
            <span className="text-xl font-bold text-primary" data-testid="text-grand-total">
              {formatCurrency(calculation.grandTotal)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Deposit required to secure booking: 50%</span>
            <span className="text-sm font-medium" data-testid="text-deposit">
              {formatCurrency(calculation.depositDue)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Lead time: 2–3 weeks</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span data-testid="text-estimated-days">
              {calculation.estimatedDays} day{calculation.estimatedDays !== 1 ? "s" : ""} fitting
            </span>
          </div>
        </div>

        <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Limited fitting slots available — book early to secure your preferred date
        </p>

        <div className="space-y-3">
          <div className="bg-muted/50 rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-medium text-foreground">Fully insured & guaranteed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">50% deposit secures your fitting slot</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">Balance only due on completion day</span>
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-md p-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-foreground font-medium">"Brilliant job, can't believe the difference!"</p>
                <p className="text-xs text-muted-foreground mt-1">— Sarah T, Solihull | 6 doors fitted</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onProceed}
            className="w-full"
            data-testid="button-proceed"
          >
            Ready to transform your home?
          </Button>
          <Button
            variant="outline"
            onClick={onAskQuestion}
            className="w-full"
            data-testid="button-ask-question"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Have a question first?
          </Button>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-3 flex items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-medium text-foreground">Need help deciding?</p>
            <p className="text-muted-foreground text-xs">Call or text Mark directly</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="tel:07854015863"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md"
              data-testid="link-call-mark"
            >
              <Phone className="w-3 h-3" />
              Call
            </a>
            <a
              href="https://wa.me/447854015863"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-md"
              data-testid="link-whatsapp-quote"
            >
              <SiWhatsapp className="w-3 h-3" />
              WhatsApp
            </a>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="w-full"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Edit selections
        </Button>
      </CardContent>
    </Card>
  );
}
