import { User, AuthResponse } from '../../auth/auth.types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse extends AuthResponse {
  user: User;
}

export interface ValidateResponse {
  valid: boolean;
  user: { id: string; username: string };
}

export interface UserResponse {
  id: string;
  username: string;
  earnedCredits: number;
  claimedCredits: number;
  multipliers: Record<string, number>;
}

export interface UsersResponse {
  users: UserResponse[];
}

export interface MultiplierResponse {
  message: string;
  userId: string;
  quizType: string;
  multiplier: number;
}

export interface CreditsResponse {
  message: string;
  userId: string;
  earnedCredits: number;
  claimedCredits: number;
  field?: string;
  amount?: number;
}

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}
