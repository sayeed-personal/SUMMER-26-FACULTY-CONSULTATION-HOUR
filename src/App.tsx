import React, { useState, useEffect } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  DashboardStats 
} from './components/DashboardStats';
import { 
  AvailableNowCard 
} from './components/AvailableNowCard';
import { 
  NextConsultationCard 
} from './components/NextConsultationCard';
import { 
  SearchFilterBoard 
} from './components/SearchFilterBoard';
import { 
  WeeklyPlannerView 
} from './components/WeeklyPlannerView';
import { 
  TimelineView 
} from './components/TimelineView';
import { 
  WeeklyCalendarView 
} from './components/WeeklyCalendarView';
import { 
  RoomFinder 
} from './components/RoomFinder';
import { 
  FacultyDetailModal 
} from './components/FacultyDetailModal';
import { 
  SettingsModal 
} from './components/SettingsModal';

import { 
  FALLBACK_SCHEDULES, 
  Faculty, 
  ScheduleSlot 
} from './data/schedule';

import { 
  JS_DAY_MAP, 
  getActiveConsultation, 
  getNextConsultation 
} from './utils/timeUtils';

import { motion, AnimatePresence } from 'motion/react';
import { CalendarRange, Sparkles, SlidersHorizontal, Eye, Printer, FileDown } from 'lucide-react';

export default function App() {
  // --- STATE ---
  const [faculties, setFaculties] = useState<Faculty[]>(FALLBACK_SCHEDULES);
  
  // App preferences
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('brac_dark_mode');
    return saved ? saved === 'true' : true; // Default to Dark Mode
  });
  
  const [is24Hour, setIs24Hour] = useState<boolean>(() => {
    return localStorage.getItem('brac_24_hour') === 'true';
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('brac_favorites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Time & Simulation variables
  const [realTime, setRealTime] = useState<Date>(new Date());
  const [isSimulatingTime, setIsSimulatingTime] = useState<boolean>(false);
  const [simulatedTime, setSimulatedTime] = useState<{ day: string; time: string }>({
    day: 'Sunday',
    time: '11:15'
  });

  // Active View Tab: 'planner' | 'timeline' | 'calendar' | 'room'
  const [activeTab, setActiveTab] = useState<'timeline' | 'planner' | 'calendar' | 'room'>('timeline');

  // Selected Daywise Schedule
  const [selectedDay, setSelectedDay] = useState<string>('Sunday');

  // Interactive Overlays
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);

  // Search and Filter Board States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // PWA Prompt
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Offline status tracking
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- PERSISTENCE EFFECT ---
  useEffect(() => {
    localStorage.setItem('brac_dark_mode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('brac_24_hour', String(is24Hour));
  }, [is24Hour]);

  useEffect(() => {
    localStorage.setItem('brac_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // --- CLOCK TRIGGER ---
  useEffect(() => {
    const timer = setInterval(() => {
      setRealTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- FETCH SCHEDULE DATA ---
  useEffect(() => {
    fetch('/schedule.json')
      .then((res) => {
        if (!res.ok) throw new Error('Fetch failed');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFaculties(data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch schedule.json, falling back to bundled typescript data', err);
      });
  }, []);

  // --- PWA EVENT LISTENER ---
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // --- TIME CALCULATIONS RESOLUTION ---
  // Returns current active day string and time representation based on simulation or real clock
  const getAppTimeContext = () => {
    if (isSimulatingTime) {
      return {
        day: simulatedTime.day,
        timeStr: simulatedTime.time
      };
    } else {
      const dayIndex = realTime.getDay();
      const currentDayName = JS_DAY_MAP[dayIndex];
      const hoursStr = realTime.getHours().toString().padStart(2, '0');
      const minsStr = realTime.getMinutes().toString().padStart(2, '0');
      return {
        day: currentDayName,
        timeStr: `${hoursStr}:${minsStr}`
      };
    }
  };

  const { day: appDay, timeStr: appTimeStr } = getAppTimeContext();

  // Sync selectedDay when appDay changes (e.g. system time ticks or simulation changes)
  useEffect(() => {
    if (appDay) {
      setSelectedDay(appDay);
    }
  }, [appDay]);

  // Calculate available faculties right now
  const getAvailableFacultiesNow = (): Array<{ faculty: Faculty; slot: ScheduleSlot }> => {
    const result: Array<{ faculty: Faculty; slot: ScheduleSlot }> = [];
    faculties.forEach(faculty => {
      const activeSlot = getActiveConsultation(faculty, appDay, appTimeStr);
      if (activeSlot) {
        result.push({ faculty, slot: activeSlot });
      }
    });
    return result;
  };

  const activeConsultationsNow = getAvailableFacultiesNow();

  // Find next consultation countdown info
  const nextConsultationInfo = getNextConsultation(faculties, appDay, appTimeStr);

  // --- FILTER CORE ---
  const getFilteredFaculties = () => {
    return faculties.filter(f => {
      // 1. Filter by Favorites
      if (showOnlyFavorites && !favorites.includes(f.id)) {
        return false;
      }

      // 2. Filter by Faculty initials checkmarks
      if (selectedFacultyFilter.length > 0 && !selectedFacultyFilter.includes(f.initial)) {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = f.name.toLowerCase().includes(query);
        const matchesInitial = f.initial.toLowerCase().includes(query);
        const matchesRoom = f.room.toLowerCase().includes(query);
        const matchesCourse = f.courses.some(c => c.toLowerCase().includes(query));
        const matchesDept = f.department.toLowerCase().includes(query);

        return matchesName || matchesInitial || matchesRoom || matchesCourse || matchesDept;
      }

      return true;
    });
  };

  const filteredFaculties = getFilteredFaculties();

  // --- ACTIONS ---
  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleResetData = () => {
    if (window.confirm('Reset app preferences, pinned favorites, and recent searches?')) {
      setFavorites([]);
      setSearchQuery('');
      setSelectedFacultyFilter([]);
      setShowOnlyFavorites(false);
      localStorage.clear();
      setIsDarkMode(true);
      setIs24Hour(false);
      setIsSettingsOpen(false);
    }
  };

  const handleInstallPWA = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the PWA install prompt');
          setInstallPrompt(null);
        }
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(faculties, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "brac_schedules.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 transition-colors duration-500 flex flex-col justify-between">
      
      {/* Background radial accent glows (Apple theme style) */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Main Header */}
      <Header
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        is24Hour={is24Hour}
        currentTime={realTime}
        onOpenSettings={() => setIsSettingsOpen(true)}
        installPrompt={installPrompt}
        onInstall={handleInstallPWA}
        isOffline={isOffline}
      />

      {/* Primary Container */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-8 flex-1">
        
        {/* Dynamic Simulation Bar (Aesthetic Override Panel) */}
        <div className="mb-6 p-4 rounded-2xl glass-panel-heavy border border-slate-200/60 dark:border-zinc-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="font-display font-bold text-sm text-slate-800 dark:text-zinc-100">
                Academic Simulation Controls
              </h3>
              <p className="text-[11px] text-slate-450 dark:text-zinc-500">
                Simulate different university schedules to test active slots, count-downs, and calendar lines.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsSimulatingTime(!isSimulatingTime)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSimulatingTime
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-850 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              {isSimulatingTime ? '🔴 Override Active' : '⚪ Run System Time'}
            </button>

            {isSimulatingTime && (
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
                {/* Day selector */}
                <select
                  value={simulatedTime.day}
                  onChange={(e) => setSimulatedTime(prev => ({ ...prev, day: e.target.value }))}
                  className="bg-transparent text-xs font-bold font-mono py-1 px-2 border-none outline-none text-slate-700 dark:text-zinc-300"
                >
                  {JS_DAY_MAP.filter(d => d !== 'Friday').map(day => (
                    <option key={day} value={day} className="dark:bg-zinc-900">{day}</option>
                  ))}
                </select>

                <span className="text-slate-300 dark:text-zinc-700">|</span>

                {/* Hour picker */}
                <input
                  type="time"
                  value={simulatedTime.time}
                  onChange={(e) => setSimulatedTime(prev => ({ ...prev, time: e.target.value }))}
                  className="bg-transparent text-xs font-bold font-mono py-1 px-2 border-none outline-none text-slate-700 dark:text-zinc-300"
                />
              </div>
            )}
          </div>
        </div>

        {/* Real-time stats widgets */}
        <DashboardStats
          faculties={faculties}
          currentDay={selectedDay}
          availableCount={activeConsultationsNow.length}
        />

        {/* Live consultation trackers bento layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Active Now module */}
          <AvailableNowCard
            availableFaculty={activeConsultationsNow}
            is24Hour={is24Hour}
            onSelectFaculty={(fac) => setSelectedFaculty(fac)}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />

          {/* Countdown module */}
          <NextConsultationCard
            nextConsultInfo={nextConsultationInfo}
            is24Hour={is24Hour}
            onSelectFaculty={(fac) => setSelectedFaculty(fac)}
          />
        </div>

        {/* Dynamic Filters Board */}
        <SearchFilterBoard
          faculties={faculties}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedFacultyFilter={selectedFacultyFilter}
          setSelectedFacultyFilter={setSelectedFacultyFilter}
          showOnlyFavorites={showOnlyFavorites}
          setShowOnlyFavorites={setShowOnlyFavorites}
        />

        {/* Section View Controller (Apple segmented slider layout) */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          {/* Segmented Selector */}
          <div className="p-1 rounded-2xl bg-slate-100 dark:bg-zinc-900/60 flex gap-1 border border-slate-250/50 dark:border-zinc-800/50 relative overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: 'timeline', label: 'Timeline View' },
              { id: 'planner', label: 'Weekly Planner' },
              { id: 'calendar', label: 'Apple Calendar' },
              { id: 'room', label: 'Room Finder' }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative py-2.5 px-4 rounded-xl text-xs font-black tracking-tight transition-all cursor-pointer truncate ${
                    isActive
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 shadow-xs scale-[1.01]'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-400'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* PDF & Export Utility Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Print Schedule as PDF"
            >
              <Printer className="w-4 h-4 text-blue-500" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Download schedule data as JSON"
            >
              <FileDown className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>
          </div>
        </div>

        {/* Main Content Area showing active view tab */}
        <div className="relative mt-2 min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === 'timeline' && (
                <TimelineView
                  faculties={filteredFaculties}
                  is24Hour={is24Hour}
                  onSelectFaculty={(fac) => setSelectedFaculty(fac)}
                  favorites={favorites}
                  selectedDay={selectedDay}
                  onSelectDay={(day) => setSelectedDay(day)}
                />
              )}

              {activeTab === 'planner' && (
                <WeeklyPlannerView
                  faculties={filteredFaculties}
                  is24Hour={is24Hour}
                  onSelectFaculty={(fac) => setSelectedFaculty(fac)}
                  favorites={favorites}
                />
              )}

              {activeTab === 'calendar' && (
                <WeeklyCalendarView
                  faculties={filteredFaculties}
                  is24Hour={is24Hour}
                  onSelectFaculty={(fac) => setSelectedFaculty(fac)}
                  currentDay={appDay}
                  currentTimeStr={appTimeStr}
                />
              )}

              {activeTab === 'room' && (
                <RoomFinder
                  faculties={filteredFaculties}
                  is24Hour={is24Hour}
                  onSelectFaculty={(fac) => setSelectedFaculty(fac)}
                  currentDay={appDay}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* Static Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200/50 dark:border-zinc-800/50 text-center text-xs text-slate-450 dark:text-zinc-500 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-blue-500" />
            <span className="font-display font-semibold text-slate-750 dark:text-zinc-350">
              BRAC Consultation Planner
            </span>
          </div>
          <p className="font-mono text-[10px]">
            Designed strictly with Apple HIG • Standalone offline capability enabled
          </p>
          <p className="text-slate-400">
            © 2026 BRAC University Academic Schedulers
          </p>
        </div>
      </footer>

      {/* --- MODALS & OVERLAYS --- */}
      
      {/* Faculty details modal */}
      <FacultyDetailModal
        faculty={selectedFaculty}
        isOpen={selectedFaculty !== null}
        onClose={() => setSelectedFaculty(null)}
        currentDay={appDay}
        is24Hour={is24Hour}
        favorites={favorites}
        onToggleFavorite={(id) => handleToggleFavorite(id)}
      />

      {/* Pref Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        is24Hour={is24Hour}
        setIs24Hour={setIs24Hour}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onResetData={handleResetData}
        installPrompt={installPrompt}
        onInstall={handleInstallPWA}
      />

    </div>
  );
}
