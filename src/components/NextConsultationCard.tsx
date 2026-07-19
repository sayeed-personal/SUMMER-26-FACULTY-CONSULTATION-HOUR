import React from 'react';
import { Calendar, MapPin, Hourglass, ArrowRight, Bell, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { NextConsultationInfo } from '../utils/timeUtils';
import { formatTimeString } from '../utils/timeUtils';

interface NextConsultationCardProps {
  nextConsultInfo: NextConsultationInfo | null;
  is24Hour: boolean;
  onSelectFaculty: (faculty: any) => void;
}

export const NextConsultationCard: React.FC<NextConsultationCardProps> = ({
  nextConsultInfo,
  is24Hour,
  onSelectFaculty
}) => {
  if (!nextConsultInfo) {
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
              Add schedules in schedule.json to load consultations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { faculty, slot, minutesRemaining, startsToday, dayDifference } = nextConsultInfo;

  // Format the remaining time nicely
  const formatCountdown = () => {
    if (minutesRemaining < 60) {
      return `Starts in ${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'}`;
    }
    
    const hours = Math.floor(minutesRemaining / 60);
    const mins = minutesRemaining % 60;
    
    if (hours < 24) {
      return `Starts in ${hours} hr${hours === 1 ? '' : 's'} ${mins > 0 ? `${mins} m` : ''}`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHrs = hours % 24;
    return `Starts in ${days} day${days === 1 ? '' : 's'} ${remainingHrs > 0 ? `${remainingHrs} hr` : ''}`;
  };

  // Label relative day
  const getDayLabel = () => {
    if (dayDifference === 0) return 'Today';
    if (dayDifference === 1) return 'Tomorrow';
    return slot.day;
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
              Upcoming Slot
            </h2>
          </div>
          <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/10 flex items-center gap-1">
            <Hourglass className="w-3 h-3 text-blue-500" />
            Active Alert
          </span>
        </div>

        {/* Big countdown display */}
        <div className="mb-4">
          <p className="text-[11px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
            Countdown Timer
          </p>
          <h3 className="text-2xl font-display font-black text-slate-950 dark:text-zinc-50 tracking-tight leading-tight mt-1">
            {formatCountdown()}
          </h3>
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
            </div>
            
            <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-md">
              {faculty.initial}
            </div>
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
                <span>{getDayLabel()}, {formatTimeString(slot.startTime, is24Hour)}</span>
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
