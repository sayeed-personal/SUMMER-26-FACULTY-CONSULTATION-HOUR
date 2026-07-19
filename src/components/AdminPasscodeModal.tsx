import React, { useState, useEffect } from 'react';
import { Lock, Unlock, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { haptic } from '../utils/haptic';

interface AdminPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  savedPasscode: string;
}

export const AdminPasscodeModal: React.FC<AdminPasscodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  savedPasscode
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === savedPasscode) {
      haptic.success();
      onSuccess();
    } else {
      haptic.error();
      setError(true);
      setPasscode('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
          />

          {/* Dialog Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 shadow-2xl p-6 md:p-8 z-10 overflow-hidden"
          >
            {/* Header info */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-500 mb-4 flex-none">
                <Lock className="w-5 h-5 stroke-[2]" />
              </div>

              <h3 className="text-base font-display font-black text-slate-900 dark:text-zinc-50 leading-snug">
                🔒 Admin Access Required
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1.5 leading-relaxed">
                Enter the administrator passcode.
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="relative">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setError(false);
                    setPasscode(e.target.value);
                  }}
                  placeholder="Enter passcode"
                  className="w-full text-center tracking-[0.2em] font-mono text-lg px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 outline-none text-slate-800 dark:text-zinc-100 focus:border-blue-500 dark:focus:border-blue-500/50 transition-colors"
                  autoFocus
                  required
                />
              </div>

              {/* Error text */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-450 font-bold"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>❌ Incorrect Passcode</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-black hover:bg-slate-50 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/15 transition-colors cursor-pointer"
                >
                  Unlock
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
