import React from 'react';
import { Calendar, MapPin, Hourglass, ArrowRight, Bell, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Faculty, ScheduleSlot } from '../data/schedule';
import { formatTimeString, JS_DAY_MAP, getSecondsDifference, timeToMinutes } from '../utils/timeUtils';
import { FacultyAvatar } from './FacultyAvatar';

interface NextConsultationCardProps {
  is24Hour: boolean;
  onSelectFaculty: (faculty: any) => void;
  realTime: Date;
  isSimulatingTime: boolean;
  simulatedTime: { day: string; time: string };
  faculties: Faculty[];
}

export const NextConsultationCard: React.FC<NextConsultationCardProps> = ({
  is24Hour,
  onSelectFaculty,
  realTime,
  isSimulatingTime,
  simulatedTime,
  faculties
 }) => {
  // Calculate the absolute soonest consultation in real-time
  const getRealTimeNextConsultation = () => {
    let currentDayName = '';
    let currentHours = 0;
    let currentMinutes = 0;
    const currentSeconds = isSimulatingTime ? 0 : realTime.getSeconds();

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

    // First, look for any live sessions
    let liveSession: { faculty: Faculty; slot: ScheduleSlot; secondsRemaining: number; dayDifference: number; isLive: boolean } | null = null;
    let minLiveEndDiff = Infinity;

    for (const faculty of faculties) {
      for (const slot of faculty.schedule) {
        const slotDayIndex = JS_DAY_MAP.indexOf(slot.day);
        if (slotDayIndex === -1) continue;
        
        const slotStartWeekSecs = slotDayIndex * 24 * 3600 + timeToMinutes(slot.startTime) * 60;
        const slotEndWeekSecs = slotDayIndex * 24 * 3600 + timeToMinutes(slot.endTime) * 60;
        
        if (currWeekSecs >= slotStartWeekSecs && currWeekSecs < slotEndWeekSecs) {
          const secsLeft = slotEndWeekSecs - currWeekSecs;
          if (secsLeft < minLiveEndDiff) {
            minLiveEndDiff = secsLeft;
            liveSession = {
              faculty,
              slot,
              secondsRemaining: secsLeft,
              dayDifference: 0,
              isLive: true
            };
          }
        }
      }
    }

    // If there is a live session, return it immediately
    if (liveSession) {
      return liveSession;
    }

    // If no live sessions, find the closest upcoming slot
    let bestNext: { faculty: Faculty; slot: ScheduleSlot; secondsRemaining: number; dayDifference: number; isLive: boolean } | null = null;
    let minDiff = Infinity;

    for (const faculty of faculties) {
      for (const slot of faculty.schedule) {
        const slotDayIndex = JS_DAY_MAP.indexOf(slot.day);
        if (slotDayIndex === -1) continue;
        
        const slotStartWeekSecs = slotDayIndex * 24 * 3600 + timeToMinutes(slot.startTime) * 60;
        
        const diff = getSecondsDifference(currWeekSecs, slotStartWeekSecs);
        if (diff < minDiff) {
          minDiff = diff;
          
          let dayDiff = slotDayIndex - currentDayIndex;
          if (dayDiff < 0) dayDiff += 7;
          if (dayDiff === 0 && currWeekSecs > slotStartWeekSecs) {
            dayDiff = 7;
          }
          
          bestNext = {
            faculty,
            slot,
            secondsRemaining: diff,
            dayDifference: dayDiff,
            isLive: false
          };
        }
      }
    }

    return bestNext;
  };

  const nextConsult = getRealTimeNextConsultation();

  if (!nextConsult) {
    return (
      <div className="glass-panel-heavy rounded-3xl p-6 border border-slate-200/60 dark:border-zinc-800/60 shadow-lg relative overflow-hidden h-full flex flex-col justify-between glow-blue">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500" />
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Hourglass className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-slate-500">
              Next Consultation
            </h2>
          </div>
          <div className="text-center py-12 px-4">
            <Sparkles className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">
              No Upcoming Slots Found
            </p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
              Check back later for active schedules.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { faculty, slot, secondsRemaining, dayDifference, isLive } = nextConsult;

  // Format starts in countdown
  const formatStartsIn = (seconds: number): string => {
    if (seconds < 60) {
      return `Starts in 00h 00m ${seconds.toString().padStart(2, '0')}s`;
    }
    const minutes = Math.ceil(seconds / 60);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    
    if (h >= 24) {
      const d = Math.floor(h / 24);
      const rh = h % 24;
      return `Starts in ${d}d ${rh.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
    }
    return `Starts in ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
  };

  // Format ends in countdown
  const formatEndsIn = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `Ends in ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  // Label relative day
  const getDayLabel = (slotDay: string, dayDiff: number) => {
    if (dayDiff === 0) return `Today (${slotDay})`;
    if (dayDiff === 1) return `Tomorrow (${slotDay})`;
    return slotDay;
  };

  return (
    <div className="glass-panel-heavy rounded-3xl p-6 border border-slate-200/60 dark:border-zinc-800/60 shadow-lg relative overflow-hidden h-full flex flex-col justify-between glow-blue">
      {/* Decorative gradient top bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-500" />
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-500 animate-swing" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Next Consultation
            </h2>
          </div>
          <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/10 flex items-center gap-1">
            <Hourglass className="w-3 h-3 text-blue-500 animate-pulse" />
            Active Alert
          </span>
        </div>

        {/* Big countdown display */}
        <div className="mb-4">
          <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
            {isLive ? 'Current Status' : 'Countdown Timer'}
          </p>
          <div className="mt-1 flex flex-col">
            <span className="text-sm font-semibold text-slate-800 dark:text-zinc-300">
              {getDayLabel(slot.day, dayDifference)}
            </span>
            <span className="text-sm font-mono font-bold text-slate-600 dark:text-zinc-400">
              {formatTimeString(slot.startTime, is24Hour)}
            </span>
            <h3 className={`text-xl font-display font-black tracking-tight leading-tight mt-1 flex items-center gap-2 ${
              isLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${isLive ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
              {isLive ? formatEndsIn(secondsRemaining) : formatStartsIn(secondsRemaining)}
            </h3>
          </div>
        </div>

        {/* Informative visual card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => onSelectFaculty(faculty)}
          className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800/50 hover:bg-slate-100/70 dark:hover:bg-zinc-900/80 cursor-pointer transition-all duration-300"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-display font-black text-base text-slate-800 dark:text-zinc-250">
                {faculty.name} ({faculty.initial})
              </h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Course: {faculty.courses.join(', ')}
              </p>
            </div>
            
            <FacultyAvatar faculty={faculty} className="w-10 h-10 text-xs shadow-md flex-none" />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200/50 dark:border-zinc-800/50 text-xs">
            <div>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold font-mono">Location</p>
              <div className="flex items-center gap-1 mt-0.5 font-semibold text-slate-700 dark:text-zinc-300">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span>Room {faculty.room}</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold font-mono">Schedule Time</p>
              <div className="flex items-center gap-1 mt-0.5 font-semibold text-slate-700 dark:text-zinc-300">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>{getDayLabel(slot.day, dayDifference)}, {formatTimeString(slot.startTime, is24Hour)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-900 flex justify-between items-center text-xs">
        <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
          NEXT CONSULTATION ENGAGEMENT
        </span>
        <button 
          onClick={() => onSelectFaculty(faculty)}
          className="text-blue-500 font-semibold flex items-center gap-1 hover:gap-1.5 transition-all cursor-pointer"
        >
          View Bio <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
