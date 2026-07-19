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
