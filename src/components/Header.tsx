import React from 'react';
import { Clock, Settings, Download, Sun, Moon, CalendarRange } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  is24Hour: boolean;
  currentTime: Date;
  onOpenSettings: () => void;
  installPrompt: any;
  onInstall: () => void;
  isOffline?: boolean;
  availableCount: number;
  nextConsultationStr: string;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  setIsDarkMode,
  is24Hour,
  currentTime,
  onOpenSettings,
  installPrompt,
  onInstall,
  isOffline = false,
  availableCount,
  nextConsultationStr
}) => {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Format live time string
  const formatTime = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    
    const minStr = minutes.toString().padStart(2, '0');
    const secStr = seconds.toString().padStart(2, '0');
    
    if (is24Hour) {
      return `${hours.toString().padStart(2, '0')}:${minStr}:${secStr}`;
    } else {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 === 0 ? 12 : hours % 12;
      return `${displayHour}:${minStr}:${secStr} ${ampm}`;
    }
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  if (scrolled) {
    return (
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/50 dark:border-zinc-800/50 px-4 md:px-8 py-2 md:py-2.5 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Branding */}
          <div className="flex items-center gap-2 min-w-0">
            <CalendarRange className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-none" />
            <h1 className="text-xs md:text-sm font-display font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 truncate">
              BRAC Consultation Planner
            </h1>
          </div>

          {/* Minimal stats row */}
          <div className="flex items-center gap-2 md:gap-3 text-[10px] font-mono font-bold">
            {/* Clock */}
            <div className="flex items-center gap-1 bg-slate-100/60 dark:bg-zinc-900/60 border border-slate-200/20 dark:border-zinc-800/20 px-2 py-1 rounded-lg text-slate-700 dark:text-zinc-300">
              <Clock className="w-3 h-3 text-blue-500" />
              <span>{formatTime().split(' ')[0]}</span>
            </div>

            {/* Available */}
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg border border-emerald-500/10">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>{availableCount} Live</span>
            </div>

            {/* Next */}
            <div className="hidden sm:flex items-center gap-1 bg-blue-500/5 text-blue-600 dark:text-blue-400 border border-blue-500/10 px-2 py-1 rounded-lg max-w-[120px] md:max-w-none truncate">
              <span>Next: {nextConsultationStr}</span>
            </div>
          </div>

          {/* Action controls */}
          <div className="flex items-center gap-1 flex-none">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
            </button>
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
              aria-label="Open Preferences"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/50 dark:border-zinc-800/50 px-4 md:px-8 py-3 md:py-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Branding & Logo */}
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 active-glow cursor-pointer"
          >
            <CalendarRange className="w-5 h-5 md:w-6 md:h-6" />
          </motion.div>
          <div>
            <motion.div 
              whileHover={{ scale: 1.025, y: -1 }}
              className="inline-flex flex-col mb-2 p-1.5 px-3 rounded-2xl bg-slate-100/60 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800/40 shadow-xs backdrop-blur-md cursor-default"
            >
              <span className="text-[8px] font-mono text-slate-500 dark:text-zinc-500 tracking-widest font-black uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Designed & Developed by
              </span>
              <span className="text-[11px] font-display font-extrabold text-blue-600 dark:text-blue-400 tracking-wide mt-0.5">
                Sayeed M Mobtasim
              </span>
            </motion.div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] tracking-widest text-blue-600 dark:text-blue-400 font-bold uppercase">
                BRACU
              </span>
              {isOffline && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider border border-amber-500/20 animate-pulse">
                  <span className="w-1 h-1 rounded-full bg-amber-500"></span>
                  Offline Mode
                </span>
              )}
            </div>
            <h1 className="text-lg md:text-xl font-display font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              BRAC Consultation Planner
            </h1>
          </div>
        </div>

        {/* Live Clock & Action Panel */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Real-time Status Widget */}
          <div className="hidden md:flex items-center gap-4 bg-slate-100/40 dark:bg-zinc-900/40 border border-slate-200/40 dark:border-zinc-800/40 rounded-2xl px-4 py-2 shadow-xs backdrop-blur-md">
            {/* Clock */}
            <div className="flex flex-col pr-3 border-r border-slate-200/80 dark:border-zinc-800/60 min-w-[125px]">
              <span className="text-[8px] font-mono font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none">
                Current Time
              </span>
              <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 font-sans tracking-wide mt-1 leading-none">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
              </span>
              <span className="text-[11px] font-mono font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1 mt-1 leading-none">
                {formatTime()}
              </span>
            </div>

            {/* Available count */}
            <div className="flex flex-col pr-3 border-r border-slate-200/80 dark:border-zinc-800/60 min-w-[95px]">
              <span className="text-[8px] font-mono font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none">
                Faculty Available
              </span>
              <div className="flex items-center gap-1.5 mt-1.5 leading-none">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-display font-extrabold text-emerald-600 dark:text-emerald-400">
                  {availableCount} Available
                </span>
              </div>
            </div>

            {/* Next Consultation countdown */}
            <div className="flex flex-col max-w-[150px]">
              <span className="text-[8px] font-mono font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none">
                Next Consultation
              </span>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1.5 truncate leading-none">
                {nextConsultationStr}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Install Button */}
            {installPrompt && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium text-xs border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all cursor-pointer"
                title="Install App"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install</span>
              </motion.button>
            )}

            {/* Dark Mode Switcher */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700/80 transition-all cursor-pointer"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </motion.button>

            {/* Settings Trigger */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700/80 transition-all cursor-pointer"
              aria-label="Open Settings"
            >
              <Settings className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Mobile Live Time Indicator under header */}
      <div className="lg:hidden mt-2 pt-2 border-t border-slate-100 dark:border-zinc-900 flex items-center justify-between text-xs px-2">
        <span className="text-slate-500 dark:text-zinc-400 font-medium">{formatDate()}</span>
        <span className="font-mono font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded">
          <Clock className="w-3 h-3 text-blue-500" />
          {formatTime()}
        </span>
      </div>
    </header>
  );
};
