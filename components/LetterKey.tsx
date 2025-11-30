import React from 'react';

interface LetterKeyProps {
  letter: string;
  onClick: () => void;
  disabled?: boolean;
  isUsed?: boolean;
}

const LetterKey: React.FC<LetterKeyProps> = ({ letter, onClick, disabled, isUsed }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isUsed}
      className={`
        relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl font-hindi text-2xl sm:text-3xl font-bold shadow-md transition-all duration-200
        flex items-center justify-center
        ${
          isUsed
            ? 'bg-slate-200 text-slate-400 shadow-inner scale-95'
            : 'bg-white text-slate-800 hover:-translate-y-1 hover:shadow-lg active:scale-95 border-b-4 border-slate-200 active:border-b-0 active:translate-y-1'
        }
        ${disabled && !isUsed ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {letter}
    </button>
  );
};

export default LetterKey;
