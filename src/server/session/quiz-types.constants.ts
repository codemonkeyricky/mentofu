export const QUIZ_TYPES = [
  'simple-math',
  'simple-math-2',
  'simple-math-3',
  'simple-math-4',
  'simple-math-5',
  'simple-math-6',
  'simple-remainder',
  'simple-words',
  'addition-test',
] as const;

export const QUIZ_TYPE_PATTERN = `:quizType(${QUIZ_TYPES.join('|')})`;
