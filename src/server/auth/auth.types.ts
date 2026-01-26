export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  earned_credits?: number;
  claimed_credits?: number;
  isParent?: boolean;
  parent_id?: string;
  is_admin?: boolean;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    isParent?: boolean;
  };
}

export interface DecodedToken {
  userId: string;
  username: string;
  exp: number;
}