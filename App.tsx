import React, { useState } from 'react';
import { INITIAL_WORDS } from './constants';
import { WordPair } from './types';
import GameScreen from './components/GameScreen';
import { Bot } from 'lucide-react';

function App() {
  const [words, setWords] = useState<WordPair[]>(INITIAL_WORDS);
  const [hasStarted, setHasStarted] = useState(false);
  const hasApiKey = !!process.env.API_KEY;

  const handleAddWords = (newWords: WordPair[]) => {
    setWords(prev => [...prev, ...newWords]);
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-accent-200 rounded-full blur-3xl opacity-30"></div>

        <div className="z-10 bg-white/80 backdrop-blur-md border border-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
                🦉
            </div>
            <h1 className="text-4xl font-black text-slate-800 mb-2 font-hindi tracking-wide">
                नमस्ते!
            </h1>
            <h2 className="text-xl font-bold text-slate-600 mb-4">
                Hindi Word Master
            </h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
                Learn 2-letter Hindi words (Do Akshar Wale Shabd) in this fun puzzle game.
            </p>

            <button
                onClick={() => setHasStarted(true)}
                className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-200 transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-95"
            >
                Start Playing
            </button>

            {hasApiKey && (
                <div className="mt-4 flex items-center justify-center gap-1 text-xs font-bold text-primary-600 bg-primary-50 py-1 px-3 rounded-full w-fit mx-auto">
                    <Bot size={12} />
                    <span>AI Powered Content Ready</span>
                </div>
            )}
        </div>
        
        <footer className="absolute bottom-4 text-slate-400 text-xs font-semibold">
            Made for Learning Hindi
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900 font-sans">
      <main className="h-screen w-full max-w-2xl mx-auto shadow-2xl sm:rounded-3xl sm:h-[95vh] sm:my-[2.5vh] bg-white sm:overflow-hidden border-slate-200 sm:border relative">
        {/* Decorative Background inside Game Frame */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
           <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-100 rounded-full blur-3xl"></div>
           <div className="absolute top-1/2 -left-24 w-48 h-48 bg-yellow-100 rounded-full blur-3xl"></div>
        </div>

        <div className="relative h-full z-10">
             <GameScreen words={words} onAddWords={handleAddWords} hasApiKey={hasApiKey} />
        </div>
      </main>
    </div>
  );
}

export default App;
