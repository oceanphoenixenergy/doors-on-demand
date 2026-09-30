import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/Doors_On_Demand_(1)_1770320734409.png";

export default function BalancePaid() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <img
        src={logoImage}
        alt="Doors On Demand"
        className="h-12 w-auto mb-6"
        data-testid="img-logo"
      />
      <Card className="w-full max-w-md" data-testid="card-balance-paid">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-foreground">
            Balance Paid
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Thank you - your final payment has been received
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-md p-4 text-sm text-muted-foreground">
            <p>
              Your balance has been settled in full. If you have any questions,
              feel free to message Mark on WhatsApp.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open("https://wa.me/447854015863", "_blank")}
            data-testid="button-whatsapp"
          >
            <SiWhatsapp className="w-4 h-4 mr-2" />
            Message Mark on WhatsApp
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
