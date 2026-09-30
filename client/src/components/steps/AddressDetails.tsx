import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { addressDetailsSchema, type AddressDetails as AddressDetailsType } from "@shared/schema";

interface AddressDetailsProps {
  initialData?: Partial<AddressDetailsType>;
  onSubmit: (data: AddressDetailsType) => void;
  onBack: () => void;
}

export function AddressDetails({ initialData, onSubmit, onBack }: AddressDetailsProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressDetailsType>({
    resolver: zodResolver(addressDetailsSchema),
    defaultValues: {
      lastName: initialData?.lastName || "",
      addressLine1: initialData?.addressLine1 || "",
      addressLine2: initialData?.addressLine2 || "",
      city: initialData?.city || "",
    },
  });

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-address-details">
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          <MapPin className="w-5 h-5 text-primary" />
          <CardTitle className="text-xl font-semibold text-foreground">
            Where are we fitting?
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium">
              Last name
            </Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Smith"
              {...register("lastName")}
              data-testid="input-last-name"
              autoComplete="family-name"
            />
            {errors.lastName && (
              <p className="text-destructive text-sm" data-testid="error-last-name">
                {errors.lastName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine1" className="text-sm font-medium">
              Address
            </Label>
            <Input
              id="addressLine1"
              type="text"
              placeholder="House number and street"
              {...register("addressLine1")}
              data-testid="input-address-line1"
              autoComplete="address-line1"
            />
            {errors.addressLine1 && (
              <p className="text-destructive text-sm" data-testid="error-address-line1">
                {errors.addressLine1.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine2" className="text-sm font-medium">
              Address line 2 <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="addressLine2"
              type="text"
              placeholder="Flat, apartment, etc."
              {...register("addressLine2")}
              data-testid="input-address-line2"
              autoComplete="address-line2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium">
              Town / City
            </Label>
            <Input
              id="city"
              type="text"
              placeholder="Birmingham"
              {...register("city")}
              data-testid="input-city"
              autoComplete="address-level2"
            />
            {errors.city && (
              <p className="text-destructive text-sm" data-testid="error-city">
                {errors.city.message}
              </p>
            )}
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
