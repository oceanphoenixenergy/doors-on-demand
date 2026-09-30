import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { QuoteWizard, type WizardState } from "@/components/QuoteWizard";
import { Loader2 } from "lucide-react";

export default function ResumeQuote() {
  const params = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery<{ wizardState: WizardState; discountPercent?: number }>({
    queryKey: ["/api/quote-drafts", params.token],
    queryFn: async () => {
      const res = await fetch(`/api/quote-drafts/${params.token}`);
      if (!res.ok) throw new Error("Quote not found");
      return res.json();
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-testid="loading-resume">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your quote...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="error-resume">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-xl font-semibold text-foreground">Quote Not Found</h1>
          <p className="text-muted-foreground">
            This quote link may have expired or is no longer available. You can start a new quote in under 60 seconds.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium"
            data-testid="link-new-quote"
          >
            Get a New Quote
          </a>
        </div>
      </div>
    );
  }

  const wizardState = data.wizardState;

  return (
    <QuoteWizard
      initialState={wizardState}
      initialStep={6}
      discountPercent={data.discountPercent || 0}
    />
  );
}
