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
  getNextConsultation,
  getFacultyStatusInfo
} from './utils/timeUtils';

import { motion, AnimatePresence } from 'motion/react';
import { CalendarRange, Sparkles, SlidersHorizontal, Eye, Printer, FileDown, Search } from 'lucide-react';
import { haptic } from './utils/haptic';

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
    haptic.success();
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

  // --- FLOATING ACTION BUTTON HANDLERS ---
  const handleFloatingSearch = () => {
    haptic.medium();
    const inputEl = document.getElementById('search-input');
    if (inputEl) {
      inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => inputEl.focus(), 300);
    }
  };

  const handleGoToToday = () => {
    haptic.medium();
    setActiveTab('timeline');
    const timelineEl = document.getElementById('timeline-section');
    if (timelineEl) {
      timelineEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setTimeout(() => {
        document.getElementById('timeline-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleSelectFaculty = (fac: Faculty | null) => {
    if (fac) {
      haptic.light();
    }
    setSelectedFaculty(fac);
  };

  // --- REAL-TIME STATUS VALUES FOR HEADER AND CARDS ---
  const facultiesStatus = faculties.map(f => getFacultyStatusInfo(f, realTime, isSimulatingTime, simulatedTime));
  const availableCount = facultiesStatus.filter(info => info.status === 'live').length;

  const nextUp = facultiesStatus
    .filter(info => info.status !== 'live' && info.secondsRemaining > 0)
    .sort((a, b) => a.secondsRemaining - b.secondsRemaining)[0];

  const nextConsultationStr = nextUp 
    ? (nextUp.secondsRemaining < 3600
        ? `Starts in ${Math.ceil(nextUp.secondsRemaining / 60)} min`
        : nextUp.countdownStr)
    : 'No upcoming sessions';

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
        availableCount={availableCount}
        nextConsultationStr={nextConsultationStr}
      />

      {/* Primary Container */}
      <main className="max-w-7xl w-full mx-auto p-3.5 md:p-8 flex-1">
        
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
            realTime={realTime}
            isSimulatingTime={isSimulatingTime}
            simulatedTime={simulatedTime}
          />

          {/* Countdown module */}
          <NextConsultationCard
            is24Hour={is24Hour}
            onSelectFaculty={(fac) => setSelectedFaculty(fac)}
            realTime={realTime}
            isSimulatingTime={isSimulatingTime}
            simulatedTime={simulatedTime}
            faculties={faculties}
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
                  onClick={() => {
                    haptic.light();
                    setActiveTab(tab.id as any);
                  }}
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
        <div id="timeline-section" className="relative mt-2 min-h-[400px]">
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
                  onSelectFaculty={handleSelectFaculty}
                  favorites={favorites}
                  selectedDay={selectedDay}
                  onSelectDay={(day) => setSelectedDay(day)}
                  realTime={realTime}
                  isSimulatingTime={isSimulatingTime}
                  simulatedTime={simulatedTime}
                />
              )}

              {activeTab === 'planner' && (
                <WeeklyPlannerView
                  faculties={filteredFaculties}
                  is24Hour={is24Hour}
                  onSelectFaculty={handleSelectFaculty}
                  favorites={favorites}
                  realTime={realTime}
                  isSimulatingTime={isSimulatingTime}
                  simulatedTime={simulatedTime}
                />
              )}

              {activeTab === 'calendar' && (
                <WeeklyCalendarView
                  faculties={filteredFaculties}
                  is24Hour={is24Hour}
                  onSelectFaculty={handleSelectFaculty}
                  currentDay={appDay}
                  currentTimeStr={appTimeStr}
                />
              )}

              {activeTab === 'room' && (
                <RoomFinder
                  faculties={filteredFaculties}
                  is24Hour={is24Hour}
                  onSelectFaculty={handleSelectFaculty}
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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        {/* Today Button */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGoToToday}
          className="flex items-center gap-1.5 px-4 py-3 rounded-full bg-blue-600 dark:bg-blue-500 text-white font-display font-black text-xs shadow-lg shadow-blue-500/20 backdrop-blur-md cursor-pointer border border-blue-500/35"
        >
          <span>📍</span>
          <span>Today</span>
        </motion.button>

        {/* Search Button */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleFloatingSearch}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200/80 dark:border-zinc-800/80 shadow-lg cursor-pointer"
          aria-label="Quick Search"
        >
          <Search className="w-5 h-5" />
        </motion.button>
      </div>

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
        isSimulatingTime={isSimulatingTime}
        setIsSimulatingTime={setIsSimulatingTime}
        simulatedTime={simulatedTime}
        setSimulatedTime={setSimulatedTime}
      />

    </div>
  );
}
