import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Minus, Plus, Info, Check } from "lucide-react";
import { z } from "zod";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GLAZED_OPTIONS, DOOR_STYLES, type DoorStyle } from "@shared/schema";
import { cn } from "@/lib/utils";

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

interface QuantitiesData {
  totalDoors: number;
  glazedDoors: number;
  glazedStyle: string | null;
  fireDoors: number;
  doubleDoorSets: number;
  bathroomLocks: number;
}

interface QuantitiesProps {
  initialData?: Partial<QuantitiesData>;
  doorStyle: DoorStyle;
  onSubmit: (data: QuantitiesData) => void;
  onBack: () => void;
}

function NumberInput({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
  description,
  infoTooltip,
  testId,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  description?: string;
  infoTooltip?: string;
  testId: string;
}) {
  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Label className="text-sm font-medium">{label}</Label>
          {infoTooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground transition-colors" data-testid={`${testId}-info`}>
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-left">
                <p className="text-sm whitespace-pre-line">{infoTooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={decrement}
          disabled={value <= min}
          data-testid={`${testId}-minus`}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <Input
          type="number"
          value={value}
          onChange={(e) => {
            const num = parseInt(e.target.value) || 0;
            onChange(Math.min(max, Math.max(min, num)));
          }}
          className="w-14 text-center"
          min={min}
          max={max}
          data-testid={testId}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={increment}
          disabled={value >= max}
          data-testid={`${testId}-plus`}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function GlazedStyleSelector({
  doorStyle,
  selectedStyle,
  onSelect,
}: {
  doorStyle: DoorStyle;
  selectedStyle: string | null;
  onSelect: (style: string) => void;
}) {
  const options = GLAZED_OPTIONS[doorStyle];
  const images = GLAZED_IMAGES[doorStyle] || {};

  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
      <Label className="text-sm font-medium mb-3 block">Choose glazed style:</Label>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={cn(
              "relative flex flex-col items-center p-2 rounded-lg border-2 transition-all",
              selectedStyle === option.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
            data-testid={`glazed-style-${option.id}`}
          >
            {selectedStyle === option.id && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
            <div className="w-full aspect-[3/4] rounded-md overflow-hidden bg-muted mb-2 flex items-center justify-center">
              <img
                src={images[option.id]}
                alt={option.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <span className="text-xs font-medium text-center">{option.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Quantities({ initialData, doorStyle, onSubmit, onBack }: QuantitiesProps) {
  const quantitiesSchema = z.object({
    totalDoors: z.number().min(3, "Minimum order is 3 doors"),
    glazedDoors: z.number().min(0),
    glazedStyle: z.string().nullable(),
    fireDoors: z.number().min(0),
    doubleDoorSets: z.number().min(0),
    bathroomLocks: z.number().min(0),
  }).refine(
    (data) => data.fireDoors + data.glazedDoors + (data.doubleDoorSets * 2) <= data.totalDoors,
    { message: "Fire doors + glazed doors + double doors cannot exceed total doors", path: ["fireDoors"] }
  ).refine(
    (data) => data.glazedDoors <= (data.totalDoors - data.fireDoors - (data.doubleDoorSets * 2)),
    { message: "Glazed doors cannot exceed remaining standard doors", path: ["glazedDoors"] }
  ).refine(
    (data) => (data.doubleDoorSets * 2) <= (data.totalDoors - data.fireDoors),
    { message: "Double door sets cannot exceed remaining non-fire doors", path: ["doubleDoorSets"] }
  ).refine(
    (data) => data.bathroomLocks <= data.totalDoors,
    { message: "Bathroom locks cannot exceed total doors", path: ["bathroomLocks"] }
  ).refine(
    (data) => data.glazedDoors === 0 || data.glazedStyle !== null,
    { message: "Please select a glazed door style", path: ["glazedStyle"] }
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuantitiesData>({
    resolver: zodResolver(quantitiesSchema),
    defaultValues: {
      totalDoors: initialData?.totalDoors || 3,
      glazedDoors: initialData?.glazedDoors || 0,
      glazedStyle: initialData?.glazedStyle || null,
      fireDoors: initialData?.fireDoors || 0,
      doubleDoorSets: initialData?.doubleDoorSets || 0,
      bathroomLocks: initialData?.bathroomLocks || 0,
    },
  });

  const totalDoors = watch("totalDoors");
  const fireDoors = watch("fireDoors");
  const glazedDoors = watch("glazedDoors");
  const glazedStyle = watch("glazedStyle");
  const doubleDoorSets = watch("doubleDoorSets");
  const hasFireOption = DOOR_STYLES[doorStyle]?.hasFireOption ?? false;
  const maxDoubleSets = Math.max(0, Math.floor((totalDoors - fireDoors) / 2));
  const maxGlazed = Math.max(0, totalDoors - fireDoors - (doubleDoorSets * 2));

  const handleGlazedStyleSelect = (style: string) => {
    setValue("glazedStyle", style, { shouldValidate: true });
  };

  const handleGlazedDoorsChange = (value: number) => {
    setValue("glazedDoors", value);
    if (value === 0) {
      setValue("glazedStyle", null);
    } else if (value > 0 && !glazedStyle) {
      const options = GLAZED_OPTIONS[doorStyle];
      if (options.length === 1) {
        setValue("glazedStyle", options[0].id);
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-quantities">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-semibold text-foreground">
          Door Quantities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <Controller
            name="totalDoors"
            control={control}
            render={({ field }) => (
              <NumberInput
                value={field.value}
                onChange={field.onChange}
                min={3}
                max={50}
                label="Total doors"
                description="Minimum order: 3 doors"
                testId="input-total-doors"
              />
            )}
          />
          {errors.totalDoors && (
            <p className="text-destructive text-sm" data-testid="error-total-doors">
              {errors.totalDoors.message}
            </p>
          )}

          {totalDoors > 0 && (
            <div className="pt-2 pb-1">
              <p className="text-sm font-medium text-muted-foreground">Of these {totalDoors} doors:</p>
            </div>
          )}

          {hasFireOption && (
            <>
              <Controller
                name="fireDoors"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    value={field.value}
                    onChange={field.onChange}
                    min={0}
                    max={totalDoors}
                    label="How many are fire doors?"
                    description="Fire-rated for safety compliance"
                    infoTooltip={`Fire doors are 44mm thick compared to standard doors (35mm). They're usually found leading to a garage, porch or loft room.

In loft conversions or 3-storey houses, fire doors may be required on all doors except bathrooms.

If you don't have fire doors but need them, your frames may need adjusting to fit.`}
                    testId="input-fire-doors"
                  />
                )}
              />
              {errors.fireDoors && (
                <p className="text-destructive text-sm" data-testid="error-fire-doors">
                  {errors.fireDoors.message}
                </p>
              )}
            </>
          )}

          <Controller
            name="glazedDoors"
            control={control}
            render={({ field }) => (
              <NumberInput
                value={field.value}
                onChange={handleGlazedDoorsChange}
                min={0}
                max={maxGlazed}
                label="How many are glazed?"
                description="Doors with glass panels"
                testId="input-glazed-doors"
              />
            )}
          />
          {errors.glazedDoors && (
            <p className="text-destructive text-sm" data-testid="error-glazed-doors">
              {errors.glazedDoors.message}
            </p>
          )}

          {glazedDoors > 0 && (
            <GlazedStyleSelector
              doorStyle={doorStyle}
              selectedStyle={glazedStyle}
              onSelect={handleGlazedStyleSelect}
            />
          )}
          {errors.glazedStyle && (
            <p className="text-destructive text-sm" data-testid="error-glazed-style">
              {errors.glazedStyle.message}
            </p>
          )}

          <Controller
            name="doubleDoorSets"
            control={control}
            render={({ field }) => (
              <NumberInput
                value={field.value}
                onChange={field.onChange}
                min={0}
                max={maxDoubleSets}
                label="Double doors"
                description="Each set of double doors counts as 2 in your total"
                infoTooltip={"Double doors are two doors that open from the centre of a single wide doorway.\n\nThis includes French door sets (rebated, 40mm) and standard double door pairs (35mm)."}
                testId="input-double-door-sets"
              />
            )}
          />
          {errors.doubleDoorSets && (
            <p className="text-destructive text-sm" data-testid="error-double-door-sets">
              {errors.doubleDoorSets.message}
            </p>
          )}

          <Controller
            name="bathroomLocks"
            control={control}
            render={({ field }) => (
              <NumberInput
                value={field.value}
                onChange={field.onChange}
                min={0}
                max={totalDoors}
                label="Bathroom locks"
                description="Privacy locks for bathroom doors"
                testId="input-bathroom-locks"
              />
            )}
          />
          {errors.bathroomLocks && (
            <p className="text-destructive text-sm" data-testid="error-bathroom-locks">
              {errors.bathroomLocks.message}
            </p>
          )}

          <div className="flex gap-3 pt-6">
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
