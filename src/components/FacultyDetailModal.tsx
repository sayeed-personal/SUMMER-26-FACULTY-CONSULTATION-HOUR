import React, { useState } from 'react';
import { X, Copy, Check, Mail, Phone, ExternalLink, Calendar, MapPin, BookOpen, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Faculty, DAY_COLORS } from '../data/schedule';
import { formatTimeString, getDaySchedule, JS_DAY_MAP } from '../utils/timeUtils';

interface FacultyDetailModalProps {
  faculty: Faculty | null;
  isOpen: boolean;
  onClose: () => void;
  currentDay: string;
  is24Hour: boolean;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export const FacultyDetailModal: React.FC<FacultyDetailModalProps> = ({
  faculty,
  isOpen,
  onClose,
  currentDay,
  is24Hour,
  favorites,
  onToggleFavorite
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedRoom, setCopiedRoom] = useState(false);

  if (!faculty) return null;

  const isFavorite = favorites.includes(faculty.id);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(faculty.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(faculty.room);
    setCopiedRoom(true);
    setTimeout(() => setCopiedRoom(false), 2000);
  };

  const todaySlots = getDaySchedule(faculty, currentDay);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 md:p-8 no-scrollbar z-10"
          >
            {/* Close Button & Favorite Toggle */}
            <div className="absolute top-5 right-5 flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onToggleFavorite(faculty.id)}
                className={`p-2 rounded-full border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-amber-400 cursor-pointer`}
                title={isFavorite ? 'Remove from favorites' : 'Pin to favorites'}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400 dark:text-zinc-600'}`} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-full border border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mt-2 mb-6">
              {/* Profile Avatar / Initials */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex flex-col items-center justify-center text-white font-display font-black text-2xl md:text-3xl tracking-widest shadow-lg shadow-blue-500/10">
                {faculty.initial}
                <span className="text-[10px] font-mono tracking-widest font-bold uppercase opacity-80 mt-1">
                  BRACU
                </span>
              </div>

              {/* Bio Details */}
              <div className="text-center md:text-left flex-1">
                <h3 className="text-2xl font-display font-black tracking-tight text-slate-900 dark:text-zinc-50 leading-snug">
                  {faculty.name}
                </h3>
                
                <p className="text-sm font-mono font-bold text-slate-400 dark:text-zinc-500 mt-1">
                  Initials: <span className="text-blue-600 dark:text-blue-400">{faculty.initial}</span>
                </p>

                {/* Micro Actions (Copy room & email) */}
                <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                  <button
                    onClick={handleCopyRoom}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-600 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span>Room {faculty.room}</span>
                    {copiedRoom ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  </button>

                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-600 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{faculty.email}</span>
                    {copiedEmail ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  </button>

                  <a
                    href={`mailto:${faculty.email}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Now</span>
                  </a>
                </div>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-zinc-800/80 mb-6" />

            {/* Courses Segment */}
            <div className="mb-6">
              <h4 className="text-xs font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                Affiliated Courses
              </h4>
              <div className="flex flex-wrap gap-2">
                {faculty.courses.map((course) => (
                  <span
                    key={course}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300 font-mono"
                  >
                    {course}
                  </span>
                ))}
              </div>
            </div>

            {/* Today's schedule focus */}
            <div className="mb-6 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 dark:border-blue-500/10">
              <h4 className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Today's Schedule ({currentDay})
              </h4>
              {todaySlots.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  No consultation slots scheduled for today.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {todaySlots.map((slot, sIdx) => (
                    <div key={sIdx} className="flex items-center justify-between text-sm bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 p-2.5 rounded-xl">
                      <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
                        {formatTimeString(slot.startTime, is24Hour)} – {formatTimeString(slot.endTime, is24Hour)}
                      </span>
                      {slot.byAppointment ? (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          By Appointment Only
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          Open Hours
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Full Weekly Schedule */}
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Complete Weekly Calendar
              </h4>
              <div className="border border-slate-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-zinc-900/15">
                <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-zinc-800">
                  {JS_DAY_MAP.filter(day => day !== 'Friday').map((day) => {
                    const slots = getDaySchedule(faculty, day);
                    const color = DAY_COLORS[day] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', accent: 'bg-slate-400' };
                    return (
                      <div key={day} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Day indicator with standard color tag */}
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${color.accent}`} />
                          <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300 w-24">
                            {day}
                          </span>
                        </div>

                        {/* Slots */}
                        <div className="flex-1 flex flex-wrap gap-2 justify-start sm:justify-end">
                          {slots.length === 0 ? (
                            <span className="text-xs text-slate-400 dark:text-zinc-500 italic">
                              No office hours
                            </span>
                          ) : (
                            slots.map((slot, idx) => (
                              <span
                                key={idx}
                                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${color.bg} ${color.text} ${color.border} font-mono`}
                              >
                                {formatTimeString(slot.startTime, is24Hour)} – {formatTimeString(slot.endTime, is24Hour)}
                                {slot.byAppointment && <span className="text-[9px] block text-amber-500 font-bold mt-0.5">Appt. Only</span>}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
