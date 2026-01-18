export interface User {
  id: string;
  username: string;
  isAdmin?: boolean;
  createdAt?: Date;
  earned_credits?: number;
  claimed_credits?: number;
}

export interface ParentUser {
  id: string;
  name: string;
  email: string;
  children: string[];
  role: string;
}