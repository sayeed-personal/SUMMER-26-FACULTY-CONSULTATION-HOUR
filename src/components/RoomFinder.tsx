import React, { useState } from 'react';
import { Search, MapPin, Calendar, Clock, User, ArrowRight, Sparkles, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Faculty } from '../data/schedule';
import { formatTimeString, getDaySchedule, JS_DAY_MAP } from '../utils/timeUtils';

interface RoomFinderProps {
  faculties: Faculty[];
  is24Hour: boolean;
  onSelectFaculty: (faculty: Faculty) => void;
  currentDay: string;
}

export const RoomFinder: React.FC<RoomFinderProps> = ({
  faculties,
  is24Hour,
  onSelectFaculty,
  currentDay
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Extract all unique room numbers
  const uniqueRooms: string[] = Array.from(new Set<string>(faculties.map(f => f.room))).sort();

  // Find faculty using a room
  const getFacultyForRoom = (room: string) => {
    return faculties.filter(f => f.room.toLowerCase() === room.toLowerCase());
  };

  // Find all consultation slots for a room today
  const getTodayConsultationsForRoom = (room: string) => {
    const list: Array<{ faculty: Faculty; slot: any }> = [];
    faculties.forEach(faculty => {
      if (faculty.room.toLowerCase() === room.toLowerCase()) {
        faculty.schedule.forEach(slot => {
          if (slot.day === currentDay) {
            list.push({ faculty, slot });
          }
        });
      }
    });
    return list.sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));
  };

  // Find all consultation slots for a room weekly
  const getWeeklyConsultationsForRoom = (room: string) => {
    const list: Array<{ faculty: Faculty; slot: any }> = [];
    faculties.forEach(faculty => {
      if (faculty.room.toLowerCase() === room.toLowerCase()) {
        faculty.schedule.forEach(slot => {
          list.push({ faculty, slot });
        });
      }
    });
    // Sort by day order then start time
    return list.sort((a, b) => {
      const dayA = JS_DAY_MAP.indexOf(a.slot.day as any);
      const dayB = JS_DAY_MAP.indexOf(b.slot.day as any);
      if (dayA !== dayB) return dayA - dayB;
      return a.slot.startTime.localeCompare(b.slot.startTime);
    });
  };

  const handleCopyRoom = (room: string) => {
    navigator.clipboard.writeText(room);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter suggestion list based on user search
  const filteredRooms = searchQuery.trim() === ''
    ? uniqueRooms
    : uniqueRooms.filter(room => room.toLowerCase().includes(searchQuery.toLowerCase()));

  const activeRoom = selectedRoom || (uniqueRooms.includes(searchQuery.toUpperCase()) ? searchQuery.toUpperCase() : null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Search & Suggestions sidebar */}
      <div className="lg:col-span-4 glass-panel-heavy rounded-3xl p-5 border border-slate-200/60 dark:border-zinc-800/60 flex flex-col justify-between h-[480px]">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-slate-450 dark:text-zinc-400">
              Select Location
            </h2>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Type room number (e.g. 4M128)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-zinc-50 transition-all"
            />
          </div>

          <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
            Available Rooms Directory
          </p>
          
          <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
            {filteredRooms.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500 italic py-4 text-center">
                No matching rooms found
              </p>
            ) : (
              filteredRooms.map((room) => {
                const assignedProf = getFacultyForRoom(room)[0];
                const isActive = activeRoom === room;
                return (
                  <button
                    key={room}
                    onClick={() => {
                      setSelectedRoom(room);
                      setSearchQuery(room);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-zinc-900 border-slate-200/50 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-500'}`} />
                      <span className="font-mono font-bold text-sm tracking-tight">{room}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className={`font-semibold ${isActive ? 'text-blue-100' : 'text-slate-400 dark:text-zinc-500'}`}>
                        {assignedProf ? assignedProf.initial : 'Open Space'}
                      </span>
                      <ArrowRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${
                        isActive ? 'text-white' : 'text-blue-500'
                      }`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[9px] font-mono text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
          <span>BRACU Building 4</span>
          <span>Room Selector</span>
        </div>
      </div>

      {/* Room dossier display */}
      <div className="lg:col-span-8">
        <AnimatePresence mode="wait">
          {!activeRoom ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel-heavy rounded-3xl p-8 border border-slate-200/60 dark:border-zinc-800/60 shadow-lg h-[480px] flex flex-col items-center justify-center text-center text-slate-400"
            >
              <Sparkles className="w-12 h-12 text-slate-300 dark:text-zinc-700 mb-3 animate-pulse" />
              <h3 className="text-lg font-display font-bold text-slate-650 dark:text-zinc-400">
                Awaiting Room Selection
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1.5 max-w-sm">
                Type a classroom or office ID inside the terminal search bar or click on the lists to review schedule availability.
              </p>
            </motion.div>
          ) : (
            (() => {
              const assignedProfs = getFacultyForRoom(activeRoom);
              const todayConsultations = getTodayConsultationsForRoom(activeRoom);
              const weeklyConsultations = getWeeklyConsultationsForRoom(activeRoom);

              return (
                <motion.div
                  key={activeRoom}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="glass-panel-heavy rounded-3xl p-6 border border-slate-200/60 dark:border-zinc-800/60 shadow-lg h-[480px] flex flex-col justify-between overflow-y-auto no-scrollbar"
                >
                  <div>
                    {/* Header of Dossier */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-4 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner">
                          <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-display font-black tracking-tight text-slate-800 dark:text-zinc-50">
                            Room {activeRoom}
                          </h3>
                          <p className="text-xs font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                            Office Space Dossier
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyRoom(activeRoom)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-600 dark:text-zinc-400 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-blue-500" />
                            <span>Copy Room Code</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Room occupants */}
                    <div className="mb-5">
                      <h4 className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2.5 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-blue-500" />
                        Occupying Faculty
                      </h4>
                      {assignedProfs.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No assigned professor uses this room.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {assignedProfs.map(prof => (
                            <div 
                              key={prof.id}
                              onClick={() => onSelectFaculty(prof)}
                              className="inline-flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50 p-2 rounded-xl cursor-pointer hover:border-blue-500/30 hover:shadow-xs transition-all"
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-bold text-xs flex items-center justify-center">
                                {prof.initial}
                              </div>
                              <span className="text-xs font-display font-bold text-slate-700 dark:text-zinc-300">
                                {prof.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Today's consultation */}
                      <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 dark:border-blue-500/10 flex flex-col h-[200px]">
                        <h5 className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          Today's Consultations ({currentDay})
                        </h5>
                        
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                          {todayConsultations.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-6 text-center">
                              No consultations scheduled for today in this room.
                            </p>
                          ) : (
                            todayConsultations.map(({ faculty, slot }, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-zinc-900 p-2 rounded-lg border border-slate-200/40 dark:border-zinc-800">
                                <span className="font-bold text-slate-700 dark:text-zinc-300">
                                  {faculty.initial}
                                </span>
                                <span className="font-mono font-bold text-slate-500">
                                  {slot.startTime} – {slot.endTime}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Weekly consultations list */}
                      <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 dark:border-indigo-500/10 flex flex-col h-[200px]">
                        <h5 className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          Weekly Room Calendar
                        </h5>
                        
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                          {weeklyConsultations.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-6 text-center">
                              No weekly consultations registered for this room.
                            </p>
                          ) : (
                            weeklyConsultations.map(({ faculty, slot }, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-zinc-900 p-2 rounded-lg border border-slate-200/40 dark:border-zinc-800">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-700 dark:text-zinc-300">
                                    {faculty.initial}
                                  </span>
                                  <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 px-1 py-0.2 rounded font-bold">
                                    {slot.day.slice(0, 3)}
                                  </span>
                                </div>
                                <span className="font-mono font-bold text-slate-500">
                                  {slot.startTime} – {slot.endTime}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })()
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
