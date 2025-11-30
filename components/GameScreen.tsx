import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WordPair, FeedbackStatus } from '../types';
import { HINDI_CONSONANTS } from '../constants';
import LetterKey from './LetterKey';
import { Sparkles, RefreshCw, Volume2, CheckCircle2, XCircle, ArrowRight, AlertCircle, Bot } from 'lucide-react';
import { generateNewWords } from '../services/geminiService';

interface GameScreenProps {
  words: WordPair[];
  onAddWords: (newWords: WordPair[]) => void;
  hasApiKey: boolean;
}

const GameScreen: React.FC<GameScreenProps> = ({ words, onAddWords, hasApiKey }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLetters, setSelectedLetters] = useState<(string | null)[]>([null, null]);
  const [status, setStatus] = useState<FeedbackStatus>('idle');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const currentWord = words[currentIndex];

  // Helper to split Hindi word into displayable characters/ligatures
  const getWordParts = useCallback((word: string) => {
    return Array.from(word); // Array.from handles unicode surrogates correctly usually
  }, []);

  // Generate options (correct letters + random distractors)
  useEffect(() => {
    if (!currentWord) return;

    const correctParts = getWordParts(currentWord.hindi);
    // Ensure we are playing with 2-part words primarily, if 3, it adapts, but UI is optimized for 2
    
    // Create pool
    const distractorsNeeded = 8 - correctParts.length;
    const distractors: string[] = [];
    
    while (distractors.length < distractorsNeeded) {
        const rand = HINDI_CONSONANTS[Math.floor(Math.random() * HINDI_CONSONANTS.length)];
        if (!correctParts.includes(rand) && !distractors.includes(rand)) {
            distractors.push(rand);
        }
    }

    const allOptions = [...correctParts, ...distractors];
    // Shuffle
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    setOptions(allOptions);
    setSelectedLetters(new Array(correctParts.length).fill(null));
    setStatus('idle');
    setAttempts(0); // Reset attempts for new word
  }, [currentWord, getWordParts]);

  const handleLetterClick = (letter: string) => {
    if (status !== 'idle') return;

    const firstEmptyIndex = selectedLetters.findIndex(l => l === null);
    if (firstEmptyIndex !== -1) {
      const newSelected = [...selectedLetters];
      newSelected[firstEmptyIndex] = letter;
      setSelectedLetters(newSelected);

      // Auto-check if full
      if (firstEmptyIndex === selectedLetters.length - 1) {
        // Wait a tiny bit for visual update then check
        setTimeout(() => checkAnswer(newSelected), 300);
      }
    }
  };

  const removeLetter = (index: number) => {
    if (status !== 'idle') return;
    const newSelected = [...selectedLetters];
    newSelected[index] = null;
    setSelectedLetters(newSelected);
  };

  const checkAnswer = (submittedLetters: (string | null)[]) => {
    const constructedWord = submittedLetters.join('');
    if (constructedWord === currentWord.hindi) {
      handleCorrect();
    } else {
      handleIncorrect();
    }
  };

  const handleCorrect = () => {
    setStatus('correct');
    setScore(s => s + 10 + (streak * 2)); // Bonus for streak
    setStreak(s => s + 1);
    playAudio('correct');
  };

  const handleIncorrect = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setStreak(0);
    playAudio('incorrect');

    if (nextAttempts >= 3) {
      // Max attempts reached, reveal answer
      setStatus('revealed');
      const correctParts = getWordParts(currentWord.hindi);
      setSelectedLetters(correctParts);
    } else {
      // Standard incorrect behavior
      setStatus('incorrect');
      
      // Reset after delay
      setTimeout(() => {
          setSelectedLetters(new Array(getWordParts(currentWord.hindi).length).fill(null));
          setStatus('idle');
      }, 1000);
    }
  };

  const nextWord = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
        // If at end and we have API key, try to load more automatically or restart
        if (hasApiKey) {
            loadMoreWords(true);
        } else {
            // Loop back to start for now
            setCurrentIndex(0);
        }
    }
  };

  const loadMoreWords = async (autoAdvance = true) => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    const newBatch = await generateNewWords(5);
    if (newBatch.length > 0) {
        onAddWords(newBatch);
        if (autoAdvance) {
            setCurrentIndex(prev => prev + 1);
        }
    } else {
        // Fallback if gen fails
        if (autoAdvance) {
            setCurrentIndex(0);
        }
    }
    setIsLoadingMore(false);
  };

  const playAudio = (type: 'correct' | 'incorrect') => {
    // Simple synthesized beeps if no assets
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'correct') {
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }
  };

  const speakWord = () => {
      if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(currentWord.hindi);
          utterance.lang = 'hi-IN';
          window.speechSynthesis.speak(utterance);
      }
  };

  if (!currentWord) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto h-full justify-between py-6 px-4">
      {/* Top Bar */}
      <div className="w-full flex justify-between items-center mb-6 bg-white/50 backdrop-blur-sm p-3 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Score</span>
          <span className="text-2xl font-black text-primary-600">{score}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Streak</span>
          <div className="flex items-center gap-1 text-accent-500">
             <span className="text-xl font-black">{streak}</span>
             <Sparkles size={16} fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="w-full flex-1 flex flex-col items-center justify-center gap-8 relative">
        
        {/* Word Card */}
        <div className="w-full bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center gap-4 border-b-8 border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 via-accent-400 to-primary-500 opacity-50"></div>
            
            <div className="flex flex-col items-center text-center gap-1">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-700 tracking-tight">{currentWord.english}</h2>
                <p className="text-slate-400 font-semibold">"{currentWord.transliteration}"</p>
            </div>

            <button 
                onClick={speakWord}
                className="absolute top-4 right-4 text-slate-300 hover:text-primary-500 transition-colors"
                title="Listen"
            >
                <Volume2 size={24} />
            </button>
        </div>

        {/* Input Slots */}
        <div className={`flex gap-3 my-4 transition-all ${status === 'incorrect' ? 'animate-shake' : ''}`}>
          {selectedLetters.map((letter, idx) => (
            <button
              key={idx}
              onClick={() => removeLetter(idx)}
              className={`
                w-20 h-24 sm:w-24 sm:h-28 rounded-2xl border-4 text-4xl sm:text-5xl font-hindi font-bold flex items-center justify-center transition-all duration-300
                ${
                    letter 
                    ? 'border-primary-500 bg-white text-primary-600 shadow-lg -translate-y-2' 
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-300 hover:bg-slate-100'
                }
                ${status === 'correct' ? 'border-green-500 text-green-600 bg-green-50 scale-110' : ''}
                ${status === 'incorrect' ? 'border-red-400 text-red-500 bg-red-50' : ''}
                ${status === 'revealed' ? 'border-amber-400 text-amber-600 bg-amber-50' : ''}
              `}
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Status Message */}
        <div className="h-8 flex items-center justify-center">
            {status === 'correct' && (
                <div className="flex items-center gap-2 text-green-600 font-bold bg-green-100 px-4 py-1 rounded-full animate-pop">
                    <CheckCircle2 size={18} />
                    <span>Correct! Great Job!</span>
                </div>
            )}
            {status === 'incorrect' && (
                <div className="flex items-center gap-2 text-red-500 font-bold bg-red-100 px-4 py-1 rounded-full animate-pop">
                    <XCircle size={18} />
                    <span>Try Again! {3 - attempts} tries left.</span>
                </div>
            )}
            {status === 'revealed' && (
                <div className="flex items-center gap-2 text-amber-600 font-bold bg-amber-100 px-4 py-1 rounded-full animate-pop">
                    <AlertCircle size={18} />
                    <span>Here is the answer</span>
                </div>
            )}
            {isLoadingMore && (
                 <div className="flex items-center gap-2 text-primary-600 font-bold bg-primary-50 px-4 py-1 rounded-full">
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Generating new words with AI...</span>
                </div>
            )}
        </div>
      </div>

      {/* Keyboard Area */}
      <div className="w-full mt-6">
          {status === 'correct' || status === 'revealed' ? (
              <button
                onClick={nextWord}
                className={`w-full py-4 rounded-2xl text-white font-bold text-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 animate-bounce-short
                  ${status === 'correct' ? 'bg-primary-600 hover:bg-primary-500 shadow-primary-200' : 'bg-amber-500 hover:bg-amber-400 shadow-amber-200'}
                `}
              >
                <span>Next Word</span>
                <ArrowRight size={24} />
              </button>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-sm mx-auto">
                {options.map((char, idx) => (
                    <LetterKey 
                        key={`${char}-${idx}`} 
                        letter={char} 
                        onClick={() => handleLetterClick(char)}
                    />
                ))}
            </div>
          )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 flex flex-col items-center gap-3 w-full pb-2">
         <div className="text-slate-400 text-xs font-semibold">
            Word {currentIndex + 1} of {words.length}
         </div>
         
         {hasApiKey && (
             <button
                onClick={() => loadMoreWords(false)}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-primary-200 text-primary-600 rounded-full shadow-sm text-xs font-bold hover:bg-primary-50 hover:border-primary-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
             >
                {isLoadingMore ? (
                    <RefreshCw size={14} className="animate-spin" />
                ) : (
                    <Bot size={14} />
                )}
                <span>{isLoadingMore ? 'Creating Words...' : 'Create 5 More Words'}</span>
             </button>
         )}
      </div>
    </div>
  );
};

export default GameScreen;