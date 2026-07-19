export interface ScheduleSlot {
  day: 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  byAppointment?: boolean;
}

export interface Faculty {
  id: string;
  name: string;
  initial: string;
  department: string;
  courses: string[];
  room: string;
  email: string;
  schedule: ScheduleSlot[];
  disabled?: boolean;
  profileColor?: string;
}

export const FALLBACK_SCHEDULES: Faculty[] = [
  {
    id: "maf",
    name: "MD Asif",
    initial: "MAF",
    department: "Computer Science & Engineering",
    courses: ["CSE111"],
    room: "4F",
    email: "mumit.faruque@bracu.ac.bd",
    schedule: [
      { day: "Sunday", startTime: "09:30", endTime: "10:50", byAppointment: false },
      { day: "Sunday", startTime: "11:00", endTime: "12:20", byAppointment: false },
      { day: "Monday", startTime: "08:00", endTime: "09:20", byAppointment: false },
      { day: "Monday", startTime: "09:30", endTime: "10:50", byAppointment: false },
      { day: "Wednesday", startTime: "08:00", endTime: "09:20", byAppointment: false },
      { day: "Wednesday", startTime: "09:30", endTime: "10:50", byAppointment: false }
    ]
  },
  {
    id: "rkbm",
    name: "Mohammad Rakibul Hasan Mahin",
    initial: "RKBM",
    department: "Computer Science & Engineering",
    courses: ["CSE111"],
    room: "4M128",
    email: "rashed.kibria@bracu.ac.bd",
    schedule: [
      { day: "Sunday", startTime: "11:00", endTime: "12:20", byAppointment: false },
      { day: "Sunday", startTime: "12:30", endTime: "13:50", byAppointment: false },
      { day: "Tuesday", startTime: "12:30", endTime: "13:50", byAppointment: false },
      { day: "Thursday", startTime: "11:00", endTime: "12:20", byAppointment: false },
      { day: "Thursday", startTime: "12:30", endTime: "13:50", byAppointment: false },
      { day: "Thursday", startTime: "14:00", endTime: "15:20", byAppointment: false }
    ]
  },
  {
    id: "afe",
    name: "AFE (MAT120 Faculty)",
    initial: "AFE",
    department: "Mathematics & Natural Sciences",
    courses: ["MAT120"],
    room: "4G-44",
    email: "ferdaus.elahi@bracu.ac.bd",
    schedule: [
      { day: "Sunday", startTime: "11:00", endTime: "12:15", byAppointment: false },
      { day: "Monday", startTime: "11:00", endTime: "12:15", byAppointment: false },
      { day: "Tuesday", startTime: "11:00", endTime: "12:15", byAppointment: false },
      { day: "Wednesday", startTime: "11:00", endTime: "12:15", byAppointment: false }
    ]
  },
  {
    id: "tbm",
    name: "Tabassum Taspya",
    initial: "TBM",
    department: "English & Humanities",
    courses: ["CHE101"],
    room: "4R212",
    "email": "tasnim.mubashshir@bracu.ac.bd",
    schedule: [
      { day: "Saturday", startTime: "09:50", endTime: "10:50", byAppointment: false },
      { day: "Saturday", startTime: "11:00", endTime: "13:00", byAppointment: false },
      { day: "Saturday", startTime: "15:30", endTime: "16:50", byAppointment: false },
      { day: "Monday", startTime: "09:50", endTime: "10:50", byAppointment: false },
      { day: "Monday", startTime: "11:00", endTime: "13:00", byAppointment: false },
      { day: "Wednesday", startTime: "09:50", endTime: "10:50", byAppointment: false },
      { day: "Wednesday", startTime: "11:00", endTime: "13:00", byAppointment: false },
      { day: "Thursday", startTime: "09:50", endTime: "10:50", byAppointment: false },
      { day: "Thursday", startTime: "11:00", endTime: "13:00", byAppointment: false }
    ]
  },
  {
    id: "avb",
    name: "Avinandan Banerjee",
    initial: "AVB",
    department: "Mathematics & Natural Sciences",
    courses: ["CSE111"],
    room: "4M118",
    email: "amitabha.bose@bracu.ac.bd",
    schedule: [
      { day: "Saturday", startTime: "14:00", endTime: "15:20", byAppointment: false },
      { day: "Sunday", startTime: "14:00", endTime: "15:20", byAppointment: true },
      { day: "Monday", startTime: "14:00", endTime: "15:20", byAppointment: true },
      { day: "Tuesday", startTime: "14:00", endTime: "15:20", byAppointment: false },
      { day: "Wednesday", startTime: "14:00", endTime: "15:20", byAppointment: false },
      { day: "Thursday", startTime: "14:00", endTime: "15:20", byAppointment: false }
    ]
  }
];

export const DAY_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  Saturday: { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800/50', accent: 'bg-purple-500' },
  Sunday: { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800/50', accent: 'bg-orange-500' },
  Monday: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/50', accent: 'bg-blue-500' },
  Tuesday: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800/50', accent: 'bg-green-500' },
  Wednesday: { bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800/50', accent: 'bg-pink-500' },
  Thursday: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800/50', accent: 'bg-cyan-500' },
  Friday: { bg: 'bg-slate-50 dark:bg-slate-950/30', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-800/50', accent: 'bg-slate-500' }
};

export const ALL_DAYS: Array<'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday'> = [
  'Saturday',
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday'
];
