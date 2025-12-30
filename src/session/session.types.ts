export interface FractionPair {
  numerator: number;
  denominator: number;
}

// Base question interface for regular math questions
export interface MathQuestion {
  question: string; // e.g., "5*6"
  answer: number;   // e.g., 30
}

// Fraction comparison question interface
export interface FractionComparisonQuestion {
  question: [FractionPair, FractionPair];
  answer: string; // "<", ">", or "="
}

// Union type for all question types
export type Question = MathQuestion | FractionComparisonQuestion;

export interface Session {
  id: string;
  userId: string;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}