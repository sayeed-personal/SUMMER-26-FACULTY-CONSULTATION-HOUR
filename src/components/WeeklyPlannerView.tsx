import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Mail, Clock, CalendarCheck, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Faculty, ALL_DAYS, DAY_COLORS } from '../data/schedule';
import { formatTimeString, timeToMinutes, getFacultyStatusInfo } from '../utils/timeUtils';
import { FacultyAvatar } from './FacultyAvatar';

interface WeeklyPlannerViewProps {
  faculties: Faculty[];
  is24Hour: boolean;
  onSelectFaculty: (faculty: Faculty) => void;
  favorites: string[];
  realTime: Date;
  isSimulatingTime: boolean;
  simulatedTime: { day: string; time: string };
}

export const WeeklyPlannerView: React.FC<WeeklyPlannerViewProps> = ({
  faculties,
  is24Hour,
  onSelectFaculty,
  favorites,
  realTime,
  isSimulatingTime,
  simulatedTime
}) => {
  // By default, open Saturday/Sunday or current day
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({
    Saturday: true,
    Sunday: true,
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true
  });

  React.useEffect(() => {
    const handleScrollToToday = (e: Event) => {
      const customEvent = e as CustomEvent;
      const todayDay = customEvent.detail?.day;
      if (todayDay) {
        setExpandedDays(prev => ({
          ...prev,
          [todayDay]: true
        }));
      }
    };
    window.addEventListener('scroll-to-today', handleScrollToToday);
    return () => window.removeEventListener('scroll-to-today', handleScrollToToday);
  }, []);

  const toggleDay = (day: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  // Group all slots by day
  const getSchedulesForDay = (day: typeof ALL_DAYS[number]) => {
    const list: Array<{ faculty: Faculty; slot: any }> = [];
    
    faculties.forEach(fac => {
      fac.schedule.forEach(slot => {
        if (slot.day === day) {
          list.push({ faculty: fac, slot });
        }
      });
    });

    // Sort by startTime
    return list.sort((a, b) => timeToMinutes(a.slot.startTime) - timeToMinutes(b.slot.startTime));
  };

  return (
    <div className="space-y-4">
      {ALL_DAYS.map((day, idx) => {
        const slots = getSchedulesForDay(day);
        const isOpen = expandedDays[day];
        const colors = DAY_COLORS[day] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', accent: 'bg-slate-500' };

        return (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className={`rounded-2xl border ${colors.border} ${colors.bg} backdrop-blur-md overflow-hidden shadow-xs transition-all`}
          >
            {/* Collapsible Header */}
            <button
              onClick={() => toggleDay(day)}
              className={`w-full flex items-center justify-between p-4 bg-white/40 dark:bg-zinc-900/30 hover:bg-white/60 dark:hover:bg-zinc-900/50 cursor-pointer transition-all border-b ${colors.border}`}
            >
              <div className="flex items-center gap-3">
                {/* Accent Tag */}
                <span className={`w-3.5 h-3.5 rounded-full ${colors.accent} shadow-sm`} />
                <span className="font-display font-black text-slate-800 dark:text-zinc-50 text-base md:text-lg tracking-tight">
                  {day}
                </span>
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 ${colors.text} border ${colors.border}`}>
                  {slots.length} session{slots.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-400">
                  {isOpen ? 'COLLAPSE' : 'EXPAND'}
                </span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {slots.length === 0 ? (
                      <div className="col-span-full py-8 text-center bg-white/40 dark:bg-zinc-900/10 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                        <CalendarCheck className="w-6 h-6 text-slate-350 dark:text-zinc-650 mx-auto mb-1.5" />
                        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">No scheduled consultations</p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Faculty rest day or seminar sessions</p>
                      </div>
                    ) : (
                      slots.map(({ faculty, slot }, sIdx) => {
                        const isFavorite = favorites.includes(faculty.id);
                        return (
                          <motion.div
                            key={`${faculty.id}-${slot.startTime}`}
                            id={`planner-card-${faculty.id}-${slot.startTime}`}
                            whileHover={{ y: -3, scale: 1.01 }}
                            onClick={() => onSelectFaculty(faculty)}
                            className="p-4 rounded-2xl bg-white/75 dark:bg-zinc-900/75 backdrop-blur-xs border border-slate-200/50 dark:border-zinc-800/50 hover:border-blue-500/30 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between group shadow-xs relative"
                          >
                            {/* Star badge for favorite */}
                            {isFavorite && (
                              <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-amber-400" />
                            )}

                            <div>
                              {/* Header info */}
                              <div className="flex items-center gap-2.5 mb-3">
                                <FacultyAvatar faculty={faculty} className="w-9 h-9 text-xs shadow-sm flex-none" />
                                <div className="min-w-0">
                                  <h4 className="font-display font-black text-sm text-slate-800 dark:text-zinc-200 tracking-tight truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {faculty.name}
                                  </h4>
                                </div>
                              </div>

                              <hr className="border-slate-100 dark:border-zinc-800/65 mb-3" />

                              {/* Time & Room Indicators */}
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 font-semibold">
                                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                                  <span className="font-mono">
                                    {formatTimeString(slot.startTime, is24Hour)} – {formatTimeString(slot.endTime, is24Hour)}
                                  </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 font-semibold">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="font-mono">Room {faculty.room}</span>
                                  </div>

                                  {slot.byAppointment ? (
                                    <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono uppercase">
                                      Appt. Only
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono uppercase">
                                      Open Hours
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Courses List */}
                            <div className="flex flex-wrap gap-1 mt-4">
                              {faculty.courses.slice(0, 2).map(c => (
                                <span key={c} className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                                  {c}
                                </span>
                              ))}
                              {faculty.courses.length > 2 && (
                                <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-400">
                                  +{faculty.courses.length - 2}
                                </span>
                              )}
                            </div>

                            {/* Premium Real-Time Status HUD */}
                            {(() => {
                              const statusInfo = getFacultyStatusInfo(faculty, realTime, isSimulatingTime, simulatedTime);
                              return (
                                <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-150 dark:border-zinc-800/40 flex flex-col gap-1.5 text-[10px] font-mono">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-wider">Status</span>
                                    <span className={`font-black flex items-center gap-1 uppercase tracking-wide ${
                                      statusInfo.status === 'live' ? 'text-emerald-600 dark:text-emerald-450' :
                                      statusInfo.status === 'upcoming' ? 'text-amber-600 dark:text-amber-450' :
                                      'text-rose-600 dark:text-rose-450'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        statusInfo.status === 'live' ? 'bg-emerald-500 animate-pulse' :
                                        statusInfo.status === 'upcoming' ? 'bg-amber-500 animate-pulse' :
                                        'bg-rose-500'
                                      }`}></span>
                                      {statusInfo.statusLabel}
                                    </span>
                                  </div>
                                  
                                  {statusInfo.secondsRemaining > 0 && (
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800/20">
                                      <span className="text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-wider">
                                        {statusInfo.status === 'live' ? 'Ends In' : 'Starts In'}
                                      </span>
                                      <span className="font-extrabold text-slate-700 dark:text-zinc-300">
                                        {statusInfo.countdownStr}
                                      </span>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between pt-1 border-t border-slate-150 dark:border-zinc-800/25">
                                    <span className="text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-wider">Next Session</span>
                                    <span className="font-semibold text-slate-600 dark:text-zinc-400 truncate max-w-[110px] text-right">
                                      {statusInfo.nextSlot ? `${statusInfo.nextSlot.day.slice(0,3)} ${formatTimeString(statusInfo.nextSlot.startTime, is24Hour)}` : 'None'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};
