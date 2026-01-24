import { Question } from '../session/session.types';

export function generateAdditionTestQuestions(count: number = 10): Question[] {
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    // Generate two random numbers > 0 and < 10
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;

    // Create question string
    const question = `${num1} + ${num2}`;

    // Calculate correct answer
    const answer = num1 + num2;

    questions.push({
      question,
      answer
    });
  }

  return questions;
}
