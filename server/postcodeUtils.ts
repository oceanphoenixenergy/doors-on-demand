const POSTCODE_COORDS: Record<string, { lat: number; lng: number }> = {
  "B": { lat: 52.4862, lng: -1.8904 },
  "B1": { lat: 52.4800, lng: -1.9000 },
  "B2": { lat: 52.4789, lng: -1.9023 },
  "B3": { lat: 52.4830, lng: -1.9100 },
  "B4": { lat: 52.4850, lng: -1.8950 },
  "B5": { lat: 52.4750, lng: -1.8900 },
  "B6": { lat: 52.5000, lng: -1.9200 },
  "B7": { lat: 52.4950, lng: -1.8700 },
  "B8": { lat: 52.4800, lng: -1.8500 },
  "B9": { lat: 52.4700, lng: -1.8400 },
  "B10": { lat: 52.4600, lng: -1.8500 },
  "B11": { lat: 52.4550, lng: -1.8700 },
  "B12": { lat: 52.4500, lng: -1.8900 },
  "B13": { lat: 52.4400, lng: -1.9100 },
  "B14": { lat: 52.4200, lng: -1.9200 },
  "B15": { lat: 52.4600, lng: -1.9400 },
  "B16": { lat: 52.4700, lng: -1.9300 },
  "B17": { lat: 52.4500, lng: -1.9600 },
  "B18": { lat: 52.4900, lng: -1.9400 },
  "B19": { lat: 52.5000, lng: -1.9100 },
  "B20": { lat: 52.5100, lng: -1.9300 },
  "B21": { lat: 52.5100, lng: -1.9500 },
  "B23": { lat: 52.5300, lng: -1.8800 },
  "B24": { lat: 52.5200, lng: -1.8500 },
  "B25": { lat: 52.4500, lng: -1.8100 },
  "B26": { lat: 52.4400, lng: -1.8300 },
  "B27": { lat: 52.4350, lng: -1.8500 },
  "B28": { lat: 52.4300, lng: -1.8700 },
  "B29": { lat: 52.4300, lng: -1.9400 },
  "B30": { lat: 52.4200, lng: -1.9100 },
  "B31": { lat: 52.4100, lng: -1.9900 },
  "B32": { lat: 52.4500, lng: -2.0100 },
  "B33": { lat: 52.4700, lng: -1.7800 },
  "B34": { lat: 52.4900, lng: -1.7600 },
  "B35": { lat: 52.5100, lng: -1.7800 },
  "B36": { lat: 52.5000, lng: -1.7500 },
  "B37": { lat: 52.4800, lng: -1.7300 },
  "B38": { lat: 52.4000, lng: -1.9100 },
  "B42": { lat: 52.5200, lng: -1.9200 },
  "B43": { lat: 52.5400, lng: -1.9500 },
  "B44": { lat: 52.5400, lng: -1.8800 },
  "B45": { lat: 52.3900, lng: -1.9700 },
  "B46": { lat: 52.5000, lng: -1.7000 },
  "B47": { lat: 52.3700, lng: -1.9000 },
  "B48": { lat: 52.3600, lng: -1.9400 },
  "B49": { lat: 52.2900, lng: -1.8400 },
  "B50": { lat: 52.2600, lng: -1.8800 },
  "B60": { lat: 52.3200, lng: -2.0200 },
  "B61": { lat: 52.3400, lng: -2.0500 },
  "B62": { lat: 52.4600, lng: -2.0200 },
  "B63": { lat: 52.4700, lng: -2.0700 },
  "B64": { lat: 52.4800, lng: -2.0500 },
  "B65": { lat: 52.4900, lng: -2.0200 },
  "B66": { lat: 52.4800, lng: -1.9800 },
  "B67": { lat: 52.4900, lng: -1.9600 },
  "B68": { lat: 52.4700, lng: -2.0100 },
  "B69": { lat: 52.5000, lng: -2.0100 },
  "B70": { lat: 52.5100, lng: -2.0000 },
  "B71": { lat: 52.5300, lng: -1.9800 },
  "B72": { lat: 52.5500, lng: -1.8300 },
  "B73": { lat: 52.5400, lng: -1.8500 },
  "B74": { lat: 52.5700, lng: -1.8600 },
  "B75": { lat: 52.5900, lng: -1.8300 },
  "B76": { lat: 52.5600, lng: -1.8000 },
  "B77": { lat: 52.6200, lng: -1.6800 },
  "B78": { lat: 52.6000, lng: -1.6500 },
  "B79": { lat: 52.6400, lng: -1.7000 },
  "B80": { lat: 52.2700, lng: -1.9000 },
  "B90": { lat: 52.3900, lng: -1.8200 },
  "B91": { lat: 52.4100, lng: -1.7900 },
  "B92": { lat: 52.4300, lng: -1.7400 },
  "B93": { lat: 52.3800, lng: -1.7300 },
  "B94": { lat: 52.3500, lng: -1.7600 },
  "B95": { lat: 52.2600, lng: -1.7800 },
  "B96": { lat: 52.3000, lng: -2.0500 },
  "B97": { lat: 52.2800, lng: -1.9700 },
  "B98": { lat: 52.2800, lng: -1.9300 },
  "CV": { lat: 52.4081, lng: -1.5106 },
  "CV1": { lat: 52.4081, lng: -1.5106 },
  "CV2": { lat: 52.4200, lng: -1.4800 },
  "CV3": { lat: 52.3900, lng: -1.4900 },
  "CV4": { lat: 52.3800, lng: -1.5500 },
  "CV5": { lat: 52.4000, lng: -1.5500 },
  "CV6": { lat: 52.4400, lng: -1.4900 },
  "CV7": { lat: 52.4800, lng: -1.5800 },
  "DY": { lat: 52.5119, lng: -2.0869 },
  "DY1": { lat: 52.5119, lng: -2.0869 },
  "DY2": { lat: 52.5000, lng: -2.0900 },
  "DY3": { lat: 52.5300, lng: -2.1200 },
  "DY4": { lat: 52.5400, lng: -2.0600 },
  "DY5": { lat: 52.4800, lng: -2.1100 },
  "DY6": { lat: 52.4600, lng: -2.1400 },
  "DY7": { lat: 52.4400, lng: -2.1800 },
  "DY8": { lat: 52.4500, lng: -2.1600 },
  "DY9": { lat: 52.4200, lng: -2.1100 },
  "DE": { lat: 52.9225, lng: -1.4746 },
  "LE": { lat: 52.6369, lng: -1.1398 },
  "ST": { lat: 52.9889, lng: -2.1774 },
  "WS": { lat: 52.5851, lng: -1.9816 },
  "WS1": { lat: 52.5851, lng: -1.9816 },
  "WS2": { lat: 52.5700, lng: -2.0000 },
  "WS3": { lat: 52.6000, lng: -2.0000 },
  "WS4": { lat: 52.5800, lng: -1.9500 },
  "WS5": { lat: 52.5600, lng: -1.9600 },
  "WS6": { lat: 52.6500, lng: -2.0200 },
  "WS7": { lat: 52.6800, lng: -1.9200 },
  "WS8": { lat: 52.6200, lng: -1.9200 },
  "WS9": { lat: 52.6000, lng: -1.9000 },
  "WS10": { lat: 52.5500, lng: -2.0200 },
  "WS11": { lat: 52.6900, lng: -2.0000 },
  "WS12": { lat: 52.7200, lng: -2.0100 },
  "WS13": { lat: 52.6900, lng: -1.8500 },
  "WS14": { lat: 52.6500, lng: -1.8200 },
  "WS15": { lat: 52.7600, lng: -1.9500 },
  "WV": { lat: 52.5891, lng: -2.1300 },
  "WV1": { lat: 52.5891, lng: -2.1300 },
  "WV2": { lat: 52.5700, lng: -2.1400 },
  "WV3": { lat: 52.5700, lng: -2.1800 },
  "WV4": { lat: 52.5500, lng: -2.1600 },
  "WV5": { lat: 52.5200, lng: -2.1800 },
  "WV6": { lat: 52.6100, lng: -2.1700 },
  "WV10": { lat: 52.6200, lng: -2.1100 },
  "WV11": { lat: 52.6200, lng: -2.0800 },
  "WV12": { lat: 52.6000, lng: -2.0400 },
  "WV13": { lat: 52.5800, lng: -2.0200 },
  "WV14": { lat: 52.5600, lng: -2.0800 },
  "NN": { lat: 52.2405, lng: -0.9027 },
  "TF": { lat: 52.6783, lng: -2.4497 },
  "HR": { lat: 52.0567, lng: -2.7160 },
  "WR": { lat: 52.1920, lng: -2.2209 },
};

const BASE_POSTCODE = "B74";
const BASE_COORDS = { lat: 52.5700, lng: -1.8600 };
const MAX_DISTANCE_MILES = 25;

function normalizePostcode(postcode: string): string {
  return postcode.toUpperCase().replace(/\s+/g, "").trim();
}

function extractOutwardCode(postcode: string): string {
  const normalized = normalizePostcode(postcode);
  const match = normalized.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)/);
  return match ? match[1] : "";
}

function extractAreaCode(postcode: string): string {
  const normalized = normalizePostcode(postcode);
  const match = normalized.match(/^([A-Z]{1,2}\d{1,2})/);
  return match ? match[1] : "";
}

function extractLetterOnly(postcode: string): string {
  const normalized = normalizePostcode(postcode);
  const match = normalized.match(/^([A-Z]{1,2})/);
  return match ? match[1] : "";
}

function getCoords(postcode: string): { lat: number; lng: number } | null {
  const outward = extractOutwardCode(postcode);
  const area = extractAreaCode(postcode);
  const letter = extractLetterOnly(postcode);
  
  if (POSTCODE_COORDS[outward]) return POSTCODE_COORDS[outward];
  if (POSTCODE_COORDS[area]) return POSTCODE_COORDS[area];
  if (POSTCODE_COORDS[letter]) return POSTCODE_COORDS[letter];
  
  return null;
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function validatePostcode(postcode: string): { valid: boolean; distance?: number; message?: string } {
  const normalized = normalizePostcode(postcode);
  
  if (normalized.length < 2) {
    return { valid: false, message: "Please enter a valid UK postcode" };
  }
  
  const coords = getCoords(normalized);
  
  if (!coords) {
    return { valid: false, message: "We could not find this postcode area. Please check and try again." };
  }
  
  const distance = haversineDistance(
    BASE_COORDS.lat,
    BASE_COORDS.lng,
    coords.lat,
    coords.lng
  );
  
  const roundedDistance = Math.round(distance * 10) / 10;
  
  if (roundedDistance <= MAX_DISTANCE_MILES) {
    return { valid: true, distance: roundedDistance };
  } else {
    return { valid: false, distance: roundedDistance, message: "Outside service area" };
  }
}
