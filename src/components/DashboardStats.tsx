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
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-450',
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
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        const isThird = idx === 2;
        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className={`group relative overflow-hidden rounded-xl bg-white/70 dark:bg-zinc-900/60 p-3.5 border border-slate-200/50 dark:border-zinc-800/60 shadow-sm transition-all duration-300 ${
              isThird ? 'col-span-2 md:col-span-1' : 'col-span-1'
            } ${stat.borderColor}`}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-slate-100 to-transparent dark:from-zinc-800/10 dark:to-transparent rounded-bl-full -z-10" />

            <div className="flex items-center justify-between gap-3 h-full">
              <div className="flex flex-col justify-between">
                <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">
                  {stat.label}
                </p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <h3 className="text-2xl font-display font-black tracking-tight text-slate-900 dark:text-zinc-50 leading-none">
                    {stat.value}
                  </h3>
                  {stat.pulsing && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-450 dark:text-zinc-400 mt-1.5 leading-none font-medium">
                  {stat.description}
                </p>
              </div>

              <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center flex-none shadow-xs group-hover:scale-105 transition-transform duration-300`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
