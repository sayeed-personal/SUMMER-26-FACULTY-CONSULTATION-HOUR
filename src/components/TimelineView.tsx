import React, { useState } from 'react';
import { Clock, MapPin, Mail, Sparkles, Copy, Check, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Faculty, ALL_DAYS, DAY_COLORS } from '../data/schedule';
import { formatTimeString, timeToMinutes, getFacultyStatusInfo } from '../utils/timeUtils';
import { FacultyAvatar } from './FacultyAvatar';
import { haptic } from '../utils/haptic';

interface TimelineViewProps {
  faculties: Faculty[];
  is24Hour: boolean;
  onSelectFaculty: (faculty: Faculty) => void;
  favorites: string[];
  selectedDay: string;
  onSelectDay: (day: 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday') => void;
  realTime: Date;
  isSimulatingTime: boolean;
  simulatedTime: { day: string; time: string };
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  faculties,
  is24Hour,
  onSelectFaculty,
  favorites,
  selectedDay,
  onSelectDay,
  realTime,
  isSimulatingTime,
  simulatedTime
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group and sort active slots for the selected day
  const getTimelineData = () => {
    const slotsMap: Record<string, Array<{ faculty: Faculty; slot: any }>> = {};

    faculties.forEach(faculty => {
      faculty.schedule.forEach(slot => {
        if (slot.day === selectedDay) {
          if (!slotsMap[slot.startTime]) {
            slotsMap[slot.startTime] = [];
          }
          slotsMap[slot.startTime].push({ faculty, slot });
        }
      });
    });

    // Sort the start times chronologically
    const sortedTimes = Object.keys(slotsMap).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));

    return sortedTimes.map(time => ({
      startTime: time,
      consultations: slotsMap[time]
    }));
  };

  const timelineBlocks = getTimelineData();
  const dayColors = DAY_COLORS[selectedDay] || { accent: 'bg-blue-500' };

  return (
    <div className="space-y-6">
      {/* Day Selector segmented control (Apple style) */}
      <div className="p-1 rounded-xl bg-slate-100 dark:bg-zinc-900/60 flex overflow-x-auto no-scrollbar gap-1 border border-slate-200/40 dark:border-zinc-800/40">
        {ALL_DAYS.map((day) => {
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => {
                haptic.medium();
                onSelectDay(day as any);
              }}
              className={`flex-1 min-w-[75px] md:min-w-0 text-center py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer truncate ${
                isSelected
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 shadow-xs scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-350'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          );
        })}
      </div>

      {/* Vertical Timeline Card Block */}
      <div className="relative border-l-2 border-slate-200/60 dark:border-zinc-800/60 pl-6 md:pl-8 ml-4 md:ml-6 space-y-8 py-2">
        <AnimatePresence mode="popLayout">
          {timelineBlocks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center bg-white/40 dark:bg-zinc-900/10 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl"
            >
              <Sparkles className="w-10 h-10 mx-auto text-slate-350 dark:text-zinc-750 mb-2" />
              <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">
                No Consultations Scheduled
              </p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                All faculty are busy with exams, grading, or off-duty for {selectedDay}.
              </p>
            </motion.div>
          ) : (
            timelineBlocks.map(({ startTime, consultations }, idx) => {
              return (
                <motion.div
                  key={startTime}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="relative group"
                >
                  {/* Timeline Node Ring */}
                  <div className={`absolute -left-[35px] md:-left-[43px] top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-zinc-950 ${dayColors.accent} ring-4 ring-slate-100 dark:ring-zinc-900/40 z-10`} />

                  {/* Hour Indicator */}
                  <div className="mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="font-mono font-black text-sm md:text-base text-slate-900 dark:text-zinc-100 uppercase tracking-tight">
                      {formatTimeString(startTime, is24Hour)}
                    </span>
                    <span className="h-[1px] flex-1 bg-slate-200/50 dark:bg-zinc-800/40" />
                  </div>

                  {/* Vertical Stack of matching consultations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {consultations.map(({ faculty, slot }, cIdx) => {
                      const isFav = favorites.includes(faculty.id);
                      const copyKey = `${faculty.id}-${startTime}-room`;
                      
                      const statusInfo = getFacultyStatusInfo(faculty, realTime, isSimulatingTime, simulatedTime);
                      const isLive = statusInfo.status === 'live';

                      return (
                        <motion.div
                          key={faculty.id}
                          id={`consultation-card-${faculty.id}-${slot.startTime}`}
                          whileHover={{ scale: 1.015, y: -2 }}
                          onClick={() => onSelectFaculty(faculty)}
                          className={`p-3.5 rounded-xl glass-panel border hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between group shadow-sm ${
                            isLive
                              ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.18)] dark:border-emerald-500/60 dark:shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-emerald-50/5 dark:bg-emerald-950/5'
                              : 'border-slate-200/65 dark:border-zinc-800/50 hover:border-blue-500/30'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-2.5">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <FacultyAvatar faculty={faculty} className="w-10 h-10 text-xs shadow-md flex-none" isLive={isLive} />
                                  {isLive && (
                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white dark:border-zinc-900"></span>
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="font-display font-black text-sm md:text-base text-slate-800 dark:text-zinc-50 leading-tight tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                      {faculty.name}
                                    </h4>
                                    <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-400 fill-amber-400' : 'text-transparent'}`} />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <hr className="border-slate-100 dark:border-zinc-800/70 mb-2.5" />

                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                              {/* Location */}
                              <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300 font-semibold font-mono">
                                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Room {faculty.room}</span>
                                <button
                                  onClick={(e) => copyToClipboard(faculty.room, copyKey, e)}
                                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                                  title="Copy room number"
                                >
                                  {copiedId === copyKey ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>

                              {/* Duration info */}
                              <div className="flex items-center gap-1 font-semibold text-slate-500 dark:text-zinc-400 font-mono">
                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                <span>{slot.startTime} – {slot.endTime}</span>
                              </div>
                            </div>
                          </div>

                          {/* Premium Real-Time Status HUD */}
                          <div className="mt-2.5 p-2 rounded-lg bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-150 dark:border-zinc-800/40 flex flex-col gap-1 text-[10px] font-mono">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-wider">Status</span>
                              <span className={`font-black flex items-center gap-1 uppercase tracking-wide ${
                                isLive ? 'text-emerald-600 dark:text-emerald-450 font-extrabold' :
                                statusInfo.status === 'upcoming' ? 'text-amber-600 dark:text-amber-450 font-extrabold' :
                                'text-rose-600 dark:text-rose-450'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isLive ? 'bg-emerald-500 animate-pulse' :
                                  statusInfo.status === 'upcoming' ? 'bg-amber-500 animate-pulse' :
                                  'bg-rose-500'
                                }`}></span>
                                {statusInfo.statusLabel}
                              </span>
                            </div>
                            
                            {statusInfo.secondsRemaining > 0 && (
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800/20">
                                <span className="text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-wider">
                                  {isLive ? 'Ends In' : 'Starts In'}
                                </span>
                                <span className="font-extrabold text-slate-700 dark:text-zinc-300">
                                  {statusInfo.countdownStr}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-slate-150 dark:border-zinc-800/25">
                              <span className="text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-wider">Next Session</span>
                              <span className="font-semibold text-slate-600 dark:text-zinc-400 truncate max-w-[120px] text-right">
                                {statusInfo.nextSlot ? `${statusInfo.nextSlot.day.slice(0,3)} ${formatTimeString(statusInfo.nextSlot.startTime, is24Hour)}` : 'None'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/60">
                            {/* Course affiliations */}
                            <div className="flex gap-1">
                              {faculty.courses.slice(0, 2).map(c => (
                                <span key={c} className="text-[9px] font-bold font-mono bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-500">
                                  {c}
                                </span>
                              ))}
                            </div>

                            {/* Contact & Appt info */}
                            <div className="flex items-center gap-2">
                              {slot.byAppointment && (
                                <span className="text-[8px] font-black tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase font-mono">
                                  Appointment
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `mailto:${faculty.email}`;
                                }}
                                className="p-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:text-blue-400 transition-all cursor-pointer"
                                title="Contact professor"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
