import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProceedStepProps {
  onSubmit: (timing: string, notes: string) => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  isSubmitted: boolean;
}

function getNextWeeks(): { value: string; label: string }[] {
  const weeks: { value: string; label: string }[] = [];
  const today = new Date();
  
  // Find the next Monday
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
  
  // Start from 2 weeks out (to allow for ordering/preparation)
  for (let i = 2; i <= 7; i++) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + daysUntilMonday + (i - 1) * 7);
    
    // End on Friday (4 days after Monday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4);
    
    const startLabel = weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const endLabel = weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    
    weeks.push({
      value: `week-${i}`,
      label: `${startLabel} – ${endLabel}`,
    });
  }
  
  return weeks;
}

export function ProceedStep({ onSubmit, onBack, isSubmitting, isSubmitted }: ProceedStepProps) {
  const [timing, setTiming] = useState<string>("next-available");
  const [preferredWeek, setPreferredWeek] = useState<string>("");
  const [notes, setNotes] = useState("");

  const weeks = getNextWeeks();

  const handleSubmit = async () => {
    let timingValue = timing;
    if (timing === "preferred-week" && preferredWeek) {
      const week = weeks.find(w => w.value === preferredWeek);
      timingValue = `Preferred week: ${week?.label || preferredWeek}`;
    }
    await onSubmit(timingValue, notes);
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto" data-testid="card-proceed-confirmation">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Booking Request Received
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Thanks — we'll message you on WhatsApp to confirm the final details.
          </p>
          <p className="text-muted-foreground text-xs mt-4 italic">
            We prefer WhatsApp for quicker responses
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-proceed">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-semibold text-foreground">
          Reserve Your Slot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Preferred timing</Label>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setTiming("next-available")}
              className={cn(
                "w-full p-3 rounded-md border text-left transition-all hover-elevate",
                timing === "next-available"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
              data-testid="option-next-available"
            >
              <span className="text-sm font-medium">Next available (2–3 weeks)</span>
            </button>

            <button
              type="button"
              onClick={() => setTiming("preferred-week")}
              className={cn(
                "w-full p-3 rounded-md border text-left transition-all hover-elevate",
                timing === "preferred-week"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
              data-testid="option-preferred-week"
            >
              <span className="text-sm font-medium">Preferred week</span>
            </button>

            {timing === "preferred-week" && (
              <Select value={preferredWeek} onValueChange={setPreferredWeek}>
                <SelectTrigger className="w-full" data-testid="select-preferred-week">
                  <SelectValue placeholder="Select a week" />
                </SelectTrigger>
                <SelectContent>
                  {weeks.map((week) => (
                    <SelectItem key={week.value} value={week.value}>
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <button
              type="button"
              onClick={() => setTiming("flexible")}
              className={cn(
                "w-full p-3 rounded-md border text-left transition-all hover-elevate",
                timing === "flexible"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
              data-testid="option-flexible"
            >
              <span className="text-sm font-medium">Flexible</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            Additional notes (optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="Any special requirements or access details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none"
            rows={3}
            data-testid="input-notes"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
            disabled={isSubmitting}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="flex-1"
            disabled={isSubmitting || (timing === "preferred-week" && !preferredWeek)}
            data-testid="button-submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Request"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
