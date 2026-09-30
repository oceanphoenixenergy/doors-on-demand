import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, Phone } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import logoImage from "@assets/Doors_On_Demand_(1)_1770320734409.png";

export default function PaymentCancelled() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <img 
        src={logoImage} 
        alt="Doors On Demand" 
        className="h-12 w-auto mb-6" 
      />
      <Card className="w-full max-w-md" data-testid="card-payment-cancelled">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-amber-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-foreground">
            Payment Cancelled
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Your payment was not completed
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-md p-4 text-sm text-muted-foreground">
            <p>
              Don't worry - no money has been taken. You can restart your quote
              or get in touch if you need any help.
            </p>
          </div>

          <Button
            onClick={() => navigate("/")}
            className="w-full"
            data-testid="button-restart"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Start a New Quote
          </Button>

          <div className="pt-4 border-t space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              Need help? Contact us:
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.location.href = "tel:+447854015863"}
                data-testid="button-call"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open("https://wa.me/447854015863", "_blank")}
                data-testid="button-whatsapp"
              >
                <SiWhatsapp className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
