import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Shield } from "lucide-react";
import { quickDetailsSchema, type QuickDetails } from "@shared/schema";

interface YourDetailsProps {
  initialData?: Partial<QuickDetails>;
  onSubmit: (data: QuickDetails) => void;
  onBack: () => void;
}

export function YourDetails({ initialData, onSubmit, onBack }: YourDetailsProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuickDetails>({
    resolver: zodResolver(quickDetailsSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      email: initialData?.email || "",
      mobile: initialData?.mobile || "",
    },
  });

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-your-details">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-semibold text-foreground">
          Your Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium">
              First name
            </Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              {...register("firstName")}
              data-testid="input-first-name"
              autoComplete="given-name"
            />
            {errors.firstName && (
              <p className="text-destructive text-sm" data-testid="error-first-name">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register("email")}
              data-testid="input-email"
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-destructive text-sm" data-testid="error-email">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile" className="text-sm font-medium">
              Mobile number
            </Label>
            <Input
              id="mobile"
              type="tel"
              placeholder="07700 000000"
              {...register("mobile")}
              data-testid="input-mobile"
              autoComplete="tel"
            />
            {errors.mobile && (
              <p className="text-destructive text-sm" data-testid="error-mobile">
                {errors.mobile.message}
              </p>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
            <p>
              Your details will be stored securely and used only to provide your quote and follow up on your enquiry. We won't share your information with third parties.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
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
            <Button type="submit" className="flex-1" data-testid="button-continue">
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
