import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, CheckCircle, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import logoImage from "@assets/Doors_On_Demand_(1)_1770320734409.png";
import markPhoto from "@assets/IMG_8638_1770354575813.jpeg";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface AreaCheckProps {
  onValidPostcode: (postcode: string, distance: number) => void;
  onClaimDeal?: (postcode: string, distance: number) => void;
}

export function AreaCheck({ onValidPostcode, onClaimDeal }: AreaCheckProps) {
  const [postcode, setPostcode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [outsideArea, setOutsideArea] = useState(false);
  const isDealClickRef = useRef(false);

  const checkPostcode = useMutation({
    mutationFn: async (postcode: string) => {
      const response = await apiRequest("POST", "/api/check-postcode", { postcode });
      return response.json() as Promise<{ valid: boolean; distance?: number; message?: string }>;
    },
    onSuccess: (data) => {
      if (data.valid && data.distance !== undefined) {
        if (isDealClickRef.current && onClaimDeal) {
          onClaimDeal(postcode.toUpperCase(), data.distance);
        } else {
          onValidPostcode(postcode.toUpperCase(), data.distance);
        }
      } else {
        setOutsideArea(true);
      }
      isDealClickRef.current = false;
    },
    onError: () => {
      setError("Unable to verify postcode. Please try again.");
      isDealClickRef.current = false;
    },
  });

  const validateAndSubmit = (isDeal: boolean) => {
    setError(null);
    setOutsideArea(false);

    const cleaned = postcode.trim().toUpperCase();
    if (!cleaned || cleaned.length < 3) {
      setError("Please enter a valid postcode");
      return;
    }

    isDealClickRef.current = isDeal;
    checkPostcode.mutate(cleaned);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateAndSubmit(false);
  };

  if (outsideArea) {
    return (
      <Card className="w-full max-w-md mx-auto" data-testid="card-outside-area">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Outside Our Service Area
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Thanks — we currently fit within 25 miles of Sutton Coldfield to keep lead times at 2–3 weeks and maintain quality.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setOutsideArea(false);
              setPostcode("");
            }}
            data-testid="button-try-again"
          >
            Try a different postcode
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-area-check">
      <CardHeader className="text-center pb-2">
        <div className="h-[120px] overflow-hidden mx-auto mb-0">
          <img 
            src={logoImage} 
            alt="Doors On Demand" 
            className="h-[150px] w-auto mx-auto object-cover object-top" 
            data-testid="logo"
          />
        </div>
        <CardTitle className="text-xl font-semibold text-foreground">
          Instant Door Quote
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-full border-2 border-primary overflow-hidden">
            <img 
              src={markPhoto} 
              alt="Mark" 
              className="w-full h-full object-cover object-top"
              data-testid="img-mark" 
            />
          </div>
          <div className="space-y-3">
            <p className="text-base font-medium text-foreground">
              Hey, I'm Mark
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              I run Doors on Demand. I've been fitting oak doors across the Midlands for 15 years, and in that time I've fitted thousands of internal doors. I pride myself on doing the best job with the best materials.
            </p>
          </div>
        </div>

        {onClaimDeal && (
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-md p-4 space-y-3 border border-primary/20">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-primary uppercase tracking-wide">
                Special Offer
              </p>
            </div>
            <p className="text-2xl font-bold text-foreground text-center">
              6 Oak Doors £999
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Supplied & fitted, including handles, hinges & latches
            </p>
            <Button
              type="button"
              className="w-full bg-primary hover:bg-primary/90 text-lg py-5"
              disabled={checkPostcode.isPending}
              onClick={() => validateAndSubmit(true)}
              data-testid="button-claim-deal"
            >
              {checkPostcode.isPending && isDealClickRef.current ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Claim the 6 Door Deal
                </>
              )}
            </Button>
          </div>
        )}

        <div className="bg-primary/5 rounded-md p-4 space-y-3">
          <p className="text-sm font-medium text-foreground text-center">
            Our Latest Door Offer
          </p>
          <p className="text-lg font-bold text-primary text-center">
            From £166 per door, supplied & fitted
          </p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>FREE handles, hinges & latches with every door</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Expert fitting, no mess left behind</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Quick installation slots available this month</span>
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="postcode" className="text-sm font-medium">
              Your postcode
            </Label>
            <Input
              id="postcode"
              type="text"
              placeholder="e.g. B1 1AA"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              className="text-center text-lg uppercase"
              data-testid="input-postcode"
              autoComplete="postal-code"
            />
            {error && (
              <p className="text-destructive text-sm text-center" data-testid="text-error">
                {error}
              </p>
            )}
          </div>
          
          <Button
            type="submit"
            variant={onClaimDeal ? "outline" : "default"}
            className="w-full"
            disabled={checkPostcode.isPending}
            data-testid="button-check-area"
          >
            {checkPostcode.isPending && !isDealClickRef.current ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              "Get My Custom Quote"
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            I cover a 25-mile radius from Sutton Coldfield.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
