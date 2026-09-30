import type { QuoteData, QuoteCalculation, DoorFinish, DoorStyle, DoorSizeEntry } from "@shared/schema";
import {
  DOOR_STYLES,
  FRENCH_DOOR_SET_PRICE,
  DOUBLE_DOOR_FITTING_CHARGE,
  RACK_BOLT_PRICE,
  PAIR_MAKER_PRICE_UNFINISHED,
  PAIR_MAKER_PRICE_PREFINISHED,
} from "@shared/schema";

const FITTING_CHARGES = {
  standard: 130,
  fire: 200,
};

const BATHROOM_LOCK_PRICE = 50;
const HANDLE_UPGRADE_PRICE = 30;
const MINIMUM_DOORS = 3;

type DoorPricing = {
  standard: number;
  fire?: number;
  glazed?: Record<string, number>;
};

type FinishPricing = {
  unfinished?: DoorPricing;
  prefinished?: DoorPricing;
};

const DOOR_PRICES: Record<DoorStyle, FinishPricing> = {
  mexicano: {
    unfinished: {
      standard: 80,
      fire: 130,
      glazed: {
        "6l": 145,
        "2xg": 145,
        "pattern10": 145,
        "frosted": 145,
      },
    },
    prefinished: {
      standard: 110,
      fire: 150,
      glazed: {
        "6l": 180,
        "2xg": 165,
        "pattern10": 165,
      },
    },
  },
  iseo: {
    prefinished: {
      standard: 110,
      fire: 140,
      glazed: {
        "clear": 210,
        "frosted": 175,
        "pattern10-clear": 200,
        "pattern10-frosted": 200,
      },
    },
  },
  "7-panel": {
    unfinished: {
      standard: 90,
      fire: 120,
      glazed: {
        "clear": 150,
        "frosted": 160,
      },
    },
    prefinished: {
      standard: 110,
      fire: 140,
      glazed: {
        "clear": 180,
        "frosted": 185,
      },
    },
  },
  dx30: {
    unfinished: {
      standard: 100,
      glazed: {
        "clear": 130,
        "frosted": 145,
      },
    },
  },
  "rustic-edwardian": {
    prefinished: {
      standard: 150,
      glazed: {
        "clear": 180,
      },
    },
  },
  aston: {
    unfinished: {
      standard: 120,
      glazed: {
        "clear": 130,
        "frosted": 130,
      },
    },
  },
  "4-panel-shaker": {
    unfinished: {
      standard: 100,
      fire: 155,
      glazed: {
        "clear": 110,
        "frosted": 115,
      },
    },
    prefinished: {
      standard: 130,
      fire: 180,
      glazed: {
        "clear": 150,
        "frosted": 155,
      },
    },
  },
};

export function getAvailableFinishes(doorStyle: DoorStyle): DoorFinish[] {
  const pricing = DOOR_PRICES[doorStyle];
  const finishes: DoorFinish[] = [];
  if (pricing?.unfinished) finishes.push("unfinished");
  if (pricing?.prefinished) finishes.push("prefinished");
  return finishes;
}

export function hasFireOption(doorStyle: DoorStyle, doorFinish: DoorFinish): boolean {
  const pricing = DOOR_PRICES[doorStyle]?.[doorFinish];
  return pricing?.fire !== undefined;
}

export function getMinimumDoors(): number {
  return MINIMUM_DOORS;
}

export function calculateQuote(data: QuoteData): QuoteCalculation {
  const pricing = DOOR_PRICES[data.doorStyle]?.[data.doorFinish];
  if (!pricing) {
    return {
      standardDoors: 0,
      standardTotal: 0,
      fireTotal: 0,
      glazingTotal: 0,
      doubleDoorTotal: 0,
      locksTotal: 0,
      handleTotal: 0,
      grandTotal: 0,
      depositDue: 0,
      estimatedDays: 1,
    };
  }

  const doorSizes = data.doorSizes || [];
  const frenchSets = doorSizes.filter(
    (d) => d.isDoubleDoor && d.doubleDoorType === "french_set"
  );
  const standardPairs = doorSizes.filter(
    (d) => d.isDoubleDoor && d.doubleDoorType === "standard_pair"
  );

  const frenchSetCount = frenchSets.length;
  const standardPairCount = standardPairs.length;
  const doubleDoorCount = (frenchSetCount + standardPairCount) * 2;

  const glazedDoors = data.glazedDoors || 0;
  const fireDoors = data.fireDoors || 0;
  const singleDoorTotal = data.totalDoors - doubleDoorCount;
  const standardDoors = singleDoorTotal - fireDoors - glazedDoors;

  const standardDoorPrice = pricing.standard;
  const fireDoorPrice = pricing.fire || pricing.standard;
  const glazedDoorPrice = data.glazedStyle && pricing.glazed?.[data.glazedStyle] 
    ? pricing.glazed[data.glazedStyle] 
    : pricing.standard;

  const standardDoorsTotal = standardDoors * (standardDoorPrice + FITTING_CHARGES.standard);
  const fireDoorsTotal = fireDoors * (fireDoorPrice + FITTING_CHARGES.fire);
  const glazedDoorsTotal = glazedDoors * (glazedDoorPrice + FITTING_CHARGES.standard);

  let doubleDoorTotal = 0;

  doubleDoorTotal += frenchSetCount * FRENCH_DOOR_SET_PRICE;

  for (const pair of standardPairs) {
    const pairDoorPrice = standardDoorPrice * 2;
    const pairFitting = DOUBLE_DOOR_FITTING_CHARGE;
    const rackBolt = RACK_BOLT_PRICE;
    let pairMaker = 0;
    if (pair.wantsPairMaker) {
      pairMaker = data.doorFinish === "prefinished"
        ? PAIR_MAKER_PRICE_PREFINISHED
        : PAIR_MAKER_PRICE_UNFINISHED;
    }
    doubleDoorTotal += pairDoorPrice + pairFitting + rackBolt + pairMaker;
  }

  const locksTotal = (data.bathroomLocks || 0) * BATHROOM_LOCK_PRICE;

  const hasHandleUpgrade = data.handleFinish === "matt-black" || data.handleFinish === "polished-brass";
  const singleDoorsForHandles = data.totalDoors - doubleDoorCount;
  const handleTotal = hasHandleUpgrade ? singleDoorsForHandles * HANDLE_UPGRADE_PRICE : 0;

  const grandTotal = standardDoorsTotal + fireDoorsTotal + glazedDoorsTotal + doubleDoorTotal + locksTotal + handleTotal;
  const depositDue = Math.ceil(grandTotal * 0.5);
  
  const singleFittingUnits = standardDoors + glazedDoors + (fireDoors * 2);
  const doubleFittingUnits = (frenchSetCount + standardPairCount) * 3;
  const fittingUnits = singleFittingUnits + doubleFittingUnits;
  const estimatedDays = Math.ceil(fittingUnits / 6);

  return {
    standardDoors,
    standardTotal: standardDoorsTotal,
    fireTotal: fireDoorsTotal,
    glazingTotal: glazedDoorsTotal,
    doubleDoorTotal,
    locksTotal,
    handleTotal,
    grandTotal,
    depositDue,
    estimatedDays,
  };
}

export function formatCurrency(amount: number): string {
  const hasDecimals = amount % 1 !== 0;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(amount);
}

export function getDoorStyleLabel(style: DoorStyle): string {
  return DOOR_STYLES[style]?.name || style;
}

export function getDoorFinishLabel(finish: DoorFinish): string {
  return finish === "prefinished" ? "Pre-finished" : "Unfinished";
}

export function getFullDoorLabel(style: DoorStyle, finish: DoorFinish): string {
  return `${getDoorStyleLabel(style)} (${getDoorFinishLabel(finish)})`;
}

export function getHandleFinishLabel(finish: string): string {
  switch (finish) {
    case "satin-nickel":
      return "Satin Nickel";
    case "matt-black":
      return "Matt Black";
    case "polished-brass":
      return "Polished Brass";
    default:
      return finish;
  }
}

export function getHandleModelLabel(model: string): string {
  return model.charAt(0).toUpperCase() + model.slice(1);
}

export function getGlazedStyleLabel(doorStyle: DoorStyle, glazedStyleId: string | null): string {
  if (!glazedStyleId) return "";
  
  const labels: Record<string, Record<string, string>> = {
    mexicano: {
      "2xg": "2XG",
      "frosted": "Frosted",
      "6l": "6L",
      "pattern10": "Pattern 10",
    },
    iseo: {
      "clear": "Clear",
      "frosted": "Frosted",
      "pattern10-clear": "Pattern 10 Clear",
      "pattern10-frosted": "Pattern 10 Frosted",
    },
    aston: {
      "clear": "Clear",
      "frosted": "Frosted",
    },
    "7-panel": {
      "clear": "Clear",
      "frosted": "Frosted",
    },
    dx30: {
      "clear": "Clear",
      "frosted": "Frosted",
    },
    "4-panel-shaker": {
      "clear": "Clear",
      "frosted": "Frosted",
    },
    "rustic-edwardian": {
      "clear": "Clear",
    },
  };
  
  return labels[doorStyle]?.[glazedStyleId] || glazedStyleId;
}
