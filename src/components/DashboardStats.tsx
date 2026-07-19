import React from 'react';
import { Users, Calendar, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Faculty } from '../data/schedule';

interface DashboardStatsProps {
  faculties: Faculty[];
  currentDay: string;
  availableCount: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  faculties,
  currentDay,
  availableCount
}) => {
  // Calculate total number of consultation slots scheduled for today
  const consultationsTodayCount = faculties.reduce((count, faculty) => {
    const todaySlots = faculty.schedule.filter(slot => slot.day === currentDay);
    return count + todaySlots.length;
  }, 0);

  const systemDayIndex = new Date().getDay();
  const systemDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][systemDayIndex];
  const isToday = currentDay === systemDayName;

  const stats = [
    {
      id: 'faculty-count',
      label: 'Academic Staff',
      value: faculties.length,
      description: 'Active Instructors',
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      borderColor: 'group-hover:border-blue-500/30'
    },
    {
      id: 'today-consultations',
      label: isToday ? "Today's Sessions" : `${currentDay}'s Sessions`,
      value: consultationsTodayCount,
      description: `${currentDay} Schedule`,
      icon: Calendar,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      borderColor: 'group-hover:border-indigo-500/30'
    },
    {
      id: 'available-now',
      label: 'Available Now',
      value: availableCount,
      description: availableCount > 0 ? 'Holding Office Hours' : 'Check schedules below',
      icon: CheckCircle2,
      color: availableCount > 0 
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
        : 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
      borderColor: 'group-hover:border-emerald-500/30',
      pulsing: availableCount > 0
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`group relative overflow-hidden rounded-2xl glass-panel-heavy p-5 border border-slate-200/60 dark:border-zinc-800/60 shadow-sm transition-all duration-300 ${stat.borderColor}`}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-100 to-transparent dark:from-zinc-800/20 dark:to-transparent rounded-bl-full -z-10" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
                  {stat.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-display font-black tracking-tight text-slate-900 dark:text-zinc-50">
                    {stat.value}
                  </h3>
                  {stat.pulsing && (
                    <span className="relative flex h-3 w-3 mb-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                  {stat.description}
                </p>
              </div>

              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
