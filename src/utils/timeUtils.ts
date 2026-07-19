import { Faculty, ScheduleSlot } from '../data/schedule';

// Maps JavaScript Date.getDay() to our schedule days
export const JS_DAY_MAP: Array<'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'> = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export interface FacultyStatusInfo {
  status: 'live' | 'upcoming' | 'ended';
  statusLabel: string;
  badgeColor: string;
  secondsRemaining: number;
  countdownStr: string;
  currentSlot: ScheduleSlot | null;
  nextSlot: ScheduleSlot | null;
  nextSlotDay: string;
  nextSlotTime: string;
}

/**
 * Format helper for Ends in / Starts in countdowns (HHh MMm SSs)
 */
export function formatHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
}

/**
 * Format helper for longer countdowns (X Days Y Hours Z Minutes)
 */
export function formatDHMS(totalSeconds: number): string {
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  
  const parts = [];
  if (d > 0) parts.push(`${d} Day${d > 1 ? 's' : ''}`);
  if (h > 0) parts.push(`${h} Hour${h > 1 ? 's' : ''}`);
  if (m > 0 || (d === 0 && h === 0)) parts.push(`${m} Minute${m > 1 ? 's' : ''}`);
  return parts.join(' ');
}

/**
 * Calculates absolute difference in seconds from one week second to another, wrapping around
 */
export function getSecondsDifference(fromWeekSecs: number, toWeekSecs: number): number {
  let diff = toWeekSecs - fromWeekSecs;
  if (diff < 0) {
    diff += 604800; // wrap around 1 week (7 * 24 * 60 * 60)
  }
  return diff;
}

/**
 * Retrieves the comprehensive real-time status details for a faculty member.
 */
export function getFacultyStatusInfo(
  faculty: Faculty,
  realTime: Date,
  isSimulatingTime: boolean,
  simulatedTime: { day: string; time: string }
): FacultyStatusInfo {
  let currentDayName = '';
  let currentHours = 0;
  let currentMinutes = 0;
  const currentSeconds = realTime.getSeconds();

  if (isSimulatingTime) {
    currentDayName = simulatedTime.day;
    const [h, m] = simulatedTime.time.split(':').map(Number);
    currentHours = h;
    currentMinutes = m;
  } else {
    currentDayName = JS_DAY_MAP[realTime.getDay()];
    currentHours = realTime.getHours();
    currentMinutes = realTime.getMinutes();
  }

  const currentDayIndex = JS_DAY_MAP.indexOf(currentDayName as any);
  const currWeekSecs = currentDayIndex * 24 * 3600 + currentHours * 3600 + currentMinutes * 60 + currentSeconds;

  // 1. Check for Active / Live Slot
  let activeSlot: ScheduleSlot | null = null;
  let activeEndWeekSecs = 0;
  for (const slot of faculty.schedule) {
    const slotDayIndex = JS_DAY_MAP.indexOf(slot.day);
    if (slotDayIndex === -1) continue;
    const slotStartWeekSecs = slotDayIndex * 24 * 3600 + timeToMinutes(slot.startTime) * 60;
    const slotEndWeekSecs = slotDayIndex * 24 * 3600 + timeToMinutes(slot.endTime) * 60;

    if (currWeekSecs >= slotStartWeekSecs && currWeekSecs < slotEndWeekSecs) {
      activeSlot = slot;
      activeEndWeekSecs = slotEndWeekSecs;
      break;
    }
  }

  if (activeSlot) {
    const secondsRemaining = activeEndWeekSecs - currWeekSecs;
    
    // Find next slot following the active one
    let nextSlot: ScheduleSlot | null = null;
    let minDiff = Infinity;
    for (const slot of faculty.schedule) {
      if (slot === activeSlot) continue;
      const slotDayIndex = JS_DAY_MAP.indexOf(slot.day);
      const slotStartWeekSecs = slotDayIndex * 24 * 3600 + timeToMinutes(slot.startTime) * 60;
      const diff = getSecondsDifference(activeEndWeekSecs, slotStartWeekSecs);
      if (diff < minDiff) {
        minDiff = diff;
        nextSlot = slot;
      }
    }

    return {
      status: 'live',
      statusLabel: 'Live Now',
      badgeColor: 'emerald',
      secondsRemaining,
      countdownStr: formatHMS(secondsRemaining),
      currentSlot: activeSlot,
      nextSlot,
      nextSlotDay: nextSlot ? nextSlot.day : '',
      nextSlotTime: nextSlot ? nextSlot.startTime : ''
    };
  }

  // 2. Find soonest upcoming slot
  let soonestSlot: ScheduleSlot | null = null;
  let minUpcomingDiff = Infinity;
  for (const slot of faculty.schedule) {
    const slotDayIndex = JS_DAY_MAP.indexOf(slot.day);
    if (slotDayIndex === -1) continue;
    const slotStartWeekSecs = slotDayIndex * 24 * 3600 + timeToMinutes(slot.startTime) * 60;
    const diff = getSecondsDifference(currWeekSecs, slotStartWeekSecs);
    if (diff < minUpcomingDiff) {
      minUpcomingDiff = diff;
      soonestSlot = slot;
    }
  }

  if (soonestSlot) {
    const isToday = soonestSlot.day === currentDayName;
    
    // Check if starts today later, or if today has ended
    if (isToday) {
      return {
        status: 'upcoming',
        statusLabel: 'Starts in',
        badgeColor: 'amber',
        secondsRemaining: minUpcomingDiff,
        countdownStr: formatHMS(minUpcomingDiff),
        currentSlot: null,
        nextSlot: soonestSlot,
        nextSlotDay: soonestSlot.day,
        nextSlotTime: soonestSlot.startTime
      };
    } else {
      return {
        status: 'ended',
        statusLabel: 'Ended',
        badgeColor: 'rose',
        secondsRemaining: minUpcomingDiff,
        countdownStr: formatDHMS(minUpcomingDiff),
        currentSlot: null,
        nextSlot: soonestSlot,
        nextSlotDay: soonestSlot.day,
        nextSlotTime: soonestSlot.startTime
      };
    }
  }

  return {
    status: 'ended',
    statusLabel: 'Ended',
    badgeColor: 'rose',
    secondsRemaining: 0,
    countdownStr: '',
    currentSlot: null,
    nextSlot: null,
    nextSlotDay: '',
    nextSlotTime: ''
  };
}

/**
 * Convert "HH:MM" string to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Format minutes from midnight to "HH:MM" or "hh:mm AM/PM"
 */
export function formatMinutes(minutes: number, is24Hour: boolean = false): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const minsStr = m.toString().padStart(2, '0');

  if (is24Hour) {
    return `${h.toString().padStart(2, '0')}:${minsStr}`;
  } else {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:${minsStr} ${ampm}`;
  }
}

/**
 * Format a standard "HH:MM" string according to user's 12/24 hour setting
 */
export function formatTimeString(timeStr: string, is24Hour: boolean = false): string {
  return formatMinutes(timeToMinutes(timeStr), is24Hour);
}

/**
 * Determines if a faculty is currently available
 * Returns the active slot if available, otherwise null
 */
export function getActiveConsultation(faculty: Faculty, currentDay: string, currentTimeStr: string): ScheduleSlot | null {
  const currentMins = timeToMinutes(currentTimeStr);
  
  for (const slot of faculty.schedule) {
    if (slot.day === currentDay) {
      const startMins = timeToMinutes(slot.startTime);
      const endMins = timeToMinutes(slot.endTime);
      
      if (currentMins >= startMins && currentMins < endMins) {
        return slot;
      }
    }
  }
  return null;
}

export interface NextConsultationInfo {
  faculty: Faculty;
  slot: ScheduleSlot;
  minutesRemaining: number;
  startsToday: boolean;
  dayDifference: number;
}

/**
 * Finds the absolute next consultation slot overall
 */
export function getNextConsultation(faculties: Faculty[], currentDay: string, currentTimeStr: string): NextConsultationInfo | null {
  const currentMins = timeToMinutes(currentTimeStr);
  const currentDayIndex = JS_DAY_MAP.indexOf(currentDay as any);
  
  let soonestInfo: NextConsultationInfo | null = null;
  
  for (const faculty of faculties) {
    for (const slot of faculty.schedule) {
      const slotDayIndex = JS_DAY_MAP.indexOf(slot.day as any);
      if (slotDayIndex === -1) continue;
      
      let dayDiff = slotDayIndex - currentDayIndex;
      if (dayDiff < 0) {
        dayDiff += 7; // Wrap around to next week
      }
      
      const startMins = timeToMinutes(slot.startTime);
      
      // Calculate total minutes until this slot starts
      let totalMinsUntil = 0;
      if (dayDiff === 0) {
        // Same day
        if (startMins > currentMins) {
          totalMinsUntil = startMins - currentMins;
        } else {
          // Already passed today, is next week
          totalMinsUntil = (7 * 24 * 60) - (currentMins - startMins);
          dayDiff = 7;
        }
      } else {
        // Future day
        totalMinsUntil = (dayDiff * 24 * 60) + (startMins - currentMins);
      }
      
      if (soonestInfo === null || totalMinsUntil < soonestInfo.minutesRemaining) {
        soonestInfo = {
          faculty,
          slot,
          minutesRemaining: totalMinsUntil,
          startsToday: dayDiff === 0,
          dayDifference: dayDiff
        };
      }
    }
  }
  
  return soonestInfo;
}

/**
 * Filter schedule slots for a specific day
 */
export function getDaySchedule(faculty: Faculty, day: string): ScheduleSlot[] {
  return faculty.schedule
    .filter(slot => slot.day === day)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}
