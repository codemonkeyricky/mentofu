export interface SimpleWords {
  word: string;
  hint: string;
  letterCount: number;
}

export interface SimpleWordsSession {
  id: string;
  userId: string;
  words: SimpleWords[];
  createdAt: Date;
  updatedAt: Date;
}