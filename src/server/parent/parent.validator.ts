import { QUIZ_TYPES } from '../session/quiz-types.constants';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: string;
}

export class ParentValidator {
  static validateLoginCredentials(username: string, password: string): ValidationResult {
    if (!username || !password) {
      return { valid: false, error: 'MISSING_CREDENTIALS' };
    }
    return { valid: true };
  }

  static validateQuizType(quizType: string): ValidationResult {
    if (!quizType) {
      return {
        valid: false,
        error: 'INVALID_QUIZ_TYPE',
        details: 'Invalid quiz type. Must be one of: simple-math, simple-math-2, simple-math-3, simple-math-4, simple-math-5, simple-math-6, simple-remainder, simple-words, addition-test'
      };
    }
    const validTypes = new Set(QUIZ_TYPES);
    if (!validTypes.has(quizType as any)) {
      return {
        valid: false,
        error: 'INVALID_QUIZ_TYPE',
        details: 'Invalid quiz type. Must be one of: simple-math, simple-math-2, simple-math-3, simple-math-4, simple-math-5, simple-math-6, simple-remainder, simple-words, addition-test'
      };
    }
    return { valid: true };
  }

  static validateMultiplier(multiplier: number): ValidationResult {
    if (typeof multiplier !== 'number' || multiplier < 0 || multiplier > 5 || !Number.isInteger(multiplier)) {
      return {
        valid: false,
        error: 'INVALID_MULTIPLIER',
        details: 'Multiplier must be an integer between 0 and 5'
      };
    }
    return { valid: true };
  }

  static validateCreditsUpdates(updates: any): ValidationResult {
    const hasAnyCreditField = updates.earnedCredits !== undefined ||
                              updates.claimedCredits !== undefined ||
                              updates.earnedDelta !== undefined ||
                              updates.claimedDelta !== undefined ||
                              updates.field !== undefined;

    if (!hasAnyCreditField) {
      return {
        valid: false,
        error: 'MISSING_CREDIT_FIELDS',
        details: 'At least one credit field is required'
      };
    }

    const fieldValidation = this.validateCreditField(updates.field);
    if (!fieldValidation.valid) return fieldValidation;

    if (updates.earnedCredits !== undefined) {
      return this.validateCreditAmount(updates.earnedCredits, 'earnedCredits');
    }

    if (updates.claimedCredits !== undefined) {
      return this.validateCreditAmount(updates.claimedCredits, 'claimedCredits');
    }

    if (updates.earnedDelta !== undefined) {
      return this.validateDelta(updates.earnedDelta, 'earnedDelta');
    }

    if (updates.claimedDelta !== undefined) {
      return this.validateDelta(updates.claimedDelta, 'claimedDelta');
    }

    return { valid: true };
  }

  private static validateCreditField(field: string): ValidationResult {
    if (field !== undefined && field !== 'earned' && field !== 'claimed') {
      return {
        valid: false,
        error: 'INVALID_FIELD',
        details: 'Field must be either "earned" or "claimed"'
      };
    }
    return { valid: true };
  }

  private static validateCreditAmount(amount: number, fieldName: string): ValidationResult {
    if (typeof amount !== 'number' || amount < 0 || !Number.isInteger(amount)) {
      return {
        valid: false,
        error: `INVALID_${fieldName.toUpperCase()}`,
        details: 'Amount must be a non-negative integer'
      };
    }
    return { valid: true };
  }

  private static validateDelta(delta: number, fieldName: string): ValidationResult {
    if (typeof delta !== 'number' || !Number.isInteger(delta)) {
      return {
        valid: false,
        error: `INVALID_${fieldName.toUpperCase()}`,
        details: 'Delta must be an integer'
      };
    }
    return { valid: true };
  }
}
