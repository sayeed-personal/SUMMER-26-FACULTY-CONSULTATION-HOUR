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
  FacultyManagementPanel 
} from './components/FacultyManagementPanel';
import {
  AdminPasscodeModal
} from './components/AdminPasscodeModal';
import {
  ActivityLogModal,
  ActivityLogEntry
} from './components/ActivityLogModal';
import {
  DEFAULT_ADMIN_PASSCODE
} from './config/admin';

import { 
  FALLBACK_SCHEDULES, 
  Faculty, 
  ScheduleSlot 
} from './data/schedule';

import { 
  JS_DAY_MAP, 
  getActiveConsultation, 
  getNextConsultation,
  getFacultyStatusInfo,
  timeToMinutes
} from './utils/timeUtils';

import { motion, AnimatePresence } from 'motion/react';
import { CalendarRange, Sparkles, SlidersHorizontal, Eye, Printer, FileDown, Search, RotateCcw, Trash2, X } from 'lucide-react';
import { haptic } from './utils/haptic';

export default function App() {
  // --- STATE ---
  const [faculties, setFaculties] = useState<Faculty[]>(() => {
    const saved = localStorage.getItem('brac_faculties');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse saved faculties', e);
      }
    }
    return FALLBACK_SCHEDULES;
  });

  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);

  // --- ACTIVITY LOG STATE & PERSISTENCE ---
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(() => {
    const saved = localStorage.getItem('brac_activity_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('brac_activity_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  const addActivityLog = (action: string, facultyName: string, details?: string) => {
    const entry: ActivityLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      facultyName,
      details
    };
    setActivityLogs(prev => [entry, ...prev]);
  };

  // --- UNDO DELETE STATE & COOLDOWN ---
  const [pendingDelete, setPendingDelete] = useState<{
    faculty: Faculty;
    index: number;
    timestamp: number;
  } | null>(() => {
    const saved = localStorage.getItem('brac_pending_delete');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.timestamp < 15000) {
          return parsed;
        }
      } catch (e) {}
    }
    return null;
  });

  useEffect(() => {
    if (pendingDelete) {
      localStorage.setItem('brac_pending_delete', JSON.stringify(pendingDelete));
    } else {
      localStorage.removeItem('brac_pending_delete');
    }
  }, [pendingDelete]);

  useEffect(() => {
    if (!pendingDelete) return;
    const remaining = 15000 - (Date.now() - pendingDelete.timestamp);
    if (remaining <= 0) {
      setPendingDelete(null);
      return;
    }
    const timer = setTimeout(() => {
      setPendingDelete(null);
    }, remaining);
    return () => clearTimeout(timer);
  }, [pendingDelete]);

  const handleDeleteFaculty = (id: string) => {
    const index = faculties.findIndex(f => f.id === id);
    if (index === -1) return;
    const targetFaculty = faculties[index];
    
    // Save to pending delete
    setPendingDelete({
      faculty: targetFaculty,
      index,
      timestamp: Date.now()
    });
    
    // Remove from faculties
    const updated = faculties.filter(f => f.id !== id);
    setFaculties(updated);
    
    // Add to activity log
    addActivityLog('Faculty Deleted', targetFaculty.name);
  };

  const handleUndoDelete = () => {
    if (!isAdminMode) {
      showToast("❌ Admin mode is locked. Cannot undo.");
      return;
    }
    if (pendingDelete) {
      const { faculty, index } = pendingDelete;
      setFaculties(prev => {
        const copy = [...prev];
        copy.splice(index, 0, faculty);
        return copy;
      });
      addActivityLog('Faculty Restored (Undo)', faculty.name);
      setPendingDelete(null);
      showToast(`Restored ${faculty.name} successfully!`);
    }
  };

  // --- ADMIN MODE STATE ---
  const [savedPasscode, setSavedPasscode] = useState<string>(() => {
    const saved = localStorage.getItem('brac_admin_passcode');
    return saved || DEFAULT_ADMIN_PASSCODE;
  });

  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    return sessionStorage.getItem('brac_is_admin_mode') === 'true';
  });

  const [isAdminUnlockOpen, setIsAdminUnlockOpen] = useState(false);
  const [onAdminSuccessAction, setOnAdminSuccessAction] = useState<(() => void) | null>(null);

  const handleUnlockAdminSuccess = () => {
    setIsAdminMode(true);
    sessionStorage.setItem('brac_is_admin_mode', 'true');
    setIsAdminUnlockOpen(false);
    showToast('🔓 Admin Mode unlocked successfully!');
    if (onAdminSuccessAction) {
      onAdminSuccessAction();
      setOnAdminSuccessAction(null);
    }
  };

  const handleLockAdmin = () => {
    setIsAdminMode(false);
    sessionStorage.removeItem('brac_is_admin_mode');
    showToast('🔒 Admin Mode locked.');
    haptic.medium();
  };

  const requireAdminMode = (action: () => void) => {
    if (isAdminMode) {
      action();
    } else {
      setOnAdminSuccessAction(() => action);
      setIsAdminUnlockOpen(true);
    }
  };

  const handleSaveNewPasscode = (newPasscode: string) => {
    setSavedPasscode(newPasscode);
    localStorage.setItem('brac_admin_passcode', newPasscode);
  };
  
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
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const selectedFaculty = faculties.find(f => f.id === selectedFacultyId) || null;

  // Search and Filter Board States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // PWA Prompt
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Offline status tracking
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // Toast status tracking
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    const id = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
    return id;
  };

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
      document.documentElement.style.colorScheme = 'dark';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0A0A0C');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#ffffff');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('brac_24_hour', String(is24Hour));
  }, [is24Hour]);

  useEffect(() => {
    localStorage.setItem('brac_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Save faculties changes locally
  useEffect(() => {
    localStorage.setItem('brac_faculties', JSON.stringify(faculties));
  }, [faculties]);

  // --- CLOCK TRIGGER ---
  useEffect(() => {
    const timer = setInterval(() => {
      setRealTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- FETCH SCHEDULE DATA ---
  useEffect(() => {
    const saved = localStorage.getItem('brac_faculties');
    if (saved) return;

    fetch('/schedule.json')
      .then((res) => {
        if (!res.ok) throw new Error('Fetch failed');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFaculties(data);
          localStorage.setItem('brac_faculties', JSON.stringify(data));
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
    faculties.filter(f => !f.disabled).forEach(faculty => {
      const activeSlot = getActiveConsultation(faculty, appDay, appTimeStr);
      if (activeSlot) {
        result.push({ faculty, slot: activeSlot });
      }
    });
    return result;
  };

  const activeConsultationsNow = getAvailableFacultiesNow();

  // Find next consultation countdown info
  const nextConsultationInfo = getNextConsultation(faculties.filter(f => !f.disabled), appDay, appTimeStr);

  // --- FILTER CORE ---
  const getFilteredFaculties = () => {
    return faculties.filter(f => !f.disabled).filter(f => {
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
    requireAdminMode(() => {
      if (window.confirm('Reset app preferences, pinned favorites, and recent searches?')) {
        setFavorites([]);
        setSearchQuery('');
        setSelectedFacultyFilter([]);
        setShowOnlyFavorites(false);
        localStorage.clear();
        setFaculties(FALLBACK_SCHEDULES);
        setIsDarkMode(true);
        setIs24Hour(false);
        setIsSettingsOpen(false);
        setIsAdminMode(false);
        sessionStorage.removeItem('brac_is_admin_mode');
      }
    });
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

    // Determine target tab and switch
    const targetTab = activeTab === 'planner' || activeTab === 'timeline' ? activeTab : 'timeline';
    setActiveTab(targetTab);
    setSelectedDay(appDay);

    // Dispatch event to automatically expand the section if in Weekly Planner view
    window.dispatchEvent(new CustomEvent('scroll-to-today', { detail: { day: appDay } }));

    // Gather today's active schedule for currently filtered faculties
    const filteredFacs = getFilteredFaculties();
    const todayConsultations: Array<{ faculty: Faculty; slot: ScheduleSlot }> = [];
    filteredFacs.forEach(faculty => {
      faculty.schedule.forEach(slot => {
        if (slot.day === appDay) {
          todayConsultations.push({ faculty, slot });
        }
      });
    });

    // Sort chronologically
    todayConsultations.sort((a, b) => timeToMinutes(a.slot.startTime) - timeToMinutes(b.slot.startTime));

    let targetCardId = '';
    let isLiveTarget = false;

    if (todayConsultations.length > 0) {
      const currentMins = timeToMinutes(appTimeStr);
      
      // 1. If a consultation is currently live, target it
      const liveItem = todayConsultations.find(item => {
        const startMins = timeToMinutes(item.slot.startTime);
        const endMins = timeToMinutes(item.slot.endTime);
        return currentMins >= startMins && currentMins < endMins;
      });

      if (liveItem) {
        isLiveTarget = true;
        targetCardId = targetTab === 'planner'
          ? `planner-card-${liveItem.faculty.id}-${liveItem.slot.startTime}`
          : `consultation-card-${liveItem.faculty.id}-${liveItem.slot.startTime}`;
      } else {
        // 2. Otherwise, target the next upcoming consultation today
        const upcomingItem = todayConsultations.find(item => {
          const startMins = timeToMinutes(item.slot.startTime);
          return startMins > currentMins;
        });

        if (upcomingItem) {
          targetCardId = targetTab === 'planner'
            ? `planner-card-${upcomingItem.faculty.id}-${upcomingItem.slot.startTime}`
            : `consultation-card-${upcomingItem.faculty.id}-${upcomingItem.slot.startTime}`;
        } else {
          // 3. If all consultations have ended, target the last one and display ended alert
          const lastItem = todayConsultations[todayConsultations.length - 1];
          targetCardId = targetTab === 'planner'
            ? `planner-card-${lastItem.faculty.id}-${lastItem.slot.startTime}`
            : `consultation-card-${lastItem.faculty.id}-${lastItem.slot.startTime}`;
          
          showToast("Today's scheduled consultations have ended.");
        }
      }
    } else {
      showToast(`No consultations scheduled for ${appDay}.`);
    }

    // Scroll to the targeted element or fallback, applying visual highlight
    const performScroll = () => {
      let elementToScroll = document.getElementById(targetCardId);
      
      if (!elementToScroll) {
        elementToScroll = document.getElementById('timeline-section');
      }

      if (elementToScroll) {
        elementToScroll.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Clear any prior classes
        elementToScroll.classList.remove('animate-highlight-glow', 'animate-highlight-glow-live');
        
        // Force reflow
        void elementToScroll.offsetWidth;
        
        // Apply glow classes for 2.5 seconds
        const animClass = isLiveTarget ? 'animate-highlight-glow-live' : 'animate-highlight-glow';
        elementToScroll.classList.add(animClass);
        setTimeout(() => {
          elementToScroll?.classList.remove(animClass);
        }, 2500);
      }
    };

    // Delay scroll slightly to allow rendering state transition (tab change & list updating)
    setTimeout(performScroll, 120);
  };

  const handleSelectFaculty = (fac: Faculty | null) => {
    if (fac) {
      haptic.light();
      setSelectedFacultyId(fac.id);
    } else {
      setSelectedFacultyId(null);
    }
  };

  // --- REAL-TIME STATUS VALUES FOR HEADER AND CARDS ---
  const facultiesStatus = faculties.filter(f => !f.disabled).map(f => getFacultyStatusInfo(f, realTime, isSimulatingTime, simulatedTime));
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
        isAdminMode={isAdminMode}
        onLockAdmin={handleLockAdmin}
        onUnlockAdmin={() => requireAdminMode(() => {})}
      />

      {/* Primary Container */}
      <main className="max-w-7xl w-full mx-auto p-3.5 md:p-8 flex-1">
        
        {/* Real-time stats widgets */}
        <DashboardStats
          faculties={faculties.filter(f => !f.disabled)}
          currentDay={selectedDay}
          availableCount={activeConsultationsNow.length}
        />

        {/* Live consultation trackers bento layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Active Now module */}
          <AvailableNowCard
            availableFaculty={activeConsultationsNow}
            is24Hour={is24Hour}
            onSelectFaculty={handleSelectFaculty}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            realTime={realTime}
            isSimulatingTime={isSimulatingTime}
            simulatedTime={simulatedTime}
          />

          {/* Countdown module */}
          <NextConsultationCard
            is24Hour={is24Hour}
            onSelectFaculty={handleSelectFaculty}
            realTime={realTime}
            isSimulatingTime={isSimulatingTime}
            simulatedTime={simulatedTime}
            faculties={faculties.filter(f => !f.disabled)}
          />
        </div>

        {/* Dynamic Filters Board */}
        <SearchFilterBoard
          faculties={faculties.filter(f => !f.disabled)}
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
        onClose={() => setSelectedFacultyId(null)}
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
        onOpenManagement={() => {
          setIsSettingsOpen(false);
          requireAdminMode(() => setIsManagementOpen(true));
        }}
        onOpenActivityLog={() => setIsActivityLogOpen(true)}
        isAdminMode={isAdminMode}
        onLockAdmin={handleLockAdmin}
        onUnlockAdmin={() => requireAdminMode(() => {})}
        savedPasscode={savedPasscode}
        onSaveNewPasscode={handleSaveNewPasscode}
        showToast={showToast}
      />

      {/* Faculty Management Console */}
      <FacultyManagementPanel
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
        faculties={faculties}
        onUpdateFaculties={(newFacs) => setFaculties(newFacs)}
        onRestoreDefaultFaculties={() => {
          setFaculties(FALLBACK_SCHEDULES);
          localStorage.setItem('brac_faculties', JSON.stringify(FALLBACK_SCHEDULES));
        }}
        showToast={showToast}
        isAdminMode={isAdminMode}
        onDeleteFaculty={handleDeleteFaculty}
        addActivityLog={addActivityLog}
      />

      {/* Activity Logs Console */}
      <ActivityLogModal
        isOpen={isActivityLogOpen}
        onClose={() => setIsActivityLogOpen(false)}
        logs={activityLogs}
        onClearLogs={() => setActivityLogs([])}
        isAdminMode={isAdminMode}
      />

      {/* Admin Unlock Passcode Dialog */}
      <AdminPasscodeModal
        isOpen={isAdminUnlockOpen}
        onClose={() => {
          setIsAdminUnlockOpen(false);
          setOnAdminSuccessAction(null);
        }}
        onSuccess={handleUnlockAdminSuccess}
        savedPasscode={savedPasscode}
      />

      {/* Undo Delete Notification Banner */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[90%] max-w-md bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-slate-200/50 dark:border-zinc-800/80 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 border border-rose-100/50 dark:border-rose-900/35 flex items-center justify-center flex-none">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-850 dark:text-zinc-150 truncate">
                  Deleted {pendingDelete.faculty.name}
                </h4>
                <p className="text-[10px] font-medium text-slate-450 dark:text-zinc-500 mt-0.5">
                  Undo deletion within 15 seconds.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-none">
              <button
                onClick={handleUndoDelete}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-display font-black text-[11px] shadow-md shadow-blue-500/10 cursor-pointer flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
              
              <button
                onClick={() => setPendingDelete(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification HUD */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 dark:bg-zinc-900/95 backdrop-blur-md text-white dark:text-zinc-50 border border-slate-700/35 dark:border-zinc-800/80 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-xl text-xs font-bold tracking-tight select-none pointer-events-none"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
