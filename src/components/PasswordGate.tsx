import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface PasswordGateProps {
  onUnlock: () => void;
}

export function PasswordGate({ onUnlock }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto focus the password input field on awake
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password === 'RB143') {
      setIsUnlocking(true);
      setError(false);
      // Beautiful exit animation delay
      setTimeout(() => {
        onUnlock();
      }, 500);
    } else {
      setError(true);
      setPassword('');
      // Vibrate if mobile supported
      if (navigator.vibrate) navigator.vibrate(100);
      // Refocus input
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#06040a] z-[9999] flex items-center justify-center p-6 select-none overflow-hidden font-sans">
      {/* Dynamic backdrop glow circles */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-pink-600/10 blur-[120px] pointer-events-none animate-pulse [animation-delay:1.5s]" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={isUnlocking ? { opacity: 0, scale: 1.05, y: -20 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Outer subtle glow ring around card */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent rounded-[32px] blur-xl opacity-50" />

        <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.9)] flex flex-col items-center text-center">
          
          {/* Animated Lock Badge */}
          <div className="relative mb-6">
            <motion.div
              animate={error ? { x: [-6, 6, -4, 4, -2, 2, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                error
                  ? 'bg-red-500/15 border border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : isUnlocking
                  ? 'bg-green-500/15 border border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)] animate-pulse'
                  : 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
              }`}
            >
              {isUnlocking ? (
                <Unlock className="w-7 h-7" />
              ) : (
                <Lock className="w-7 h-7" />
              )}
            </motion.div>
          </div>

          <h1 className="text-2xl font-bold font-display tracking-tight text-white mb-2">
            Aura Sessions
          </h1>
          <p className="text-xs text-white/50 max-w-xs leading-relaxed mb-8">
            This premium audio console is password-protected. Please enter your authorization key to awaken the system.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Authorization Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                className={`w-full bg-white/[0.04] border hover:bg-white/[0.06] focus:bg-black/40 text-sm py-3.5 pl-11 pr-12 rounded-2xl text-white placeholder-white/20 focus:outline-none transition-all duration-300 font-sans tracking-wide text-center ${
                  error
                    ? 'border-red-500/50 focus:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                    : 'border-white/10 focus:border-purple-500/50 focus:shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 cursor-pointer p-0.5"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 py-2.5 px-4 rounded-xl"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Access Denied. Incorrect Password.</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isUnlocking}
              className={`w-full font-bold text-xs py-3.5 rounded-2xl transition-all cursor-pointer font-sans shadow-lg uppercase tracking-wider flex items-center justify-center gap-2 ${
                isUnlocking
                  ? 'bg-green-500 hover:bg-green-600 text-black shadow-[0_4px_12px_rgba(34,197,94,0.3)]'
                  : 'bg-purple-500 hover:bg-purple-600 text-black active:scale-[0.98] shadow-[0_4px_15px_rgba(168,85,247,0.35)]'
              }`}
            >
              {isUnlocking ? 'Access Granted' : 'Awaken Console'}
            </button>
          </form>

          {/* Device indicators */}
          <div className="flex items-center gap-1.5 mt-8 text-[10px] text-white/20 tracking-wider uppercase font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            System Secure
          </div>

        </div>
      </motion.div>
    </div>
  );
}
