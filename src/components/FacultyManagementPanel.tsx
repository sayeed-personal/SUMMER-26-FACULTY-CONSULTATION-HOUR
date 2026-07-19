import React, { useState, useRef } from 'react';
import { 
  X, Plus, Edit2, Trash2, Save, Upload, Download, 
  RotateCcw, Power, Check, Calendar, Clock, User, 
  MapPin, Mail, BookOpen, Palette, AlertTriangle, GripVertical, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Faculty, ScheduleSlot, ALL_DAYS, FALLBACK_SCHEDULES } from '../data/schedule';
import { haptic } from '../utils/haptic';
import { FacultyAvatar, AVATAR_ICONS } from './FacultyAvatar';

interface FacultyManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  faculties: Faculty[];
  onUpdateFaculties: (newFacs: Faculty[]) => void;
  onRestoreDefaultFaculties: () => void;
  showToast: (msg: string) => void;
  isAdminMode: boolean;
  onDeleteFaculty?: (id: string) => void;
  addActivityLog?: (action: string, facultyName: string, details?: string) => void;
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
  showToast,
  isAdminMode,
  onDeleteFaculty,
  addActivityLog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  
  // Slot editor temp states
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [editSlotDay, setEditSlotDay] = useState<ScheduleSlot['day']>('Sunday');
  const [editSlotStart, setEditSlotStart] = useState('09:30');
  const [editSlotEnd, setEditSlotEnd] = useState('10:50');
  const [editSlotAppointment, setEditSlotAppointment] = useState(false);

  // Slot adder temp states
  const [addingSlotForDay, setAddingSlotForDay] = useState<ScheduleSlot['day'] | null>(null);
  const [addSlotStart, setAddSlotStart] = useState('09:30');
  const [addSlotEnd, setAddSlotEnd] = useState('10:50');
  const [addSlotAppointment, setAddSlotAppointment] = useState(false);

  // Legacy fields to keep compiler happy but unused
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

    // Trigger Activity Log
    if (addActivityLog) {
      const original = faculties.find(f => f.id === editingFaculty.id);
      if (!original) {
        addActivityLog('Faculty Added', editingFaculty.name);
      } else {
        let logged = false;
        if (original.email !== editingFaculty.email) {
          addActivityLog('Email Changed', editingFaculty.name, `From ${original.email} to ${editingFaculty.email}`);
          logged = true;
        }
        if (original.room !== editingFaculty.room) {
          addActivityLog('Room Changed', editingFaculty.name, `From ${original.room} to ${editingFaculty.room}`);
          logged = true;
        }
        const originalScheduleStr = JSON.stringify(original.schedule);
        const editedScheduleStr = JSON.stringify(editingFaculty.schedule);
        if (originalScheduleStr !== editedScheduleStr) {
          const originalDays = original.schedule.map(s => s.day).sort().join(',');
          const editedDays = editingFaculty.schedule.map(s => s.day).sort().join(',');
          if (originalDays !== editedDays) {
            addActivityLog('Consultation Day Changed', editingFaculty.name);
          } else {
            addActivityLog('Consultation Time Changed', editingFaculty.name);
          }
          logged = true;
        }
        if (!logged) {
          addActivityLog('Faculty Edited', editingFaculty.name);
        }
      }
    }
    
    onUpdateFaculties(updated);
    setEditingFaculty(null);
  };

  // Action: Trigger delete confirmation modal
  const handleDeleteTrigger = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  // Action: Complete delete
  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    haptic.heavy();
    const { id, name } = deleteConfirm;
    
    if (onDeleteFaculty) {
      onDeleteFaculty(id);
    } else {
      const updated = faculties.filter(f => f.id !== id);
      onUpdateFaculties(updated);
      if (addActivityLog) {
        addActivityLog('Faculty Deleted', name);
      }
    }
    
    showToast(`Removed ${name}.`);
    if (editingFaculty?.id === id) {
      setEditingFaculty(null);
    }
    setDeleteConfirm(null);
  };

  // Action: Toggle Enable/Disable faculty
  const handleToggleDisabled = (fac: Faculty, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.medium();
    const updatedStatus = !fac.disabled;
    const updated = faculties.map(f => f.id === fac.id ? { ...f, disabled: updatedStatus } : f);
    
    if (addActivityLog) {
      addActivityLog(
        updatedStatus ? 'Faculty Disabled' : 'Faculty Enabled',
        fac.name,
        updatedStatus ? 'Disabled (Hidden)' : 'Enabled (Visible)'
      );
    }
    
    onUpdateFaculties(updated);
    showToast(`${fac.name} is now ${updatedStatus ? 'Disabled (Hidden)' : 'Enabled (Visible)'}.`);
    if (editingFaculty?.id === fac.id) {
      setEditingFaculty(prev => prev ? { ...prev, disabled: updatedStatus } : null);
    }
  };

  // Restore Single Faculty Default
  const handleRestoreSingleDefault = () => {
    if (!editingFaculty) return;
    const original = FALLBACK_SCHEDULES.find(f => f.id === editingFaculty.id);
    if (!original) {
      showToast('❌ This faculty member is not part of the default roster.');
      return;
    }
    if (window.confirm(`Restore ${original.name} to default settings? This will reset their schedule and profile details.`)) {
      haptic.heavy();
      const updated = faculties.map(f => f.id === original.id ? { ...original } : f);
      onUpdateFaculties(updated);
      setEditingFaculty({ ...original });
      showToast(`Restored ${original.name} to default settings.`);
      if (addActivityLog) {
        addActivityLog('Restore Default', original.name, 'Restored single default faculty');
      }
    }
  };

  // Drag and Drop handlers for reordering
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIdx = faculties.findIndex(f => f.id === draggedId);
    const targetIdx = faculties.findIndex(f => f.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const updated = [...faculties];
    const [draggedItem] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, draggedItem);

    onUpdateFaculties(updated);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  // Slot management
  const handleStartEditSlot = (index: number, slot: ScheduleSlot) => {
    haptic.light();
    setEditingSlotIndex(index);
    setEditSlotDay(slot.day);
    setEditSlotStart(slot.startTime);
    setEditSlotEnd(slot.endTime);
    setEditSlotAppointment(!!slot.byAppointment);
    setAddingSlotForDay(null); // Close adder if any
  };

  const handleCancelEditSlot = () => {
    haptic.light();
    setEditingSlotIndex(null);
  };

  const handleSaveEditSlot = () => {
    if (!editingFaculty || editingSlotIndex === null) return;
    haptic.success();
    const updatedSchedule = [...editingFaculty.schedule];
    updatedSchedule[editingSlotIndex] = {
      day: editSlotDay,
      startTime: editSlotStart,
      endTime: editSlotEnd,
      byAppointment: editSlotAppointment
    };
    
    // Re-sort
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
    setEditingSlotIndex(null);
  };

  const handleStartAddSlotForDay = (day: ScheduleSlot['day']) => {
    haptic.light();
    setAddingSlotForDay(day);
    setAddSlotStart('09:30');
    setAddSlotEnd('10:50');
    setAddSlotAppointment(false);
    setEditingSlotIndex(null); // Close editor if any
  };

  const handleSaveAddSlotForDay = () => {
    if (!editingFaculty || !addingSlotForDay) return;
    haptic.success();
    const newSlot: ScheduleSlot = {
      day: addingSlotForDay,
      startTime: addSlotStart,
      endTime: addSlotEnd,
      byAppointment: addSlotAppointment
    };

    const updatedSchedule = [...editingFaculty.schedule, newSlot];
    // Re-sort
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
    setAddingSlotForDay(null);
  };

  const handleMoveSlot = (index: number, direction: 'up' | 'down') => {
    if (!editingFaculty) return;
    haptic.light();
    const updatedSchedule = [...editingFaculty.schedule];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < updatedSchedule.length) {
      // Swap slots
      const temp = updatedSchedule[index];
      updatedSchedule[index] = updatedSchedule[targetIndex];
      updatedSchedule[targetIndex] = temp;
      
      setEditingFaculty({
        ...editingFaculty,
        schedule: updatedSchedule
      });
      
      if (editingSlotIndex === index) {
        setEditingSlotIndex(targetIndex);
      } else if (editingSlotIndex === targetIndex) {
        setEditingSlotIndex(index);
      }
    }
  };

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
    if (editingSlotIndex === index) {
      setEditingSlotIndex(null);
    } else if (editingSlotIndex !== null && editingSlotIndex > index) {
      setEditingSlotIndex(editingSlotIndex - 1);
    }
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
    if (addActivityLog) {
      addActivityLog('Export JSON', 'Roster', 'Exported full faculty roster');
    }
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
        if (addActivityLog) {
          addActivityLog('Import JSON', 'Roster', `Imported ${validated.length} faculty records`);
        }
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
      if (addActivityLog) {
        addActivityLog('Restore Default', 'All Faculty', 'Restored default roster');
      }
    }
  };

  return (
    <>
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
                  
                  return (
                    <div
                      key={fac.id}
                      onClick={() => {
                        haptic.light();
                        setEditingFaculty({ ...fac });
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, fac.id)}
                      onDragOver={(e) => handleDragOver(e, fac.id)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 group relative ${
                        draggedId === fac.id ? 'opacity-30 border-dashed border-blue-500 bg-blue-500/5 scale-95' : ''
                      } ${
                        isSelected 
                          ? 'bg-blue-500/5 border-blue-500 dark:bg-blue-500/10 dark:border-blue-500/60' 
                          : 'bg-white dark:bg-zinc-900 border-slate-150 dark:border-zinc-800/60 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Drag Handle */}
                        <div 
                          className="text-slate-300 dark:text-zinc-700 cursor-grab active:cursor-grabbing hover:text-slate-500 dark:hover:text-zinc-400 flex-none py-1.5"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Profile initials visual badge */}
                        <FacultyAvatar faculty={fac} className="w-9 h-9 text-xs flex-none" />
                        
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

                        {/* Remove */}
                        <button
                          onClick={() => handleDeleteTrigger(fac.id, fac.name)}
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
                    {isAdminMode && FALLBACK_SCHEDULES.some(f => f.id === editingFaculty.id) && (
                      <button
                        onClick={handleRestoreSingleDefault}
                        className="px-3 py-1.5 rounded-xl text-rose-600 hover:text-rose-750 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Restore Default Roster Schedule for this Faculty Only"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore Default</span>
                      </button>
                    )}
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

                  {/* Office Location */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      Office Location (Optional)
                    </label>
                    <input
                      type="text"
                      value={editingFaculty.office || ''}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, office: e.target.value })}
                      placeholder="e.g. Building 2, Floor 5, Room 502"
                      className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Notes */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Important Notes / Bio (Optional)
                    </label>
                    <textarea
                      value={editingFaculty.notes || ''}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, notes: e.target.value })}
                      placeholder="e.g. Available only on appointments during midterms."
                      rows={2}
                      className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors resize-none"
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

                  {/* Icon Selection Option */}
                  <div className="flex flex-col gap-2.5 sm:col-span-2 pt-2">
                    <label className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Custom Badge Icon (Optional)
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-8 gap-2">
                      {/* Option to use initials instead (None) */}
                      <button
                        type="button"
                        onClick={() => setEditingFaculty({ ...editingFaculty, icon: undefined })}
                        className={`py-1.5 px-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer flex items-center justify-center ${
                          !editingFaculty.icon 
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-zinc-900 dark:border-white' 
                            : 'bg-slate-50 border-slate-200/60 dark:bg-zinc-950 dark:border-zinc-850 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-805'
                        }`}
                      >
                        Initials
                      </button>

                      {Object.keys(AVATAR_ICONS).map((iconName) => {
                        const IconNode = AVATAR_ICONS[iconName];
                        const isSelected = editingFaculty.icon === iconName;
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setEditingFaculty({ ...editingFaculty, icon: iconName })}
                            className={`p-2 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-zinc-900 dark:border-white scale-105 shadow-sm' 
                                : 'bg-slate-50 border-slate-200/60 dark:bg-zinc-950 dark:border-zinc-850 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-805'
                            }`}
                            title={iconName}
                          >
                            <IconNode className="w-4 h-4 stroke-[2]" />
                          </button>
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

                  <div className="space-y-4">
                    {ALL_DAYS.map(day => {
                      const daySlots = editingFaculty.schedule
                        .map((slot, index) => ({ slot, index }))
                        .filter(item => item.slot.day === day);
                        
                      return (
                        <div key={day} className="p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-150 dark:border-zinc-800/60">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-display font-bold text-xs text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              {day}
                            </h5>
                            
                            {addingSlotForDay !== day && (
                              <button
                                type="button"
                                onClick={() => handleStartAddSlotForDay(day)}
                                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Time Slot</span>
                              </button>
                            )}
                          </div>
                          
                          {/* List slots or empty state */}
                          {daySlots.length === 0 && addingSlotForDay !== day ? (
                            <p className="text-[10px] text-slate-400 dark:text-zinc-500 italic px-2 py-1">No consultation slots scheduled.</p>
                          ) : (
                            <div className="space-y-2">
                              {daySlots.map(({ slot, index }) => {
                                const isEditingThisSlot = editingSlotIndex === index;
                                
                                if (isEditingThisSlot) {
                                  return (
                                    <div key={index} className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-blue-500/50 dark:border-blue-500/40 space-y-3 shadow-xs">
                                      <div className="grid grid-cols-2 gap-2.5">
                                        <div>
                                          <label className="text-[9px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase">Change Day</label>
                                          <select
                                            value={editSlotDay}
                                            onChange={(e) => setEditSlotDay(e.target.value as any)}
                                            className="w-full mt-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-[11px] outline-none cursor-pointer text-slate-800 dark:text-zinc-200"
                                          >
                                            {ALL_DAYS.map(d => (
                                              <option key={d} value={d}>{d}</option>
                                            ))}
                                          </select>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mt-4 select-none">
                                          <input
                                            type="checkbox"
                                            id={`edit_appt_${index}`}
                                            checked={editSlotAppointment}
                                            onChange={(e) => setEditSlotAppointment(e.target.checked)}
                                            className="rounded border-slate-300 dark:border-zinc-800 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                                          />
                                          <label htmlFor={`edit_appt_${index}`} className="text-[10px] text-slate-500 dark:text-zinc-400 cursor-pointer font-bold leading-none">
                                            By Appt
                                          </label>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-2.5">
                                        <div>
                                          <label className="text-[9px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase">Start Time</label>
                                          <input
                                            type="time"
                                            value={editSlotStart}
                                            onChange={(e) => setEditSlotStart(e.target.value)}
                                            className="w-full mt-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-[11px] outline-none text-slate-800 dark:text-zinc-200"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[9px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase">End Time</label>
                                          <input
                                            type="time"
                                            value={editSlotEnd}
                                            onChange={(e) => setEditSlotEnd(e.target.value)}
                                            className="w-full mt-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-[11px] outline-none text-slate-800 dark:text-zinc-200"
                                          />
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center justify-end gap-1.5 pt-1">
                                        <button
                                          type="button"
                                          onClick={handleCancelEditSlot}
                                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 text-[10px] font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          onClick={handleSaveEditSlot}
                                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold shadow-xs cursor-pointer"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div
                                    key={index}
                                    className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/50 flex items-center justify-between text-xs hover:border-slate-350 dark:hover:border-zinc-700 transition-colors"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
                                        {slot.startTime} – {slot.endTime}
                                      </span>
                                      {slot.byAppointment && (
                                        <span className="text-[9px] font-bold text-amber-500 dark:text-amber-400 bg-amber-500/5 border border-amber-500/10 px-1 py-0.5 rounded">
                                          By Appt
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-1 flex-none">
                                      {/* Reorder Buttons */}
                                      <button
                                        type="button"
                                        onClick={() => handleMoveSlot(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-350 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer text-[10px]"
                                        title="Move Up"
                                      >
                                        ▲
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveSlot(index, 'down')}
                                        disabled={index === editingFaculty.schedule.length - 1}
                                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-350 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer text-[10px]"
                                        title="Move Down"
                                      >
                                        ▼
                                      </button>
                                      
                                      {/* Edit Button */}
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditSlot(index, slot)}
                                        className="p-1 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-500/5 cursor-pointer"
                                        title="Edit Session"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      
                                      {/* Remove Button */}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSlot(index)}
                                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/5 cursor-pointer"
                                        title="Remove Session"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Inline Adder Form */}
                          {addingSlotForDay === day && (
                            <div className="mt-3 p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-500/50 dark:border-emerald-500/40 space-y-3 shadow-xs">
                              <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">
                                New Time Slot Details
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                  <label className="text-[9px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase">Start Time</label>
                                  <input
                                    type="time"
                                    value={addSlotStart}
                                    onChange={(e) => setAddSlotStart(e.target.value)}
                                    className="w-full mt-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-[11px] outline-none text-slate-800 dark:text-zinc-200"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase">End Time</label>
                                  <input
                                    type="time"
                                    value={addSlotEnd}
                                    onChange={(e) => setAddSlotEnd(e.target.value)}
                                    className="w-full mt-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-[11px] outline-none text-slate-800 dark:text-zinc-200"
                                  />
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 select-none">
                                <input
                                  type="checkbox"
                                  id={`add_appt_${day}`}
                                  checked={addSlotAppointment}
                                  onChange={(e) => setAddSlotAppointment(e.target.checked)}
                                  className="rounded border-slate-300 dark:border-zinc-800 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-3.5 w-3.5"
                                />
                                <label htmlFor={`add_appt_${day}`} className="text-[10px] text-slate-500 dark:text-zinc-400 cursor-pointer font-bold leading-none">
                                  Requires prior appointment
                                </label>
                              </div>
                              
                              <div className="flex items-center justify-end gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setAddingSlotForDay(null)}
                                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 text-[10px] font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveAddSlotForDay}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-xs cursor-pointer"
                                >
                                  Add Slot
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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

    {/* Delete Confirmation Modal Overlay */}
    <AnimatePresence>
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Dark blur backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirm(null)}
            className="absolute inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-sm"
          />

          {/* Dialog Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 shadow-2xl p-6 flex flex-col items-center text-center z-10 overflow-hidden"
          >
            {/* Caution Icon */}
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/45 flex items-center justify-center text-rose-500 mb-4 flex-none">
              <AlertTriangle className="w-6 h-6 stroke-[2]" />
            </div>

            {/* Text Wording */}
            <h4 className="text-sm font-display font-black text-slate-900 dark:text-zinc-50 leading-snug">
              Are you sure you want to delete {deleteConfirm.name}?
            </h4>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2 leading-relaxed max-w-[280px]">
              This action cannot be undone.
            </p>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 w-full mt-6">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-black hover:bg-slate-50 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg shadow-rose-500/10 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </>
  );
};
