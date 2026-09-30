import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

interface AvailableSlot {
  date: string;
  dayOfWeek: string;
  displayDate: string;
  endDate?: string;
  endDisplayDate?: string;
}

interface FittingDateProps {
  estimatedDays: number;
  onSubmit: (date: string, displayDate: string, endDate?: string) => void;
  onBack: () => void;
}

export function FittingDate({ estimatedDays, onSubmit, onBack }: FittingDateProps) {
  const { data: availableDates, isLoading, error } = useQuery<AvailableSlot[]>({
    queryKey: ["/api/available-dates", estimatedDays],
    queryFn: async () => {
      const response = await fetch(`/api/available-dates?days=${estimatedDays}`);
      if (!response.ok) throw new Error("Failed to fetch dates");
      return response.json();
    },
  });

  const handleSelectDate = (slot: AvailableSlot) => {
    onSubmit(slot.date, slot.displayDate, slot.endDate);
  };

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-fitting-date">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
          <Calendar className="w-5 h-5" />
          Choose Your Fitting Date
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Select a start date for your {estimatedDays} day{estimatedDays !== 1 ? "s" : ""} fitting
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-md p-3 text-sm text-muted-foreground">
          {estimatedDays > 1 ? (
            <p>Your job requires {estimatedDays} consecutive fitting days. Select a start date below - all required days will be reserved together.</p>
          ) : (
            <p>Available dates are shown below (Mon, Tue, Wed & Fri only). We'll confirm your booking once the deposit is paid.</p>
          )}
        </div>

        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-amber-800 dark:text-amber-200">
            <span className="font-medium">Popular dates fill up fast.</span> Slots are limited to ensure quality fitting.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8" data-testid="loading-dates">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading available dates...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-muted-foreground" data-testid="error-dates">
            <p>Unable to load available dates. Please try again.</p>
          </div>
        )}

        {availableDates && availableDates.length > 0 && (
          <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-1" data-testid="dates-list">
            {availableDates.slice(0, 20).map((slot) => (
              <Button
                key={slot.date}
                variant="outline"
                className="w-full justify-between py-3 h-auto"
                onClick={() => handleSelectDate(slot)}
                data-testid={`button-date-${slot.date}`}
              >
                <span className="font-medium">{slot.displayDate}</span>
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
              </Button>
            ))}
          </div>
        )}

        {availableDates && availableDates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No available dates found. Please contact us directly.</p>
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="w-full"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to door sizes
        </Button>
      </CardContent>
    </Card>
  );
}
