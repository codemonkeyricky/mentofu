import { Question } from '../session/session.types';

export function generateQuestions(count: number = 10): Question[] {
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    // Generate two random single-digit numbers (0-9)
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);

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
    // Generate a random number between 1 and 100 as the numerator
    const numerator = Math.floor(Math.random() * 100) + 1;

    // Generate a random divisor between 1 and the numerator (to ensure whole number division)
    const divisor = Math.floor(Math.random() * numerator) + 1;

    // Ensure that the division results in a whole number
    // We'll make sure that numerator is divisible by divisor
    const quotient = Math.floor(numerator / divisor);
    const adjustedNumerator = quotient * divisor; // Make sure it's a clean division

    // Create question string
    const question = `${adjustedNumerator}÷${divisor}`;

    // Calculate correct answer
    const answer = quotient;

    questions.push({
      question,
      answer
    });
  }

  return questions;
}

export function generateBODMASQuestions(count: number = 10): Question[] {
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    // Generate a random BODMAS expression with 3-4 operations
    // We'll create expressions that follow the order of operations correctly

    // For simplicity, we'll generate expressions like:
    // - "2 + 3 * 4" (where multiplication comes first)
    // - "10 - 6 ÷ 2" (where division comes first)
    // - "(5 + 3) * 2" (where parentheses come first)

    const operations = ['+', '-', '*', '÷'];
    const numOperations = Math.floor(Math.random() * 2) + 3; // 3-4 operations

    let expression = '';
    let answer = 0;

    // Generate a random starting number
    let currentNum = Math.floor(Math.random() * 10) + 1;
    expression = `${currentNum}`;

    // Add operations and numbers
    for (let j = 0; j < numOperations; j++) {
      const operation = operations[Math.floor(Math.random() * operations.length)];

      // For division, make sure it results in a whole number
      if (operation === '÷') {
        let divisor = Math.floor(Math.random() * 10) + 1;
        // Make sure the result is a whole number
        const dividend = currentNum * divisor;
        expression += ` ${operation} ${divisor}`;
        answer = dividend / divisor;
        currentNum = answer;
      } else {
        let nextNum = Math.floor(Math.random() * 10) + 1;
        expression += ` ${operation} ${nextNum}`;
        if (operation === '+') {
          answer = currentNum + nextNum;
        } else if (operation === '-') {
          answer = currentNum - nextNum;
        } else if (operation === '*') {
          answer = currentNum * nextNum;
        }
        currentNum = answer;
      }
    }

    // Make sure we have a valid expression with proper BODMAS evaluation
    try {
      // Evaluate the expression to get the correct answer
      const evalExpression = expression.replace(/÷/g, '/');
      answer = eval(evalExpression);

      questions.push({
        question: expression,
        answer: Math.round(answer * 100) / 100 // Round to avoid floating point precision issues
      });
    } catch (e) {
      // If evaluation fails, generate a simpler one
      const simpleExpression = `${Math.floor(Math.random() * 10) + 1} + ${Math.floor(Math.random() * 10) + 1}`;
      const simpleAnswer = eval(simpleExpression.replace(/÷/g, '/'));

      questions.push({
        question: simpleExpression,
        answer: Math.round(simpleAnswer * 100) / 100
      });
    }
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