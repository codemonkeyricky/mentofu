import { Question } from '../session/session.types';

export function generateRemRdQuestions(count: number = 5): Question[] {
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
        const divisor = Math.floor(Math.random() * 11) + 2;
        const dividend = Math.floor(Math.random() * 100) + 1;
        const quotient = Math.floor(dividend / divisor);
        const remainder = dividend % divisor;

        questions.push({
            question: `${dividend} ÷ ${divisor}`,
            answer: remainder
        });
    }

    return questions;
}
