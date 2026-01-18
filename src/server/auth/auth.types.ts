export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  earned_credits?: number;
  claimed_credits?: number;
  isParent?: boolean;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    isParent?: boolean;
  };
}