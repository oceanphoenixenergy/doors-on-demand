import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Mail } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import logoImage from "@assets/Doors_On_Demand_(1)_1770320734409.png";

interface PaymentDetails {
  success: boolean;
  status: string;
  customerEmail: string;
  amountTotal: number;
  metadata: {
    customerName: string;
    fittingDate: string;
    totalDoors: string;
    doorStyle: string;
    grandTotal: string;
  };
}

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session_id");
    setSessionId(id);
  }, []);

  const { data: payment, isLoading, error } = useQuery<PaymentDetails>({
    queryKey: ["/api/verify-payment", sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/verify-payment/${sessionId}`);
      return response.json();
    },
    enabled: !!sessionId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 flex flex-col items-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verifying your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !payment?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Payment Issue</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              We couldn't verify your payment. If you believe this is an error,
              please contact us.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <img 
        src={logoImage} 
        alt="Doors On Demand" 
        className="h-12 w-auto mb-6" 
      />
      <Card className="w-full max-w-md" data-testid="card-payment-success">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground">
            Payment Successful!
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Your deposit has been received
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Booking Confirmation */}
          <div className="bg-muted/50 rounded-md p-4 space-y-3">
            <h3 className="font-medium text-foreground">Booking Confirmed</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fitting Date</span>
                <span className="font-medium">{payment.metadata?.fittingDate || "TBC"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Doors</span>
                <span className="font-medium">{payment.metadata?.totalDoors}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Door Style</span>
                <span className="font-medium">{payment.metadata?.doorStyle}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposit Paid</span>
                <span className="font-medium text-primary">£{payment.amountTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance Due on Completion</span>
                <span className="font-medium">
                  £{payment.metadata?.grandTotal 
                    ? (parseFloat(payment.metadata.grandTotal) - payment.amountTotal).toLocaleString()
                    : "TBC"}
                </span>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="space-y-3">
            <h3 className="font-medium text-foreground">What happens next?</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                You'll receive a confirmation email shortly
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-xs">Can't see it? Check your junk/spam folder</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                Mark will be in touch via email or WhatsApp to confirm everything
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                Mark will arrive on your fitting date
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                Pay the remaining balance on completion
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="pt-4 border-t space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              Questions? Get in touch:
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open("https://wa.me/447854015863", "_blank")}
              data-testid="button-whatsapp"
            >
              <SiWhatsapp className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>

          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="w-full"
            data-testid="button-home"
          >
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
