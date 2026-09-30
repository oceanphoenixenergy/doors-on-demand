import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, AlertTriangle, Ruler, ChevronDown, ChevronUp, Info } from "lucide-react";
import { 
  IMPERIAL_DOOR_SIZES, 
  METRIC_DOOR_SIZES, 
  ROOM_TYPES,
  FRENCH_DOOR_WIDTHS,
  type DoorSizeEntry,
  type DoorFinish
} from "@shared/schema";

import measureStep1 from "@/assets/images/measure-step1-width.png";
import measureStep2 from "@/assets/images/measure-step2-reading.png";
import measureStep3 from "@/assets/images/measure-step3-thickness.png";
import rebatedEdgeImg from "@assets/Screenshot_2026-03-10_at_10.01.38_1773136902343.png";
import pairMakerDiagramImg from "@assets/Screenshot_2026-03-10_at_10.02.37_1773136960579.png";
import pairMakerPhotoImg from "@assets/Screenshot_2026-03-10_at_10.02.52_1773136976512.png";

interface DoorSizesProps {
  totalDoors: number;
  fireDoors: number;
  glazedDoors: number;
  doubleDoorSets?: number;
  doorFinish?: DoorFinish;
  onSubmit: (doorSizes: DoorSizeEntry[], isMetric: boolean) => void;
  onBack: () => void;
}

const ALL_SIZES = [
  ...IMPERIAL_DOOR_SIZES.map(s => ({ 
    mm: s.mm, 
    label: `${s.mm}mm (${s.inches}") - Imperial`,
    isMetric: false 
  })),
  ...METRIC_DOOR_SIZES.map(s => ({ 
    mm: s.mm, 
    label: `${s.mm}mm - Metric`,
    isMetric: true 
  })),
].sort((a, b) => a.mm - b.mm);

const FRENCH_DOOR_SIZE_OPTIONS = FRENCH_DOOR_WIDTHS.map(mm => ({
  mm,
  label: `${mm}mm`,
}));

const STANDARD_DOUBLE_WIDTHS = [
  { totalMm: 1220, eachMm: 610, label: "1220mm (2 × 610mm / 24\")" },
  { totalMm: 1372, eachMm: 686, label: "1372mm (2 × 686mm / 27\")" },
  { totalMm: 1524, eachMm: 762, label: "1524mm (2 × 762mm / 30\")" },
  { totalMm: 1626, eachMm: 813, label: "1626mm (2 × 813mm / 32\")" },
  { totalMm: 1676, eachMm: 838, label: "1676mm (2 × 838mm / 33\")" },
];

interface DoubleDoorConfig {
  room: string;
  thickness: '35mm' | '40mm' | '';
  isRebated: boolean | null;
  overallWidthMm: number;
  wantsPairMaker: boolean;
  doubleDoorType: 'french_set' | 'standard_pair' | null;
}

export function DoorSizes({ totalDoors, fireDoors, glazedDoors, doubleDoorSets = 0, doorFinish = "unfinished", onSubmit, onBack }: DoorSizesProps) {
  const singleDoors = totalDoors - fireDoors - glazedDoors - (doubleDoorSets * 2);
  
  const [doorEntries, setDoorEntries] = useState<DoorSizeEntry[]>(() => {
    const entries: DoorSizeEntry[] = [];
    
    for (let i = 0; i < glazedDoors; i++) {
      entries.push({ room: "", widthMm: 762, isGlazedDoor: true });
    }
    for (let i = 0; i < fireDoors; i++) {
      entries.push({ room: "", widthMm: 762, isFireDoor: true });
    }
    for (let i = 0; i < singleDoors; i++) {
      entries.push({ room: "", widthMm: 762 });
    }
    
    return entries;
  });

  const [doubleDoorConfigs, setDoubleDoorConfigs] = useState<DoubleDoorConfig[]>(() => {
    return Array.from({ length: doubleDoorSets }, () => ({
      room: "",
      thickness: '' as const,
      isRebated: null,
      overallWidthMm: 0,
      wantsPairMaker: false,
      doubleDoorType: null,
    }));
  });
  
  const [showGuide, setShowGuide] = useState(false);

  const updateEntry = (index: number, field: keyof DoorSizeEntry, value: string | number) => {
    setDoorEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateDoubleDoor = (index: number, updates: Partial<DoubleDoorConfig>) => {
    setDoubleDoorConfigs(prev => {
      const updated = [...prev];
      const current = { ...updated[index], ...updates };

      if (updates.thickness !== undefined) {
        current.overallWidthMm = 0;
        current.wantsPairMaker = false;
        if (updates.thickness === '35mm') {
          current.isRebated = false;
          current.doubleDoorType = 'standard_pair';
        } else {
          current.isRebated = null;
          current.doubleDoorType = null;
        }
      }

      if (updates.isRebated !== undefined && current.thickness === '40mm') {
        current.overallWidthMm = 0;
        if (updates.isRebated) {
          current.doubleDoorType = 'french_set';
          current.wantsPairMaker = false;
        } else {
          current.doubleDoorType = 'standard_pair';
        }
      }
      
      updated[index] = current;
      return updated;
    });
  };

  const hasMetricSizes = doorEntries.some(entry => {
    return METRIC_DOOR_SIZES.some(m => m.mm === entry.widthMm);
  });

  const allSingleDoorsValid = doorEntries.every(entry => entry.widthMm > 0 && entry.room !== "");
  
  const allDoubleDoorsValid = doubleDoorConfigs.every(config => {
    if (!config.room || !config.thickness) return false;
    if (!config.doubleDoorType) return false;
    if (config.overallWidthMm === 0) return false;
    return true;
  });
  
  const canSubmit = allSingleDoorsValid && allDoubleDoorsValid;

  const handleSubmit = () => {
    if (!canSubmit) return;
    
    const allEntries: DoorSizeEntry[] = [...doorEntries];
    
    for (const config of doubleDoorConfigs) {
      if (config.doubleDoorType === 'french_set') {
        allEntries.push({
          room: config.room,
          widthMm: config.overallWidthMm,
          isDoubleDoor: true,
          doubleDoorType: 'french_set',
          doubleDoorWidthMm: config.overallWidthMm,
          isRebated: true,
          isGlazedDoor: true,
        });
      } else if (config.doubleDoorType === 'standard_pair') {
        const matchingWidth = STANDARD_DOUBLE_WIDTHS.find(w => w.totalMm === config.overallWidthMm);
        const eachDoorWidth = matchingWidth ? matchingWidth.eachMm : Math.round(config.overallWidthMm / 2);
        allEntries.push({
          room: config.room,
          widthMm: eachDoorWidth,
          isDoubleDoor: true,
          doubleDoorType: 'standard_pair',
          doubleDoorWidthMm: config.overallWidthMm,
          isRebated: false,
          wantsPairMaker: config.wantsPairMaker,
        });
      }
    }
    
    onSubmit(allEntries, hasMetricSizes);
  };

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-door-sizes">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
          <Ruler className="w-5 h-5" />
          Door Sizes
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Please provide the width of each door
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between bg-primary/5"
          aria-expanded={showGuide}
          aria-controls="measure-guide"
          data-testid="button-toggle-guide"
        >
          <span className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-primary" />
            How to measure your doors
          </span>
          {showGuide ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </Button>

        {showGuide && (
          <div id="measure-guide" className="space-y-4" data-testid="measure-guide">
            <div className="rounded-md border border-border overflow-hidden" data-testid="card-measure-step-1">
              <img src={measureStep1} alt="Measure door width" className="w-full h-40 object-cover" data-testid="img-measure-step-1" />
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium text-foreground">Step 1: Measure the width</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Take your tape and run it from one side of the door to the other. It can be in the middle of the door, just make sure the tape is level.
                </p>
              </div>
            </div>

            <div className="rounded-md border border-border overflow-hidden" data-testid="card-measure-step-2">
              <img src={measureStep2} alt="Read measurement" className="w-full h-40 object-cover" data-testid="img-measure-step-2" />
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium text-foreground">Step 2: Take your reading</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Read the measurement in inches or millimetres, whichever you're more comfortable with. For example, 30 inches is 762mm.
                </p>
              </div>
            </div>

            <div className="rounded-md border border-border overflow-hidden" data-testid="card-measure-step-3">
              <img src={measureStep3} alt="Check door thickness" className="w-full h-40 object-cover" data-testid="img-measure-step-3" />
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium text-foreground">Step 3: Check the thickness</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Measure the edge of the door too. 35mm means it's a standard internal door, 40mm could mean they're metric, and 44mm means it's a fire door.
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground italic">
              No door on yet? Just measure where the door would sit in the frame.
            </div>
          </div>
        )}

        <div className="bg-muted/50 rounded-md p-3 text-sm text-muted-foreground">
          <p>Select the nearest size to your doors. We'll trim them to fit your frames perfectly.</p>
        </div>

        <div className="bg-primary/5 rounded-md p-3 text-sm text-muted-foreground">
          <p><span className="font-medium text-foreground">Tip:</span> 762mm (30") is the most common size. We've pre-selected it for you — just change any that differ.</p>
        </div>

        {doorEntries.length > 0 && (
          <>
            {doubleDoorSets > 0 && (
              <p className="text-sm font-medium text-foreground">Single Doors</p>
            )}
            <div className="space-y-3">
              {doorEntries.map((entry, index) => (
                <div 
                  key={index} 
                  className="p-3 bg-background border border-border rounded-md space-y-2"
                  data-testid={`door-entry-${index}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground min-w-[60px]">
                      Door {index + 1}
                    </span>
                    {entry.isFireDoor && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                        Fire Door
                      </span>
                    )}
                    {entry.isGlazedDoor && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Glazed Door
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={entry.room}
                      onValueChange={(value) => updateEntry(index, "room", value)}
                    >
                      <SelectTrigger data-testid={`select-room-${index}`}>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOM_TYPES.map((room) => (
                          <SelectItem key={room} value={room}>
                            {room}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={entry.widthMm.toString()}
                      onValueChange={(value) => updateEntry(index, "widthMm", parseInt(value))}
                    >
                      <SelectTrigger data-testid={`select-size-${index}`}>
                        <SelectValue placeholder="Select width" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_SIZES.map((size) => (
                          <SelectItem key={size.mm} value={size.mm.toString()}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {hasMetricSizes && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2" data-testid="metric-warning">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Metric door sizes detected</p>
              <p className="text-amber-700 mt-1">
                Metric doors are less common and may affect pricing. We'll be in touch to confirm your quote after submission.
              </p>
            </div>
          </div>
        )}

        {doubleDoorSets > 0 && (
          <>
            <p className="text-sm font-medium text-foreground pt-2">Double Doors</p>
            <div className="space-y-4">
              {doubleDoorConfigs.map((config, index) => (
                <DoubleDoorEntry
                  key={index}
                  index={index}
                  config={config}
                  doorFinish={doorFinish}
                  onChange={(updates) => updateDoubleDoor(index, updates)}
                />
              ))}
            </div>
          </>
        )}

        <div className="space-y-3 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full"
            data-testid="button-continue"
          >
            Continue to choose fitting date
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="w-full"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to quote
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DoubleDoorEntry({ 
  index, 
  config, 
  doorFinish,
  onChange 
}: { 
  index: number; 
  config: DoubleDoorConfig;
  doorFinish: DoorFinish;
  onChange: (updates: Partial<DoubleDoorConfig>) => void;
}) {
  const [showRebatedInfo, setShowRebatedInfo] = useState(false);
  const pairMakerPrice = doorFinish === "prefinished" ? 39 : 33;

  return (
    <div 
      className="p-4 bg-background border-2 border-primary/20 rounded-md space-y-4"
      data-testid={`double-door-entry-${index}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">
          Double Door Set {index + 1}
        </span>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
          Double Door
        </span>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Room</label>
        <Select
          value={config.room}
          onValueChange={(value) => onChange({ room: value })}
        >
          <SelectTrigger data-testid={`select-double-room-${index}`}>
            <SelectValue placeholder="Select room" />
          </SelectTrigger>
          <SelectContent>
            {ROOM_TYPES.map((room) => (
              <SelectItem key={room} value={room}>
                {room}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">
          What thickness are your current double doors?
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ thickness: '35mm' })}
            className={`p-3 rounded-md border-2 text-center text-sm font-medium transition-all ${
              config.thickness === '35mm' 
                ? 'border-primary bg-primary/5 text-primary' 
                : 'border-border hover:border-primary/50 text-foreground'
            }`}
            data-testid={`button-thickness-35-${index}`}
          >
            35mm
            <span className="block text-xs font-normal text-muted-foreground mt-0.5">Standard</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ thickness: '40mm' })}
            className={`p-3 rounded-md border-2 text-center text-sm font-medium transition-all ${
              config.thickness === '40mm' 
                ? 'border-primary bg-primary/5 text-primary' 
                : 'border-border hover:border-primary/50 text-foreground'
            }`}
            data-testid={`button-thickness-40-${index}`}
          >
            40mm
            <span className="block text-xs font-normal text-muted-foreground mt-0.5">Thicker</span>
          </button>
        </div>
      </div>

      {config.thickness === '40mm' && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-sm font-medium text-foreground">
              Are your current doors rebated?
            </label>
            <button 
              type="button"
              onClick={() => setShowRebatedInfo(!showRebatedInfo)}
              className="text-muted-foreground hover:text-foreground"
              data-testid={`button-rebated-info-${index}`}
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          
          {showRebatedInfo && (
            <div className="mb-3 p-3 bg-muted/50 rounded-md space-y-2">
              <p className="text-xs text-muted-foreground">
                Rebated doors have a stepped edge where the two doors overlap, rather than meeting flat. Here's what it looks like:
              </p>
              <img 
                src={rebatedEdgeImg} 
                alt="Rebated door edge showing stepped overlap" 
                className="w-full rounded border border-border"
                data-testid={`img-rebated-${index}`}
              />
              <p className="text-xs text-muted-foreground italic">
                If your doors have this stepped edge, they are rebated and will need a specific French door set.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ isRebated: true })}
              className={`p-3 rounded-md border-2 text-center text-sm font-medium transition-all ${
                config.isRebated === true 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-border hover:border-primary/50 text-foreground'
              }`}
              data-testid={`button-rebated-yes-${index}`}
            >
              Yes, rebated
            </button>
            <button
              type="button"
              onClick={() => onChange({ isRebated: false })}
              className={`p-3 rounded-md border-2 text-center text-sm font-medium transition-all ${
                config.isRebated === false 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-border hover:border-primary/50 text-foreground'
              }`}
              data-testid={`button-rebated-no-${index}`}
            >
              No, flat edge
            </button>
          </div>
        </div>
      )}

      {config.thickness === '35mm' && (
        <StandardPairConfig 
          index={index} 
          config={config} 
          doorFinish={doorFinish}
          pairMakerPrice={pairMakerPrice}
          onChange={onChange} 
        />
      )}

      {config.thickness === '40mm' && config.isRebated === true && (
        <FrenchSetConfig 
          index={index} 
          config={config} 
          onChange={onChange} 
        />
      )}

      {config.thickness === '40mm' && config.isRebated === false && (
        <StandardPairConfig 
          index={index} 
          config={config} 
          doorFinish={doorFinish}
          pairMakerPrice={pairMakerPrice}
          onChange={onChange} 
        />
      )}
    </div>
  );
}

function FrenchSetConfig({
  index,
  config,
  onChange,
}: {
  index: number;
  config: DoubleDoorConfig;
  onChange: (updates: Partial<DoubleDoorConfig>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3" data-testid={`french-set-info-${index}`}>
        <p className="text-sm font-medium text-blue-800">French Door Set</p>
        <p className="text-xs text-blue-700 mt-1">
          Your doors are rebated and require a specific French door set. These come glazed and unfinished at a fixed price of <strong>£840</strong> including fitting and all hardware.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">
          Overall width of your double door opening
        </label>
        <Select
          value={config.overallWidthMm > 0 ? config.overallWidthMm.toString() : ""}
          onValueChange={(value) => onChange({ overallWidthMm: parseInt(value) })}
        >
          <SelectTrigger data-testid={`select-french-width-${index}`}>
            <SelectValue placeholder="Select width" />
          </SelectTrigger>
          <SelectContent>
            {FRENCH_DOOR_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size.mm} value={size.mm.toString()}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function StandardPairConfig({
  index,
  config,
  doorFinish,
  pairMakerPrice,
  onChange,
}: {
  index: number;
  config: DoubleDoorConfig;
  doorFinish: DoorFinish;
  pairMakerPrice: number;
  onChange: (updates: Partial<DoubleDoorConfig>) => void;
}) {
  const [showPairMakerInfo, setShowPairMakerInfo] = useState(false);

  return (
    <div className="space-y-3">
      <div className="bg-green-50 border border-green-200 rounded-md p-3" data-testid={`standard-pair-info-${index}`}>
        <p className="text-sm font-medium text-green-800">Standard Door Pair</p>
        <p className="text-xs text-green-700 mt-1">
          We'll use two standard doors for your double doorway. These are priced at normal door rates with a rack bolt thumb turn included.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">
          Overall width of your double door opening
        </label>
        <Select
          value={config.overallWidthMm > 0 ? config.overallWidthMm.toString() : ""}
          onValueChange={(value) => onChange({ overallWidthMm: parseInt(value) })}
        >
          <SelectTrigger data-testid={`select-standard-pair-width-${index}`}>
            <SelectValue placeholder="Select overall width" />
          </SelectTrigger>
          <SelectContent>
            {STANDARD_DOUBLE_WIDTHS.map((size) => (
              <SelectItem key={size.totalMm} value={size.totalMm.toString()}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          If your opening is slightly wider than these sizes, a pair maker strip may be needed.
        </p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <label className="text-sm font-medium text-foreground">
            Would you like a pair maker?
          </label>
          <button 
            type="button"
            onClick={() => setShowPairMakerInfo(!showPairMakerInfo)}
            className="text-muted-foreground hover:text-foreground"
            data-testid={`button-pair-maker-info-${index}`}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {showPairMakerInfo && (
          <div className="mb-3 p-3 bg-muted/50 rounded-md space-y-2">
            <p className="text-xs text-muted-foreground">
              A pair maker is a T-shaped strip that sits between the two doors, giving a clean, professional finish where they meet.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <img 
                src={pairMakerDiagramImg} 
                alt="Pair maker T-profile diagram" 
                className="w-full rounded border border-border"
                data-testid={`img-pair-maker-diagram-${index}`}
              />
              <img 
                src={pairMakerPhotoImg} 
                alt="Pair maker fitted between doors" 
                className="w-full rounded border border-border"
                data-testid={`img-pair-maker-photo-${index}`}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ wantsPairMaker: true })}
            className={`p-3 rounded-md border-2 text-center text-sm font-medium transition-all ${
              config.wantsPairMaker === true 
                ? 'border-primary bg-primary/5 text-primary' 
                : 'border-border hover:border-primary/50 text-foreground'
            }`}
            data-testid={`button-pair-maker-yes-${index}`}
          >
            Yes (+£{pairMakerPrice})
          </button>
          <button
            type="button"
            onClick={() => onChange({ wantsPairMaker: false })}
            className={`p-3 rounded-md border-2 text-center text-sm font-medium transition-all ${
              config.wantsPairMaker === false 
                ? 'border-primary bg-primary/5 text-primary' 
                : 'border-border hover:border-primary/50 text-foreground'
            }`}
            data-testid={`button-pair-maker-no-${index}`}
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
