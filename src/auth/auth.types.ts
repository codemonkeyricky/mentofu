export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}