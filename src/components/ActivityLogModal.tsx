import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Calendar, Download, Trash2, Clock, Filter, AlertCircle, FileJson, User, ShieldCheck } from 'lucide-react';
import { haptic } from '../utils/haptic';

export interface ActivityLogEntry {
  id: string;
  timestamp: string; // ISO string
  action: string;
  facultyName: string;
  details?: string;
}

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLogEntry[];
  onClearLogs: () => void;
  showToast: (msg: string) => void;
  isAdminMode: boolean;
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  showToast,
  isAdminMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'today' | '7days' | '30days' | 'all'>('all');

  if (!isOpen) return null;
  if (!isAdminMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl max-w-sm w-full text-center border border-slate-200 dark:border-zinc-800">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50">Admin Access Required</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">Please unlock Admin Mode to view the activity logs.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold w-full">Close</button>
        </div>
      </div>
    );
  }

  // Filter logs based on date and search
  const filteredLogs = logs.filter(log => {
    // 1. Search Query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchAction = log.action.toLowerCase().includes(q);
      const matchFaculty = log.facultyName.toLowerCase().includes(q);
      const matchDetails = log.details ? log.details.toLowerCase().includes(q) : false;
      if (!matchAction && !matchFaculty && !matchDetails) return false;
    }

    // 2. Date Filter
    const logDate = new Date(log.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - logDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (timeFilter === 'today') {
      return logDate.toDateString() === now.toDateString();
    } else if (timeFilter === '7days') {
      return diffDays <= 7;
    } else if (timeFilter === '30days') {
      return diffDays <= 30;
    }
    return true; // 'all'
  });

  // Action: Export as JSON
  const handleExportJSON = () => {
    haptic.medium();
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `brac_consultation_activity_log_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('💾 Activity Log exported successfully!');
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    const day = d.getDate();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 12 instead of 0
    return `${hours}:${minutes} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/60 dark:bg-black/85 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="relative w-full max-w-4xl h-[92vh] md:h-[85vh] rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col z-10 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/20 backdrop-blur-md flex-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base md:text-lg text-slate-900 dark:text-zinc-50 leading-tight">
                Admin Activity Log
              </h3>
              <p className="text-[10px] md:text-xs font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Authorized Audit Trail
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full border border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-350 cursor-pointer transition-colors bg-white dark:bg-zinc-900"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters and Controls Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800/60 bg-slate-50/30 dark:bg-zinc-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-none">
          {/* Time Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-950 rounded-2xl border border-slate-200/50 dark:border-zinc-850/60">
            {(['all', 'today', '7days', '30days'] as const).map((filter) => {
              const label = {
                all: 'All Logs',
                today: 'Today',
                '7days': 'Last 7 Days',
                '30days': 'Last 30 Days'
              }[filter];

              const isActive = timeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => {
                    haptic.light();
                    setTimeFilter(filter);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-650'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Search Input and Export Actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3.5 py-1.5 w-full sm:w-48 md:w-60 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              onClick={handleExportJSON}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-750 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer border border-slate-700/20"
              title="Export Logs as JSON"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>

            {logs.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Wipe all activity logs? This action is permanent.')) {
                    haptic.heavy();
                    onClearLogs();
                    showToast('🗑 Activity logs cleared.');
                  }
                }}
                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/10 cursor-pointer"
                title="Clear Logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Log list view */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20 dark:bg-zinc-950/5">
          {filteredLogs.length === 0 ? (
            <div className="py-24 text-center text-slate-400 dark:text-zinc-500 flex flex-col items-center gap-2">
              <Calendar className="w-12 h-12 opacity-30 text-slate-350 dark:text-zinc-600" />
              <h4 className="text-sm font-bold text-slate-650 dark:text-zinc-300">No logs found</h4>
              <p className="text-xs max-w-xs mt-1 leading-relaxed">
                {logs.length === 0
                  ? 'No administrator activities have been recorded yet.'
                  : 'Adjust your search queries or filter tabs to show matching entries.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-w-3xl mx-auto">
              {filteredLogs.map((log) => {
                // Determine beautiful colors for different action types
                let actionColor = 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300';
                if (log.action.includes('Add') || log.action.includes('Restore')) {
                  actionColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
                } else if (log.action.includes('Edit') || log.action.includes('Change')) {
                  actionColor = 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
                } else if (log.action.includes('Delete') || log.action.includes('Wipe')) {
                  actionColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
                } else if (log.action.includes('Import')) {
                  actionColor = 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
                }

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex gap-3 items-start min-w-0">
                      {/* Left: Date/Time Stamp block */}
                      <div className="flex-none bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 px-2.5 py-2 rounded-xl text-center min-w-[100px]">
                        <p className="text-[10px] font-mono font-bold text-slate-800 dark:text-zinc-200 tracking-tight">
                          {formatDate(log.timestamp)}
                        </p>
                        <p className="text-[9px] font-mono text-slate-400 dark:text-zinc-500 mt-1 leading-none">
                          {formatTime(log.timestamp)}
                        </p>
                      </div>

                      {/* Middle: Action & Details */}
                      <div className="min-w-0">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider mb-1.5 ${actionColor}`}>
                          {log.action}
                        </span>
                        {log.details && (
                          <p className="text-[11px] text-slate-400 dark:text-zinc-450 font-mono mt-0.5 truncate max-w-md">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Faculty target badge */}
                    <div className="flex-none flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-150/40 dark:border-zinc-850 self-start sm:self-center">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-black text-slate-700 dark:text-zinc-300">
                        {log.facultyName}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
