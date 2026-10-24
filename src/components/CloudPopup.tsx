import React from 'react';
import { motion } from 'motion/react';

interface CloudPopupProps {
  onClose?: () => void;
  className?: string;
  tailDirection?: 'up' | 'down';
}

export const CloudPopup: React.FC<CloudPopupProps> = ({
  onClose,
  className = '',
  tailDirection = 'up',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: tailDirection === 'up' ? -12 : 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.55, y: tailDirection === 'up' ? -10 : 10 }}
      transition={{ type: 'spring', stiffness: 450, damping: 22 }}
      onClick={onClose}
      className={`relative z-50 cursor-pointer select-none ${className}`}
      title="Click to dismiss"
    >
      <div className="relative w-[270px] sm:w-[290px] h-[130px]">
        <svg
          viewBox="0 0 270 130"
          className="w-full h-full drop-shadow-[0_16px_36px_rgba(0,0,0,0.22)] overflow-visible"
        >
          {tailDirection === 'up' ? (
            <>
              {/* Trailing thought bubble puffs pointing UP toward the heart button */}
              <circle cx="242" cy="7" r="3.5" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
              <circle cx="232" cy="18" r="5.5" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
              <circle cx="218" cy="31" r="8.5" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />

              {/* Fluffy Monochromatic Cloud Body */}
              <path
                d="M 52 116
                   C 26 116, 12 101, 15 80
                   C 10 62, 22 47, 44 47
                   C 54 33, 80 31, 100 42
                   C 116 31, 150 31, 166 42
                   C 186 31, 212 33, 222 47
                   C 242 47, 256 62, 250 80
                   C 254 101, 238 116, 216 116
                   C 198 119, 178 117, 162 116
                   C 142 119, 116 119, 101 116
                   C 86 118, 66 119, 52 116 Z"
                fill="#ffffff"
                stroke="#000000"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </>
          ) : (
            <>
              {/* Fluffy Monochromatic Cloud Body */}
              <path
                d="M 52 86
                   C 26 86, 12 71, 15 50
                   C 10 32, 22 17, 44 17
                   C 54 3, 80 1, 100 12
                   C 116 1, 150 1, 166 12
                   C 186 1, 212 3, 222 17
                   C 242 17, 256 32, 250 50
                   C 254 71, 238 86, 216 86
                   C 198 89, 178 87, 162 86
                   C 142 89, 116 89, 101 86
                   C 86 88, 66 89, 52 86 Z"
                fill="#ffffff"
                stroke="#000000"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              {/* Trailing thought bubble puffs pointing DOWN */}
              <circle cx="218" cy="99" r="8.5" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
              <circle cx="232" cy="112" r="5.5" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
              <circle cx="242" cy="123" r="3.5" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
            </>
          )}
        </svg>

        {/* Text inside the Cloud */}
        <div
          className={`absolute inset-0 px-8 flex flex-col items-center justify-center text-center pointer-events-none ${
            tailDirection === 'up' ? 'pt-8 pb-3' : 'pt-3 pb-8'
          }`}
        >
          <p className="text-[13px] sm:text-[13.5px] font-extrabold text-black leading-snug font-sans tracking-tight">
            &ldquo;You can&#39;t unfavourite this song, it&#39;s toooo good! &rdquo;
          </p>
        </div>
      </div>
    </motion.div>
  );
};
