import React, { useRef, useEffect } from 'react';
import { CalendarCheck2, Clock, MapPin, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Faculty, ALL_DAYS, DAY_COLORS } from '../data/schedule';
import { formatTimeString, timeToMinutes } from '../utils/timeUtils';

interface WeeklyCalendarViewProps {
  faculties: Faculty[];
  is24Hour: boolean;
  onSelectFaculty: (faculty: Faculty) => void;
  currentDay: string;
  currentTimeStr: string;
}

export const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({
  faculties,
  is24Hour,
  onSelectFaculty,
  currentDay,
  currentTimeStr
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Time boundaries for the calendar grid
  const START_HOUR = 8; // 08:00 AM
  const END_HOUR = 17; // 05:00 PM
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const HOUR_HEIGHT = 64; // pixels per hour in layout

  const hoursArray = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  // Helper: Get offset top in pixels from START_HOUR
  const getOffsetTop = (timeStr: string) => {
    const mins = timeToMinutes(timeStr);
    const startMins = START_HOUR * 60;
    const offsetMins = mins - startMins;
    return (offsetMins / 60) * HOUR_HEIGHT;
  };

  // Helper: Get height of a slot in pixels
  const getSlotHeight = (startTime: string, endTime: string) => {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    const duration = end - start;
    return (duration / 60) * HOUR_HEIGHT;
  };

  // Filter slots for Saturday-Thursday
  const getAllSlots = () => {
    const slots: Array<{ faculty: Faculty; slot: any; day: string }> = [];
    faculties.forEach(fac => {
      fac.schedule.forEach(slot => {
        if (ALL_DAYS.includes(slot.day as any)) {
          slots.push({ faculty: fac, slot, day: slot.day });
        }
      });
    });
    return slots;
  };

  const slots = getAllSlots();

  // Scroll to current hour on load
  useEffect(() => {
    if (containerRef.current) {
      const currentH = parseInt(currentTimeStr.split(':')[0], 10);
      if (currentH >= START_HOUR && currentH <= END_HOUR) {
        const scrollToY = (currentH - START_HOUR) * HOUR_HEIGHT - 100;
        containerRef.current.scrollTo({ top: Math.max(0, scrollToY), behavior: 'smooth' });
      }
    }
  }, []);

  // Calculate current time line top offset
  const currentTimeLineOffset = () => {
    const [h, m] = currentTimeStr.split(':').map(Number);
    if (h < START_HOUR || h > END_HOUR) return null;
    const totalMins = (h - START_HOUR) * 60 + m;
    return (totalMins / 60) * HOUR_HEIGHT;
  };

  const timeLineOffset = currentTimeLineOffset();

  return (
    <div className="glass-panel-heavy rounded-3xl p-4 md:p-6 border border-slate-200/60 dark:border-zinc-800/60 shadow-lg overflow-hidden flex flex-col h-[650px] relative">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="w-5 h-5 text-blue-500" />
          <h2 className="text-sm md:text-base font-display font-bold tracking-tight text-slate-800 dark:text-zinc-50">
            Weekly Scheduler Grid
          </h2>
          <span className="text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full">
            Apple Style Calendar
          </span>
        </div>
      </div>

      {/* Calendar Stage Wrapper (Scrollable) */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto border border-slate-100 dark:border-zinc-800 rounded-2xl relative select-none"
      >
        <div className="min-w-[800px] relative" style={{ height: `${(TOTAL_HOURS + 1) * HOUR_HEIGHT + 40}px` }}>
          
          {/* Header row: Days */}
          <div className="sticky top-0 z-30 bg-slate-50/90 dark:bg-zinc-950/95 backdrop-blur-md flex border-b border-slate-200/50 dark:border-zinc-800/80 text-center py-2 h-10">
            {/* Time label corner space */}
            <div className="w-16 flex-none border-r border-slate-200/30 dark:border-zinc-850" />
            
            {ALL_DAYS.map((day) => {
              const isToday = currentDay === day;
              const dayColors = DAY_COLORS[day] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', accent: 'bg-slate-400' };
              return (
                <div 
                  key={day} 
                  className={`flex-1 border-r border-slate-200/30 dark:border-zinc-850 flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                    isToday 
                      ? 'bg-blue-500/5 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${dayColors.accent || 'bg-slate-400'}`} />
                  <span>{day}</span>
                  {isToday && (
                    <span className="text-[8px] bg-blue-500 text-white font-mono uppercase px-1 py-0.2 rounded font-black">
                      Today
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid lines & absolute blocks */}
          <div className="absolute top-10 left-0 right-0 bottom-0 flex">
            
            {/* Time labels column */}
            <div className="w-16 flex-none relative text-right pr-2 text-[10px] font-mono font-bold text-slate-400/80 dark:text-zinc-500/80 select-none divide-y divide-transparent">
              {hoursArray.map((hour, idx) => {
                const hourMins = hour * 60;
                const displayStr = is24Hour 
                  ? `${hour.toString().padStart(2, '0')}:00` 
                  : `${hour % 12 === 0 ? 12 : hour % 12} ${hour >= 12 ? 'PM' : 'AM'}`;
                return (
                  <div 
                    key={hour} 
                    className="absolute left-0 right-0 flex items-center justify-end pr-2.5 h-6"
                    style={{ top: `${idx * HOUR_HEIGHT - 12}px` }}
                  >
                    {displayStr}
                  </div>
                );
              })}
            </div>

            {/* Grid Days Columns */}
            <div className="flex-1 flex relative divide-x divide-slate-100 dark:divide-zinc-850 border-l border-slate-100 dark:border-zinc-850">
              
              {/* background horizontal hour lines */}
              <div className="absolute inset-0 pointer-events-none">
                {hoursArray.map((hour, idx) => (
                  <div 
                    key={hour} 
                    className="absolute left-0 right-0 border-t border-slate-150 dark:border-zinc-850/60"
                    style={{ top: `${idx * HOUR_HEIGHT}px`, height: '1px' }}
                  />
                ))}
              </div>

              {/* Day column background highlights */}
              {ALL_DAYS.map((day) => {
                const isToday = currentDay === day;
                return (
                  <div 
                    key={day} 
                    className={`flex-1 h-full relative ${
                      isToday ? 'bg-blue-500/[0.015] dark:bg-blue-500/[0.03]' : ''
                    }`}
                  >
                    {/* Render matching slots inside this column */}
                    {slots
                      .filter(s => s.day === day)
                      .map(({ faculty, slot }, sIdx) => {
                        const top = getOffsetTop(slot.startTime);
                        const height = getSlotHeight(slot.startTime, slot.endTime);
                        
                        // Calendar color theme based on custom profile color
                        const profileBg = faculty.profileColor || 'bg-blue-600';
                        let colorTheme = {
                          bg: 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
                          text: 'text-blue-700 dark:text-blue-300',
                          badge: 'bg-blue-500'
                        };

                        if (profileBg.includes('emerald')) {
                          colorTheme = {
                            bg: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
                            text: 'text-emerald-700 dark:text-emerald-300',
                            badge: 'bg-emerald-500'
                          };
                        } else if (profileBg.includes('rose')) {
                          colorTheme = {
                            bg: 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
                            text: 'text-rose-700 dark:text-rose-300',
                            badge: 'bg-rose-500'
                          };
                        } else if (profileBg.includes('indigo')) {
                          colorTheme = {
                            bg: 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60',
                            text: 'text-indigo-700 dark:text-indigo-300',
                            badge: 'bg-indigo-500'
                          };
                        } else if (profileBg.includes('violet')) {
                          colorTheme = {
                            bg: 'bg-violet-50/90 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/60',
                            text: 'text-violet-700 dark:text-violet-300',
                            badge: 'bg-violet-500'
                          };
                        } else if (profileBg.includes('purple')) {
                          colorTheme = {
                            bg: 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60',
                            text: 'text-purple-700 dark:text-purple-300',
                            badge: 'bg-purple-500'
                          };
                        } else if (profileBg.includes('teal')) {
                          colorTheme = {
                            bg: 'bg-teal-50/90 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60',
                            text: 'text-teal-700 dark:text-teal-300',
                            badge: 'bg-teal-500'
                          };
                        } else if (profileBg.includes('orange')) {
                          colorTheme = {
                            bg: 'bg-orange-50/90 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60',
                            text: 'text-orange-750 dark:text-orange-305',
                            badge: 'bg-orange-500'
                          };
                        } else if (profileBg.includes('amber')) {
                          colorTheme = {
                            bg: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
                            text: 'text-amber-750 dark:text-amber-305',
                            badge: 'bg-amber-500'
                          };
                        } else if (profileBg.includes('slate')) {
                          colorTheme = {
                            bg: 'bg-slate-100/90 dark:bg-slate-900/40 border-slate-300 dark:border-slate-800/60',
                            text: 'text-slate-750 dark:text-slate-305',
                            badge: 'bg-slate-500'
                          };
                        }

                        return (
                          <motion.div
                            key={`${faculty.id}-${slot.startTime}-${sIdx}`}
                            style={{ 
                              position: 'absolute', 
                              top: `${top}px`, 
                              height: `${height}px`,
                              left: '4px',
                              right: '4px'
                            }}
                            whileHover={{ scale: 1.01, zIndex: 10 }}
                            onClick={() => onSelectFaculty(faculty)}
                            className={`rounded-xl border p-2 overflow-hidden flex flex-col justify-between text-left cursor-pointer transition-all duration-300 ${colorTheme.bg} ${colorTheme.text}`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${colorTheme.badge}`} />
                                <span className="font-display font-black text-xs">
                                  {faculty.initial}
                                </span>
                                {slot.byAppointment && (
                                  <span className="text-[7px] font-black tracking-widest text-amber-500 uppercase border border-amber-500/25 rounded px-1 scale-90">
                                    APPT
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] truncate font-medium opacity-90 mt-0.5">
                                {faculty.name}
                              </p>
                            </div>

                            <div className="flex justify-between items-center text-[9px] font-mono mt-1 opacity-80 border-t border-slate-200/30 dark:border-zinc-800/20 pt-1">
                              <span className="flex items-center gap-0.5 font-bold">
                                <MapPin className="w-2.5 h-2.5" />
                                {faculty.room}
                              </span>
                              <span>
                                {slot.startTime} – {slot.endTime}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}

                    {/* RED Apple Calendar Line: Current Time Indicator */}
                    {isToday && timeLineOffset !== null && (
                      <div 
                        className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                        style={{ top: `${timeLineOffset}px` }}
                      >
                        {/* pulsing indicator bulb */}
                        <div className="w-2 h-2 rounded-full bg-red-500 ring-4 ring-red-500/20 absolute -left-1" />
                        <div className="flex-1 h-[2px] bg-gradient-to-r from-red-500 to-transparent" />
                        <span className="absolute right-1 text-[8px] font-mono font-bold text-red-500 bg-red-100 dark:bg-red-950/80 px-1 py-0.2 rounded-sm border border-red-200/50 dark:border-red-900/30">
                          {currentTimeStr}
                        </span>
                      </div>
                    )}

                  </div>
                );
              })}

            </div>
          </div>

        </div>
      </div>
      
      {/* Footer hint */}
      <div className="mt-3 text-center">
        <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
          💡 PRO-TIP: Horizontal swiping is supported. Click any event block to read Faculty Bios.
        </p>
      </div>
    </div>
  );
};
