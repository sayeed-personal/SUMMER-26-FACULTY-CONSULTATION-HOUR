import React from 'react';
import { X, Clock, Eye, Trash2, ShieldAlert, Sparkles, Smartphone, Check, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  is24Hour: boolean;
  setIs24Hour: (val: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onResetData: () => void;
  installPrompt: any;
  onInstall: () => void;
  isSimulatingTime?: boolean;
  setIsSimulatingTime?: (val: boolean) => void;
  simulatedTime?: { day: string; time: string };
  setSimulatedTime?: (val: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  is24Hour,
  setIs24Hour,
  isDarkMode,
  setIsDarkMode,
  onResetData,
  installPrompt,
  onInstall,
  isSimulatingTime,
  setIsSimulatingTime,
  simulatedTime,
  setSimulatedTime
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-md"
          />

          {/* Modal Card container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 md:p-8 z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/80 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-150 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-zinc-50">
                    Preferences
                  </h3>
                  <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                    System Parameters
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-1.5 rounded-full border border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-350 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Form Settings Blocks */}
            <div className="space-y-4">
              {/* Clock segment */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Time Display
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Toggle 12 or 24-hour systems</p>
                </div>

                <div className="p-0.5 rounded-xl bg-slate-200 dark:bg-zinc-850 flex border border-slate-300/40 dark:border-zinc-800">
                  <button
                    onClick={() => setIs24Hour(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !is24Hour
                        ? 'bg-white dark:bg-zinc-800 text-slate-850 dark:text-zinc-100 shadow-xs'
                        : 'text-slate-400 hover:text-slate-650'
                    }`}
                  >
                    12H
                  </button>
                  <button
                    onClick={() => setIs24Hour(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      is24Hour
                        ? 'bg-white dark:bg-zinc-800 text-slate-850 dark:text-zinc-100 shadow-xs'
                        : 'text-slate-400 hover:text-slate-650'
                    }`}
                  >
                    24H
                  </button>
                </div>
              </div>

              {/* Theme Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-indigo-500" />
                    Visual Theme
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Choose your aesthetic style</p>
                </div>

                <div className="p-0.5 rounded-xl bg-slate-200 dark:bg-zinc-850 flex border border-slate-300/40 dark:border-zinc-800">
                  <button
                    onClick={() => setIsDarkMode(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !isDarkMode
                        ? 'bg-white dark:bg-zinc-800 text-slate-850 dark:text-zinc-100 shadow-xs'
                        : 'text-slate-400 hover:text-slate-650'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setIsDarkMode(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isDarkMode
                        ? 'bg-white dark:bg-zinc-800 text-slate-850 dark:text-zinc-100 shadow-xs'
                        : 'text-slate-400 hover:text-slate-650'
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>

              {/* PWA Install Segment */}
              {installPrompt && (
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 dark:border-blue-500/15 flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-blue-500" />
                      Standalone App
                    </h4>
                    <p className="text-xs text-slate-550 dark:text-zinc-400 mt-0.5">Install to your device home screen for quick offline access.</p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onInstall}
                    className="flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold cursor-pointer flex items-center gap-1 shadow-md shadow-blue-500/15"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Install</span>
                  </motion.button>
                </div>
              )}

              {/* Simulation Segment (Developer Mode) */}
              {setIsSimulatingTime && simulatedTime && setSimulatedTime && (
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 dark:border-amber-500/15 flex flex-col gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                      Academic Simulation Mode
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                      Simulate different schedules to test active slots and countdowns.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setIsSimulatingTime(!isSimulatingTime)}
                      className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSimulatingTime
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {isSimulatingTime ? '🔴 Simulation Active' : '⚪ Run System Time'}
                    </button>

                    {isSimulatingTime && (
                      <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-zinc-950 p-2 rounded-xl border border-slate-200 dark:border-zinc-800">
                        {/* Day selector */}
                        <select
                          value={simulatedTime.day}
                          onChange={(e) => setSimulatedTime((prev: any) => ({ ...prev, day: e.target.value }))}
                          className="bg-transparent text-xs font-bold font-mono py-1 px-2 border-none outline-none text-slate-700 dark:text-zinc-300 w-1/2 cursor-pointer"
                        >
                          {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'].map(day => (
                            <option key={day} value={day} className="dark:bg-zinc-900">{day}</option>
                          ))}
                        </select>

                        <span className="text-slate-300 dark:text-zinc-800">|</span>

                        {/* Hour picker */}
                        <input
                          type="time"
                          value={simulatedTime.time}
                          onChange={(e) => setSimulatedTime((prev: any) => ({ ...prev, time: e.target.value }))}
                          className="bg-transparent text-xs font-bold font-mono py-1 px-2 border-none outline-none text-slate-700 dark:text-zinc-300 w-1/2 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reset Segment */}
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 dark:border-rose-500/15 flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 flex-none mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-rose-600 dark:text-rose-450">
                      Emergency Utilities
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                      This will reset your pinned favorites and locally stored app cache.
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={onResetData}
                  className="w-full py-2 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset App State</span>
                </motion.button>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-150 dark:border-zinc-800/60 text-center">
              <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                BRAC Consultation Planner v1.0 • PWA Standard
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
