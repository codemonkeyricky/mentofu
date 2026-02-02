import { useCallback } from 'react';

export type ValidationType = 'valid' | 'warning' | 'error';

export interface ValidationResult {
  isValid: boolean;
  message: string;
  type: ValidationType;
}

/**
 * Hook for validating credit operations
 */
export const useCreditValidation = () => {
  /**
   * Validates claimed credits against earned credits
   * @param claimedAmount - Amount of claimed credits to validate
   * @param earnedCredits - Total earned credits available
   * @returns Validation result with message and type
   */
  const validateClaimedCredits = useCallback((
    claimedAmount: number,
    earnedCredits: number
  ): ValidationResult => {
    // Handle edge cases
    if (earnedCredits < 0) {
      return {
        isValid: false,
        message: 'Invalid earned credits value',
        type: 'error'
      };
    }

    if (claimedAmount < 0) {
      return {
        isValid: false,
        message: 'Claimed credits cannot be negative',
        type: 'error'
      };
    }

    // Main validation: claimed cannot exceed earned
    if (claimedAmount > earnedCredits) {
      return {
        isValid: false,
        message: `Claimed credits (${claimedAmount}) cannot exceed earned credits (${earnedCredits})`,
        type: 'error'
      };
    }

    // Calculate percentage for warning level
    const percentage = earnedCredits > 0 ? (claimedAmount / earnedCredits) * 100 : 0;

    // Warning for high usage (>90%)
    if (percentage > 90 && earnedCredits > 0) {
      return {
        isValid: true,
        message: `High usage: ${claimedAmount}/${earnedCredits} (${Math.round(percentage)}%) claimed`,
        type: 'warning'
      };
    }

    // Valid state
    return {
      isValid: true,
      message: earnedCredits > 0
        ? `${claimedAmount}/${earnedCredits} (${Math.round(percentage)}%) claimed`
        : 'No earned credits available',
      type: 'valid'
    };
  }, []);

  /**
   * Validates earned credits input
   * @param earnedAmount - Amount of earned credits to validate
   * @returns Validation result
   */
  const validateEarnedCredits = useCallback((earnedAmount: number): ValidationResult => {
    if (earnedAmount < 0) {
      return {
        isValid: false,
        message: 'Earned credits cannot be negative',
        type: 'error'
      };
    }

    if (!Number.isInteger(earnedAmount)) {
      return {
        isValid: false,
        message: 'Earned credits must be a whole number',
        type: 'error'
      };
    }

    return {
      isValid: true,
      message: `Set earned credits to ${earnedAmount}`,
      type: 'valid'
    };
  }, []);

  return {
    validateClaimedCredits,
    validateEarnedCredits
  };
};