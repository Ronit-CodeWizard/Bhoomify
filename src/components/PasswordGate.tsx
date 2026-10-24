import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';

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
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password === 'RB143') {
      setIsUnlocking(true);
      setError(false);
      setTimeout(() => {
        onUnlock();
      }, 400);
    } else {
      setError(true);
      setPassword('');
      if (navigator.vibrate) navigator.vibrate(100);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center p-6 select-none overflow-hidden font-sans text-black">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/3 left-1/3 w-[360px] h-[360px] rounded-full bg-black/[0.03] blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={isUnlocking ? { opacity: 0, scale: 1.05, y: -20 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/95 backdrop-blur-3xl border border-black/15 rounded-3xl p-8 md:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.1)] flex flex-col items-center text-center">
          
          <h2 className="text-2xl font-bold font-display text-black tracking-tight mb-2">
            Player Access
          </h2>
          <p className="text-xs text-black/50 max-w-xs mb-8 font-medium">
            Enter passcode to unlock player
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black/40">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="Enter passcode"
                autoComplete="off"
                className={`w-full bg-black/[0.03] border text-center text-base tracking-[0.25em] font-mono text-black placeholder:text-black/30 placeholder:tracking-normal placeholder:font-sans rounded-2xl py-3.5 pl-11 pr-11 focus:outline-none transition-all duration-200 ${
                  error
                    ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                    : 'border-black/15 focus:border-black focus:bg-black/[0.05]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-black/40 hover:text-black cursor-pointer transition-colors"
                title={showPassword ? 'Hide passcode' : 'Show passcode'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-1.5 text-xs text-red-500 font-medium"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Incorrect passcode. Please try again.</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isUnlocking}
              className="w-full py-3.5 px-4 bg-black hover:bg-black/90 active:scale-[0.98] text-white font-bold text-sm rounded-2xl transition-all duration-200 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.15)] disabled:opacity-50"
            >
              {isUnlocking ? 'AUTHENTICATING...' : 'ENTER PLAYER'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
