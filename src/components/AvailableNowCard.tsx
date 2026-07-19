import React from 'react';
import { Sparkles, MapPin, Mail, ArrowRight, Star, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Faculty, ScheduleSlot } from '../data/schedule';
import { formatTimeString } from '../utils/timeUtils';

interface AvailableNowCardProps {
  availableFaculty: Array<{ faculty: Faculty; slot: ScheduleSlot }>;
  is24Hour: boolean;
  onSelectFaculty: (faculty: Faculty) => void;
  favorites: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const AvailableNowCard: React.FC<AvailableNowCardProps> = ({
  availableFaculty,
  is24Hour,
  onSelectFaculty,
  favorites,
  onToggleFavorite
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="glass-panel-heavy rounded-3xl p-6 border border-slate-200/60 dark:border-zinc-800/60 shadow-lg relative overflow-hidden h-full flex flex-col justify-between glow-blue">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Live Now
            </h2>
          </div>
          <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/10">
            {availableFaculty.length} Available
          </span>
        </div>

        <h3 className="text-xl font-display font-bold tracking-tight text-slate-800 dark:text-zinc-50 mb-4">
          Active Consultations
        </h3>

        <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
          <AnimatePresence mode="popLayout">
            {availableFaculty.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-zinc-800/80 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/10"
              >
                <Sparkles className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-600 mb-2" />
                <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">
                  No Active Sessions
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                  All faculty are currently teaching or preparing. Check the schedules below!
                </p>
              </motion.div>
            ) : (
              availableFaculty.map(({ faculty, slot }, idx) => {
                const isFav = favorites.includes(faculty.id);
                const copyKey = `${faculty.id}-room`;
                return (
                  <motion.div
                    key={faculty.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onSelectFaculty(faculty)}
                    className="p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-zinc-800/40 hover:bg-slate-50 dark:hover:bg-zinc-900/80 transition-all duration-300 cursor-pointer shadow-xs flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Prof Profile/Initials Badge */}
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-display font-black text-sm tracking-wide shadow-md shadow-emerald-500/10">
                        {faculty.initial}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-slate-800 dark:text-zinc-200 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {faculty.name}
                          </span>
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={(e) => onToggleFavorite(faculty.id, e)}
                            className="text-amber-400 hover:text-amber-500"
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : 'text-slate-300 dark:text-zinc-700'}`} />
                          </motion.button>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1 text-[11px] font-mono font-medium">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            Room {faculty.room}
                          </span>
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                            Until {formatTimeString(slot.endTime, is24Hour)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick copy / Action Column */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => copyToClipboard(faculty.room, copyKey, e)}
                        className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-300 transition-all cursor-pointer"
                        title="Copy Room Number"
                      >
                        {copiedId === copyKey ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `mailto:${faculty.email}`;
                        }}
                        className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-300 transition-all cursor-pointer"
                        title="Send Email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-900 flex justify-between items-center">
        <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
          AUTOMATIC REAL-TIME REFRESH
        </span>
        <span className="text-xs font-semibold text-blue-500 flex items-center gap-1 cursor-pointer hover:gap-1.5 transition-all">
          Weekly schedule <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};
