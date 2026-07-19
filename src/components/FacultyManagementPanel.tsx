import React, { useState, useRef } from 'react';
import { 
  X, Plus, Edit2, Trash2, Copy, Save, Upload, Download, 
  RotateCcw, Power, Check, Calendar, Clock, User, 
  MapPin, Mail, BookOpen, Palette, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Faculty, ScheduleSlot, ALL_DAYS } from '../data/schedule';
import { haptic } from '../utils/haptic';

interface FacultyManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  faculties: Faculty[];
  onUpdateFaculties: (newFacs: Faculty[]) => void;
  onRestoreDefaultFaculties: () => void;
  showToast: (msg: string) => void;
}

const COLOR_PRESETS = [
  { name: 'Blue', class: 'bg-blue-600', hover: 'ring-blue-400' },
  { name: 'Indigo', class: 'bg-indigo-600', hover: 'ring-indigo-400' },
  { name: 'Violet', class: 'bg-violet-600', hover: 'ring-violet-400' },
  { name: 'Purple', class: 'bg-purple-600', hover: 'ring-purple-400' },
  { name: 'Emerald', class: 'bg-emerald-600', hover: 'ring-emerald-400' },
  { name: 'Teal', class: 'bg-teal-600', hover: 'ring-teal-400' },
  { name: 'Rose', class: 'bg-rose-600', hover: 'ring-rose-400' },
  { name: 'Orange', class: 'bg-orange-500', hover: 'ring-orange-350' },
  { name: 'Amber', class: 'bg-amber-500', hover: 'ring-amber-350' },
  { name: 'Slate', class: 'bg-slate-700', hover: 'ring-slate-500' }
];

export const FacultyManagementPanel: React.FC<FacultyManagementPanelProps> = ({
  isOpen,
  onClose,
  faculties,
  onUpdateFaculties,
  onRestoreDefaultFaculties,
  showToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  
  // Slot editor temp state
  const [newSlotDay, setNewSlotDay] = useState<ScheduleSlot['day']>('Sunday');
  const [newSlotStart, setNewSlotStart] = useState('09:30');
  const [newSlotEnd, setNewSlotEnd] = useState('10:50');
  const [newSlotAppointment, setNewSlotAppointment] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Search faculties in management view
  const searchedFacs = faculties.filter(f => {
    const q = searchTerm.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.initial.toLowerCase().includes(q) ||
      f.room.toLowerCase().includes(q) ||
      f.courses.some(c => c.toLowerCase().includes(q))
    );
  });

  // Action: Add new faculty
  const handleAddNew = () => {
    haptic.medium();
    const tempId = `fac_${Date.now()}`;
    const newFac: Faculty = {
      id: tempId,
      name: 'New Faculty Member',
      initial: 'NEW',
      department: 'Computer Science & Engineering',
      courses: ['CSE110'],
      room: '4F',
      email: 'new.faculty@bracu.ac.bd',
      schedule: [],
      disabled: false,
      profileColor: 'bg-blue-600'
    };
    setEditingFaculty(newFac);
  };

  // Action: Save faculty
  const handleSave = () => {
    if (!editingFaculty) return;
    
    // Validate
    if (!editingFaculty.name.trim()) {
      showToast('Faculty Name is required.');
      haptic.error();
      return;
    }
    
    haptic.success();
    const exists = faculties.some(f => f.id === editingFaculty.id);
    let updated: Faculty[];
    
    if (exists) {
      updated = faculties.map(f => f.id === editingFaculty.id ? editingFaculty : f);
      showToast(`Updated schedule for ${editingFaculty.name}.`);
    } else {
      updated = [...faculties, editingFaculty];
      showToast(`Added ${editingFaculty.name} to roster.`);
    }
    
    onUpdateFaculties(updated);
    setEditingFaculty(null);
  };

  // Action: Delete faculty
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name}?`)) {
      haptic.heavy();
      const updated = faculties.filter(f => f.id !== id);
      onUpdateFaculties(updated);
      showToast(`Removed ${name}.`);
      if (editingFaculty?.id === id) {
        setEditingFaculty(null);
      }
    }
  };

  // Action: Duplicate faculty
  const handleDuplicate = (fac: Faculty) => {
    haptic.medium();
    const duplicated: Faculty = {
      ...fac,
      id: `fac_${Date.now()}`,
      name: `${fac.name} (Copy)`,
      initial: fac.initial ? `${fac.initial}2` : 'CPY',
      schedule: fac.schedule.map(s => ({ ...s }))
    };
    const updated = [...faculties, duplicated];
    onUpdateFaculties(updated);
    showToast(`Duplicated ${fac.name}.`);
    setEditingFaculty(duplicated);
  };

  // Action: Toggle Enable/Disable faculty
  const handleToggleDisabled = (fac: Faculty, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.medium();
    const updatedStatus = !fac.disabled;
    const updated = faculties.map(f => f.id === fac.id ? { ...f, disabled: updatedStatus } : f);
    onUpdateFaculties(updated);
    showToast(`${fac.name} is now ${updatedStatus ? 'Disabled (Hidden)' : 'Enabled (Visible)'}.`);
    if (editingFaculty?.id === fac.id) {
      setEditingFaculty(prev => prev ? { ...prev, disabled: updatedStatus } : null);
    }
  };

  // Slot management
  const handleAddSlot = () => {
    if (!editingFaculty) return;
    
    // Basic format check
    if (!newSlotStart || !newSlotEnd) {
      showToast('Please enter both start and end times.');
      haptic.error();
      return;
    }

    haptic.light();
    const newSlot: ScheduleSlot = {
      day: newSlotDay,
      startTime: newSlotStart,
      endTime: newSlotEnd,
      byAppointment: newSlotAppointment
    };

    const updatedSchedule = [...editingFaculty.schedule, newSlot];
    // Sort schedule: first by day, then by start time
    const dayOrder = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    updatedSchedule.sort((a, b) => {
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    setEditingFaculty({
      ...editingFaculty,
      schedule: updatedSchedule
    });

    // Reset slot temp states but keep Day for ease of continuous entry
    setNewSlotAppointment(false);
  };

  const handleRemoveSlot = (index: number) => {
    if (!editingFaculty) return;
    haptic.light();
    const updatedSchedule = editingFaculty.schedule.filter((_, idx) => idx !== index);
    setEditingFaculty({
      ...editingFaculty,
      schedule: updatedSchedule
    });
  };

  // Export Roster as JSON
  const handleExport = () => {
    haptic.medium();
    const dataStr = JSON.stringify(faculties, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `brac_faculty_roster_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Faculty roster exported successfully.');
  };

  // Import Roster from JSON
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') throw new Error('Invalid file format');
        const parsed = JSON.parse(result);
        
        if (!Array.isArray(parsed)) {
          throw new Error('Roster file must be an array of faculties');
        }

        // Basic verification
        const validated = parsed.filter(item => {
          return item && typeof item === 'object' && 'name' in item && 'schedule' in item;
        });

        if (validated.length === 0) {
          throw new Error('No valid faculty records found in JSON.');
        }

        haptic.success();
        onUpdateFaculties(validated);
        showToast(`Successfully imported ${validated.length} faculties.`);
      } catch (err: any) {
        haptic.error();
        alert(`Failed to import roster: ${err.message || 'Invalid JSON format'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const handleRestoreDefaults = () => {
    if (window.confirm('This will wipe all modifications and restore original faculties schedule. Continue?')) {
      haptic.heavy();
      onRestoreDefaultFaculties();
      setEditingFaculty(null);
      showToast('Original faculty roster restored.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-lg"
      />

      {/* Main Container Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="relative w-full max-w-5xl h-[92vh] md:h-[85vh] rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col z-10 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base md:text-lg text-slate-900 dark:text-zinc-50 leading-tight">
                Faculty & Schedule Management
              </h3>
              <p className="text-[10px] md:text-xs font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Roster Customization Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-full border border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-350 cursor-pointer transition-colors bg-white dark:bg-zinc-900"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="px-6 py-3.5 bg-slate-100/50 dark:bg-zinc-950/40 border-b border-slate-200/50 dark:border-zinc-800/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleAddNew}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Roster</span>
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 border border-slate-200/50 dark:border-zinc-700/50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Roster</span>
            </button>
            <button
              onClick={handleImportClick}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 border border-slate-200/50 dark:border-zinc-700/50 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Roster</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
          </div>

          <button
            onClick={handleRestoreDefaults}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 dark:border-rose-500/15 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Defaults</span>
          </button>
        </div>

        {/* Modal Work Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* LEFT COLUMN: Faculty List */}
          <div className="w-full md:w-[42%] border-r border-slate-150 dark:border-zinc-800/80 flex flex-col h-full bg-slate-50/20 dark:bg-zinc-950/10">
            {/* Search inputs */}
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50">
              <input
                type="text"
                placeholder="Search roster by name, initial, room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-850/80 outline-none text-slate-800 dark:text-zinc-100 focus:border-blue-500 dark:focus:border-blue-500/55 transition-colors"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {searchedFacs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-zinc-500 flex flex-col items-center gap-1.5">
                  <User className="w-8 h-8 opacity-40" />
                  <span className="text-xs font-medium">No faculty records found</span>
                </div>
              ) : (
                searchedFacs.map((fac) => {
                  const isSelected = editingFaculty?.id === fac.id;
                  const profileBg = fac.profileColor || 'bg-blue-600';
                  
                  return (
                    <div
                      key={fac.id}
                      onClick={() => {
                        haptic.light();
                        setEditingFaculty({ ...fac });
                      }}
                      className={`p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 group relative ${
                        isSelected 
                          ? 'bg-blue-500/5 border-blue-500 dark:bg-blue-500/10 dark:border-blue-500/60' 
                          : 'bg-white dark:bg-zinc-900 border-slate-150 dark:border-zinc-800/60 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Profile initials visual badge */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-display font-black text-xs shadow-sm flex-none ${profileBg} ${fac.disabled ? 'opacity-40 grayscale' : ''}`}>
                          {fac.initial}
                        </div>
                        
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold truncate ${fac.disabled ? 'text-slate-400 dark:text-zinc-500 line-through' : 'text-slate-850 dark:text-zinc-100'}`}>
                            {fac.name}
                          </h4>
                          <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
                            Room {fac.room} • {fac.courses.join(', ')}
                          </p>
                        </div>
                      </div>

                      {/* Item actions */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 flex-none z-10" onClick={e => e.stopPropagation()}>
                        {/* Toggle Disabled */}
                        <button
                          onClick={(e) => handleToggleDisabled(fac, e)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            fac.disabled
                              ? 'text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 bg-slate-100 dark:bg-zinc-800/60'
                              : 'text-emerald-500 dark:text-emerald-400 hover:text-slate-400 bg-emerald-500/5 hover:bg-slate-100 dark:hover:bg-zinc-800'
                          }`}
                          title={fac.disabled ? "Enable Faculty" : "Disable Faculty"}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(fac)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer"
                          title="Duplicate Faculty"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Remove */}
                        <button
                          onClick={() => handleDelete(fac.id, fac.name)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Delete Faculty"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Roster Editor Form */}
          <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-900 overflow-y-auto">
            {editingFaculty ? (
              <div className="p-6 space-y-6">
                {/* Form header with visual status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800/60">
                  <div>
                    <h3 className="font-display font-black text-base text-slate-800 dark:text-zinc-100">
                      Edit Faculty Profile
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                      {editingFaculty.id.startsWith('fac_') ? 'Draft Record' : 'Saved Record'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingFaculty(null)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Record</span>
                    </button>
                  </div>
                </div>

                {/* Form fields layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      Faculty Name *
                    </label>
                    <input
                      type="text"
                      value={editingFaculty.name}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, name: e.target.value })}
                      placeholder="e.g. MD Asif"
                      className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Initials */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      Initials (Optional)
                    </label>
                    <input
                      type="text"
                      value={editingFaculty.initial}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, initial: e.target.value.toUpperCase().slice(0, 10) })}
                      placeholder="e.g. MAF"
                      className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Room */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      Room Number *
                    </label>
                    <input
                      type="text"
                      value={editingFaculty.room}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, room: e.target.value })}
                      placeholder="e.g. 4F"
                      className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Course (string but converted to string[]) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                      Courses (comma separated) *
                    </label>
                    <input
                      type="text"
                      value={editingFaculty.courses.join(', ')}
                      onChange={(e) => setEditingFaculty({ 
                        ...editingFaculty, 
                        courses: e.target.value.split(',').map(c => c.trim().toUpperCase()).filter(Boolean)
                      })}
                      placeholder="e.g. CSE111, CSE110"
                      className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Department */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                      Department
                    </label>
                    <input
                      type="text"
                      value={editingFaculty.department}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, department: e.target.value })}
                      placeholder="e.g. Computer Science & Engineering"
                      className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      University Email
                    </label>
                    <input
                      type="email"
                      value={editingFaculty.email}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, email: e.target.value })}
                      placeholder="e.g. mumit.faruque@bracu.ac.bd"
                      className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Theme / Profile Color Selection */}
                  <div className="flex flex-col gap-2.5 sm:col-span-2">
                    <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5 text-indigo-400" />
                      Profile Badge Aesthetic Presets
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {COLOR_PRESETS.map((color) => {
                        const isSelected = editingFaculty.profileColor === color.class;
                        return (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => setEditingFaculty({ ...editingFaculty, profileColor: color.class })}
                            className={`w-7 h-7 rounded-full cursor-pointer border border-white dark:border-zinc-900 transition-all ${color.class} ${
                              isSelected 
                                ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-zinc-900 scale-110' 
                                : 'opacity-80 hover:opacity-100 hover:scale-105'
                            }`}
                            title={color.name}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* SLOTS EDITING CONSOLE */}
                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Consultation Time Slots ({editingFaculty.schedule.length})
                  </h4>

                  {/* Slot Creator Panel */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-200/60 dark:border-zinc-800/80 flex flex-col gap-3 mb-4">
                    <div className="text-[10px] font-mono font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">
                      Add New Session Slot
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                      {/* Day select */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500">Day</span>
                        <select
                          value={newSlotDay}
                          onChange={(e) => setNewSlotDay(e.target.value as any)}
                          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs outline-none cursor-pointer text-slate-800 dark:text-zinc-200"
                        >
                          {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>

                      {/* Start Time picker */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500">Start Time</span>
                        <input
                          type="time"
                          value={newSlotStart}
                          onChange={(e) => setNewSlotStart(e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs outline-none cursor-pointer text-slate-800 dark:text-zinc-200"
                        />
                      </div>

                      {/* End Time picker */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500">End Time</span>
                        <input
                          type="time"
                          value={newSlotEnd}
                          onChange={(e) => setNewSlotEnd(e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs outline-none cursor-pointer text-slate-800 dark:text-zinc-200"
                        />
                      </div>

                      {/* Add Slot Trigger */}
                      <div>
                        <button
                          type="button"
                          onClick={handleAddSlot}
                          className="w-full px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Slot</span>
                        </button>
                      </div>
                    </div>

                    {/* Checkbox appointment */}
                    <div className="flex items-center gap-2 mt-1 select-none">
                      <input
                        type="checkbox"
                        id="appointment_checkbox"
                        checked={newSlotAppointment}
                        onChange={(e) => setNewSlotAppointment(e.target.checked)}
                        className="rounded border-slate-300 dark:border-zinc-800 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                      />
                      <label htmlFor="appointment_checkbox" className="text-xs text-slate-500 dark:text-zinc-400 cursor-pointer font-medium">
                        Requires prior appointment (By Appointment)
                      </label>
                    </div>
                  </div>

                  {/* Slots List */}
                  {editingFaculty.schedule.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-950/20 border border-dashed border-slate-200 dark:border-zinc-850 text-center text-slate-400 dark:text-zinc-500 flex flex-col items-center gap-1.5">
                      <Clock className="w-6 h-6 opacity-40" />
                      <span className="text-xs">No consultation sessions have been added yet.</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {editingFaculty.schedule.map((slot, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/30 border border-slate-200/50 dark:border-zinc-800/40 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            {/* Day indicator label */}
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px] tracking-wide uppercase min-w-[75px] text-center">
                              {slot.day}
                            </span>
                            
                            <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
                              {slot.startTime} – {slot.endTime}
                            </span>

                            {slot.byAppointment && (
                              <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 bg-amber-500/5 border border-amber-500/10 px-1.5 py-0.5 rounded">
                                By Appt
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(index)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/5 cursor-pointer"
                            title="Remove Session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-zinc-500">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-zinc-950 flex items-center justify-center text-slate-350 dark:text-zinc-700 border border-slate-100 dark:border-zinc-850/60 mb-3">
                  <Edit2 className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-750 dark:text-zinc-300">No Faculty Selected</h4>
                <p className="text-xs max-w-sm mt-1.5 leading-relaxed">
                  Select a faculty card from the left-hand column to edit their consultation slots, profile aesthetics, and details, or add a new record.
                </p>
                
                <button
                  onClick={handleAddNew}
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Record</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
