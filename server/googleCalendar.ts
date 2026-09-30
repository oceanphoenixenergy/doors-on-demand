// Google Calendar Integration for Doors On Demand
// Provides availability checking for fitting dates

import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export interface AvailableSlot {
  date: string;
  dayOfWeek: string;
  displayDate: string;
  endDate?: string;
  endDisplayDate?: string;
}

// Allowed fitting days: Monday (1) through Friday (5)
// Saturday (6) and Sunday (0) are NOT allowed
const ALLOWED_FITTING_DAYS = [1, 2, 3, 4, 5]; // Mon, Tue, Wed, Thu, Fri

function getFirstAvailableDate(): Date {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + 3); // Start 3 days from now
  
  // If the 3-day mark falls on Sat (6) or Sun (0), find next allowed day
  while (!ALLOWED_FITTING_DAYS.includes(targetDate.getDay())) {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  
  return targetDate;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(date: Date): string {
  return `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

function getNextFittingDay(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  // Skip Saturday (6), Sunday (0)
  while (!ALLOWED_FITTING_DAYS.includes(next.getDay())) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function isDayBusy(date: Date, busyTimes: Array<{start?: string | null, end?: string | null}>): boolean {
  return busyTimes.some(busy => {
    if (!busy.start || !busy.end) return false;
    const busyStart = new Date(busy.start);
    const busyEnd = new Date(busy.end);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    return busyStart < dayEnd && busyEnd > dayStart;
  });
}

export async function getAvailableFittingDates(weeksAhead: number = 6, daysNeeded: number = 1): Promise<AvailableSlot[]> {
  try {
    const calendar = await getUncachableGoogleCalendarClient();
    
    const startDate = getFirstAvailableDate();
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (weeksAhead * 7));
    
    const eventsResponse = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    });

    const events = eventsResponse.data.items || [];
    const busyTimes: Array<{start?: string | null, end?: string | null}> = events
      .filter(event => event.status !== 'cancelled')
      .map(event => ({
        start: event.start?.dateTime || event.start?.date || null,
        end: event.end?.dateTime || event.end?.date || null,
      }));
    
    console.log(`Google Calendar: Found ${busyTimes.length} events between ${startDate.toISOString().split('T')[0]} and ${endDate.toISOString().split('T')[0]}`);
    
    // First, collect all available individual fitting days
    const availableDays: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      if (ALLOWED_FITTING_DAYS.includes(currentDate.getDay())) {
        if (!isDayBusy(currentDate, busyTimes)) {
          availableDays.push(new Date(currentDate));
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // For single-day jobs, return all available days
    if (daysNeeded <= 1) {
      return availableDays.map(date => ({
        date: date.toISOString().split('T')[0],
        dayOfWeek: DAY_NAMES[date.getDay()],
        displayDate: formatDate(date)
      }));
    }
    
    // For multi-day jobs, find consecutive available fitting days
    const availableSlots: AvailableSlot[] = [];
    const availableDateStrings = new Set(availableDays.map(d => d.toISOString().split('T')[0]));
    
    for (const startDay of availableDays) {
      // Check if we have enough consecutive fitting days starting from this day
      const consecutiveDays: Date[] = [startDay];
      let checkDate = startDay;
      
      while (consecutiveDays.length < daysNeeded) {
        const nextDay = getNextFittingDay(checkDate);
        const nextDayStr = nextDay.toISOString().split('T')[0];
        
        if (!availableDateStrings.has(nextDayStr)) {
          break; // Next fitting day is not available
        }
        
        consecutiveDays.push(nextDay);
        checkDate = nextDay;
      }
      
      // If we found enough consecutive days, add this as an available slot
      if (consecutiveDays.length >= daysNeeded) {
        const lastDay = consecutiveDays[consecutiveDays.length - 1];
        availableSlots.push({
          date: startDay.toISOString().split('T')[0],
          dayOfWeek: DAY_NAMES[startDay.getDay()],
          displayDate: `${formatDate(startDay)} - ${formatDate(lastDay)}`,
          endDate: lastDay.toISOString().split('T')[0],
          endDisplayDate: formatDate(lastDay)
        });
      }
    }
    
    return availableSlots;
  } catch (error) {
    console.error('Error fetching calendar availability:', error);
    return generateFallbackSlots(daysNeeded);
  }
}

export interface FittingBookingDetails {
  customerName: string;
  customerEmail: string;
  mobile?: string;
  postcode?: string;
  address?: string;
  doorStyle: string;
  totalDoors: string;
  grandTotal: string;
  depositPaid: string;
  fittingDateISO: string;
  fittingEndDateISO?: string;
  fittingDateDisplay: string;
  doorSizes?: string;
  balancePaymentUrl?: string;
  bathroomLocks?: string;
}

function addOneDay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function parseDateStr(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function groupConsecutiveDays(days: string[]): string[][] {
  if (days.length === 0) return [];
  const groups: string[][] = [[days[0]]];
  for (let i = 1; i < days.length; i++) {
    if (addOneDay(days[i - 1]) === days[i]) {
      groups[groups.length - 1].push(days[i]);
    } else {
      groups.push([days[i]]);
    }
  }
  return groups;
}

function getFittingDaysBetween(startISO: string, endISO: string): string[] {
  const start = parseDateStr(startISO);
  const end = parseDateStr(endISO);
  const days: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    if (ALLOWED_FITTING_DAYS.includes(current.getDay())) {
      days.push(toDateStr(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export async function createFittingBooking(details: FittingBookingDetails): Promise<string | null> {
  try {
    if (!details.fittingDateISO || !/^\d{4}-\d{2}-\d{2}$/.test(details.fittingDateISO)) {
      console.error('Invalid fitting date format:', details.fittingDateISO);
      return null;
    }

    const calendar = await getUncachableGoogleCalendarClient();

    const lastDay = details.fittingEndDateISO && /^\d{4}-\d{2}-\d{2}$/.test(details.fittingEndDateISO)
      ? details.fittingEndDateISO
      : details.fittingDateISO;

    const fittingDays = getFittingDaysBetween(details.fittingDateISO, lastDay);
    if (fittingDays.length === 0) {
      console.error('No fitting days found between', details.fittingDateISO, 'and', lastDay);
      return null;
    }
    const totalFittingDays = fittingDays.length;

    const doorSizesLines: string[] = [];
    if (details.doorSizes) {
      doorSizesLines.push('');
      doorSizesLines.push('Door Sizes:');
      const entries = details.doorSizes.split(' | ');
      for (const entry of entries) {
        doorSizesLines.push(`  ${entry}`);
      }
    }

    const balanceDue = (parseFloat(details.grandTotal) - parseFloat(details.depositPaid)).toFixed(0);

    const descriptionLines = [
      `Customer: ${details.customerName}`,
      `Email: ${details.customerEmail}`,
      details.mobile ? `Mobile: ${details.mobile}` : null,
      ``,
      `Door Style: ${details.doorStyle}`,
      `Total Doors: ${details.totalDoors}`,
      parseInt(details.bathroomLocks || '0') > 0 ? `Bathroom Privacy Locks: ${details.bathroomLocks}` : null,
      ...doorSizesLines,
      ``,
      `Quote Total: \u00A3${details.grandTotal}`,
      `Deposit Paid: \u00A3${details.depositPaid}`,
      `Balance Due: \u00A3${balanceDue}`,
      details.balancePaymentUrl ? `` : null,
      details.balancePaymentUrl ? `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501` : null,
      details.balancePaymentUrl ? `BALANCE PAYMENT LINK (\u00A3${balanceDue}):` : null,
      details.balancePaymentUrl ? details.balancePaymentUrl : null,
      details.balancePaymentUrl ? `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501` : null,
    ].filter(line => line !== null).join('\n');

    let firstEventId: string | null = null;
    const summary = `${details.totalDoors}\uD83D\uDEAA ${details.customerName} \u00A3${details.grandTotal}`;

    if (totalFittingDays === 1) {
      const event = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary,
          description: descriptionLines,
          location: details.address || undefined,
          colorId: '10',
          start: { date: fittingDays[0] },
          end: { date: addOneDay(fittingDays[0]) },
          reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 1440 }] },
        },
      });
      console.log(`Google Calendar event created: ${event.data.id} for ${fittingDays[0]}`);
      firstEventId = event.data.id || null;
    } else {
      const groups = groupConsecutiveDays(fittingDays);

      if (groups.length === 1) {
        const firstDay = groups[0][0];
        const lastDay = groups[0][groups[0].length - 1];
        const event = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary,
            description: descriptionLines,
            location: details.address || undefined,
            colorId: '10',
            start: { date: firstDay },
            end: { date: addOneDay(lastDay) },
            reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 1440 }] },
          },
        });
        console.log(`Google Calendar spanning event created: ${event.data.id} for ${firstDay} to ${lastDay}`);
        firstEventId = event.data.id || null;
      } else {
        let dayCounter = 0;
        for (const group of groups) {
          const firstDay = group[0];
          const lastDay = group[group.length - 1];
          const dayStart = dayCounter + 1;
          const dayEnd = dayCounter + group.length;
          const dayLabel = group.length === 1
            ? ` (Day ${dayStart} of ${totalFittingDays})`
            : ` (Days ${dayStart}-${dayEnd} of ${totalFittingDays})`;

          const event = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
              summary: `${summary}${dayLabel}`,
              description: descriptionLines,
              location: details.address || undefined,
              colorId: '10',
              start: { date: firstDay },
              end: { date: addOneDay(lastDay) },
              reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 1440 }] },
            },
          });
          console.log(`Google Calendar event created: ${event.data.id} for ${firstDay}-${lastDay}${dayLabel}`);
          if (dayCounter === 0) firstEventId = event.data.id || null;
          dayCounter += group.length;
        }
      }
    }

    return firstEventId;
  } catch (error) {
    console.error('Error creating Google Calendar booking:', error);
    return null;
  }
}

function generateFallbackSlots(daysNeeded: number = 1): AvailableSlot[] {
  const startDate = getFirstAvailableDate();
  
  // Collect all fitting days in the next 30 days
  const allFittingDays: Date[] = [];
  for (let i = 0; i < 45; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    if (ALLOWED_FITTING_DAYS.includes(date.getDay())) {
      allFittingDays.push(new Date(date));
    }
  }
  
  // For single-day jobs
  if (daysNeeded <= 1) {
    return allFittingDays.slice(0, 20).map(date => ({
      date: date.toISOString().split('T')[0],
      dayOfWeek: DAY_NAMES[date.getDay()],
      displayDate: formatDate(date)
    }));
  }
  
  // For multi-day jobs, find consecutive fitting days
  const slots: AvailableSlot[] = [];
  const dateStrings = new Set(allFittingDays.map(d => d.toISOString().split('T')[0]));
  
  for (const startDay of allFittingDays) {
    const consecutiveDays: Date[] = [startDay];
    let checkDate = startDay;
    
    while (consecutiveDays.length < daysNeeded) {
      const nextDay = getNextFittingDay(checkDate);
      if (!dateStrings.has(nextDay.toISOString().split('T')[0])) break;
      consecutiveDays.push(nextDay);
      checkDate = nextDay;
    }
    
    if (consecutiveDays.length >= daysNeeded) {
      const lastDay = consecutiveDays[consecutiveDays.length - 1];
      slots.push({
        date: startDay.toISOString().split('T')[0],
        dayOfWeek: DAY_NAMES[startDay.getDay()],
        displayDate: `${formatDate(startDay)} - ${formatDate(lastDay)}`,
        endDate: lastDay.toISOString().split('T')[0],
        endDisplayDate: formatDate(lastDay)
      });
    }
    
    if (slots.length >= 15) break;
  }
  
  return slots;
}
