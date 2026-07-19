import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Star, X, Filter, BookOpen, MapPin, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Faculty } from '../data/schedule';

interface SearchFilterBoardProps {
  faculties: Faculty[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedFacultyFilter: string[];
  setSelectedFacultyFilter: (list: string[]) => void;
  showOnlyFavorites: boolean;
  setShowOnlyFavorites: (val: boolean) => void;
}

export const SearchFilterBoard: React.FC<SearchFilterBoardProps> = ({
  faculties,
  searchQuery,
  setSearchQuery,
  selectedFacultyFilter,
  setSelectedFacultyFilter,
  showOnlyFavorites,
  setShowOnlyFavorites
}) => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Load recent searches from Local Storage
  useEffect(() => {
    const stored = localStorage.getItem('brac_recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  // Update suggestions based on input
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSuggestions([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const suggestionsSet = new Set<string>();

    faculties.forEach(f => {
      if (f.name.toLowerCase().includes(query)) suggestionsSet.add(f.name);
      if (f.initial.toLowerCase().includes(query)) suggestionsSet.add(f.initial);
      if (f.room.toLowerCase().includes(query)) suggestionsSet.add(`Room ${f.room}`);
      f.courses.forEach(c => {
        if (c.toLowerCase().includes(query)) suggestionsSet.add(c);
      });
    });

    setSuggestions(Array.from(suggestionsSet).slice(0, 5));
  }, [searchQuery, faculties]);

  // Save recent search on search action
  const handleQuerySubmit = (queryStr: string) => {
    if (queryStr.trim() === '') return;
    
    setSearchQuery(queryStr);
    
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== queryStr.toLowerCase());
      const updated = [queryStr, ...filtered].slice(0, 4);
      localStorage.setItem('brac_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('brac_recent_searches');
  };

  // Toggle individual faculty initial checkbox filters
  const toggleFacultyFilter = (initial: string) => {
    if (selectedFacultyFilter.includes(initial)) {
      setSelectedFacultyFilter(selectedFacultyFilter.filter(i => i !== initial));
    } else {
      setSelectedFacultyFilter([...selectedFacultyFilter, initial]);
    }
  };

  return (
    <div className="glass-panel-heavy rounded-3xl p-5 border border-slate-200/60 dark:border-zinc-800/60 shadow-lg mb-6">
      <div className="flex flex-col gap-4">
        {/* Row 1: Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            id="search-input"
            type="text"
            placeholder="Search by faculty initials, full name, room code, or course codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleQuerySubmit(searchQuery);
              }
            }}
            aria-label="Search consultation times"
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-slate-250 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-zinc-50 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestion Dropdown block */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-2 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/90 shadow-lg -mt-1 space-y-0.5 z-20"
            >
              <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-2 py-1">
                Suggestions
              </p>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    handleQuerySubmit(suggestion);
                    setSuggestions([]);
                  }}
                  className="w-full text-left px-3 py-2 text-xs md:text-sm font-semibold rounded-xl text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Row 2: Recent searches & filters */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-zinc-800/60 text-xs">
          {/* Recent searches */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" />
              Recent:
            </span>
            {recentSearches.length === 0 ? (
              <span className="text-slate-450 dark:text-zinc-600 italic">No search records</span>
            ) : (
              recentSearches.map((term, i) => (
                <div key={i} className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-850 px-2.5 py-1 rounded-xl">
                  <button
                    onClick={() => setSearchQuery(term)}
                    className="font-medium text-slate-600 dark:text-zinc-300 hover:text-blue-500 transition-colors cursor-pointer"
                  >
                    {term}
                  </button>
                  <button 
                    onClick={() => {
                      const updated = recentSearches.filter(q => q !== term);
                      setRecentSearches(updated);
                      localStorage.setItem('brac_recent_searches', JSON.stringify(updated));
                    }}
                    className="text-slate-400 hover:text-rose-500 transition-colors ml-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
            {recentSearches.length > 0 && (
              <button
                onClick={clearRecentSearches}
                className="text-rose-500 hover:text-rose-600 font-bold ml-1 cursor-pointer uppercase font-mono text-[10px]"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Favorites Switcher */}
          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-bold ${
              showOnlyFavorites
                ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                : 'border-slate-200 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:bg-slate-100'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-white' : ''}`} />
            <span>Only Favorites</span>
          </button>
        </div>

        {/* Row 3: Faculty Checkboxes Filter */}
        <div className="pt-3 border-t border-slate-150 dark:border-zinc-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-450 dark:text-zinc-500 font-bold uppercase tracking-wider flex-none">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Staff Initials:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {['MAF', 'RKBM', 'AFE', 'TBM', 'AVB'].map((initial) => {
              const isChecked = selectedFacultyFilter.includes(initial) || selectedFacultyFilter.length === 0;
              const isStrictlyChecked = selectedFacultyFilter.includes(initial);
              return (
                <button
                  key={initial}
                  onClick={() => toggleFacultyFilter(initial)}
                  className={`px-3 py-1.5 rounded-xl border font-bold font-mono transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                    isStrictlyChecked
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isStrictlyChecked}
                    readOnly
                    className="accent-blue-500 w-3 h-3 cursor-pointer hidden"
                  />
                  <span>{initial}</span>
                  {isStrictlyChecked && <span className="text-[9px] font-black">✓</span>}
                </button>
              );
            })}
            
            {selectedFacultyFilter.length > 0 && (
              <button
                onClick={() => setSelectedFacultyFilter([])}
                className="text-rose-500 hover:text-rose-600 font-bold text-[10px] uppercase font-mono ml-1.5"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
