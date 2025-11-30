export interface WordPair {
  id: string;
  hindi: string;
  english: string;
  transliteration: string;
}

export interface GameState {
  currentWordIndex: number;
  score: number;
  streak: number;
  isGameOver: boolean;
  history: {
    word: WordPair;
    correct: boolean;
  }[];
}

export type FeedbackStatus = 'idle' | 'correct' | 'incorrect' | 'loading' | 'revealed';