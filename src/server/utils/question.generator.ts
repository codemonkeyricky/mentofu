import { Question } from '../session/session.types';

export function generateQuestions(count: number = 10): Question[] {
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    // Generate two random single-digit numbers (1-9)
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;

    // Create question string
    const question = `${num1}*${num2}`;

    // Calculate correct answer
    const answer = num1 * num2;

    questions.push({
      question,
      answer
    });
  }

  return questions;
}

export function generateDivisionQuestions(count: number = 10): Question[] {
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    // Generate two random single-digit numbers (1-9) to be symmetric with generateQuestions
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;

    // Calculate product
    const product = num1 * num2;

    // Create question string: "product ÷ num1"
    const question = `${product}÷${num1}`;

    // The answer is num2
    const answer = num2;

    questions.push({
      question,
      answer
    });
  }

  return questions;
}

export function generateBODMASQuestions(count: number = 10): Question[] {
  const questions: Question[] = [];
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  for (let i = 0; i < count; i++) {
    const type = rand(0, 5);
    let question = '';
    let answer = 0;

    switch (type) {
      case 0: // (A + B) * C
        {
          const a = rand(1, 10);
          const b = rand(1, 10);
          const c = rand(2, 6);
          question = `(${a} + ${b}) * ${c}`;
          answer = (a + b) * c;
        }
        break;
      case 1: // A + B * C
        {
          const b = rand(2, 6);
          const c = rand(2, 6);
          const a = rand(1, 20);
          question = `${a} + ${b} * ${c}`;
          answer = a + (b * c);
        }
        break;
      case 2: // (A - B) ÷ C
        {
          const c = rand(2, 5);
          answer = rand(2, 10); // The final answer
          const dividend = answer * c; // (A - B)
          const b = rand(1, 10);
          const a = dividend + b;
          question = `(${a} - ${b}) ÷ ${c}`;
        }
        break;
      case 3: // A - B ÷ C
        {
          const c = rand(2, 5);
          const quotient = rand(2, 6);
          const b = quotient * c;
          const a = rand(quotient + 1, quotient + 20); // Ensure positive result
          question = `${a} - ${b} ÷ ${c}`;
          answer = a - quotient;
        }
        break;
      case 4: // A * B - C
        {
          const a = rand(2, 6);
          const b = rand(2, 6);
          const c = rand(1, (a * b) - 1);
          question = `${a} * ${b} - ${c}`;
          answer = (a * b) - c;
        }
        break;
      case 5: // A * (B + C)
        {
          const a = rand(2, 6);
          const b = rand(1, 10);
          const c = rand(1, 10);
          question = `${a} * (${b} + ${c})`;
          answer = a * (b + c);
        }
        break;
    }

    questions.push({
      question,
      answer
    });
  }

  return questions;
}

export function generateFractionComparisonQuestions(count: number = 10): Question[] {
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    let num1, den1, num2, den2;

    // Generate two random fractions with denominators between 2 and 12
    do {
      den1 = Math.floor(Math.random() * 11) + 2; // 2-12
      num1 = Math.floor(Math.random() * (den1 - 1)) + 1; // 1 to den1-1

      den2 = Math.floor(Math.random() * 11) + 2; // 2-12
      num2 = Math.floor(Math.random() * (den2 - 1)) + 1; // 1 to den2-1

      // Ensure the fractions are not equivalent to avoid trivial comparisons
      // We'll also make sure they're not identical
    } while ((num1 === num2 && den1 === den2) || (num1 * den2 === num2 * den1)); // Check for equivalent fractions

    // Convert to decimals for comparison
    const value1 = num1 / den1;
    const value2 = num2 / den2;

    // Determine which fraction is larger
    let answer: string;
    if (value1 > value2) {
      answer = '>';
    } else if (value2 > value1) {
      answer = '<';
    } else {
      answer = '=';
    }

    // Create question with fraction pairs instead of formatted string
    questions.push({
      question: [
        { numerator: num1, denominator: den1 },
        { numerator: num2, denominator: den2 }
      ],
      answer
    });
  }

  return questions;
}