import axios from 'axios';
import { config } from 'dotenv';

config();

export interface AuthOptions {
  apiUrl: string;
  username?: string;
  password?: string;
  token?: string;
}

export interface AuthToken {
  token: string;
}

export async function authenticate(options: AuthOptions): Promise<string> {
  // If token is already provided, return it
  if (options.token) {
    return options.token;
  }

  // If username and password are provided, authenticate
  if (options.username && options.password) {
    try {
      const response = await axios.post<AuthToken>(
        `${options.apiUrl}/auth/login`,
        {
          username: options.username,
          password: options.password
        }
      );

      return response.data.token;
    } catch (error: any) {
      throw new Error(`Authentication failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  throw new Error('Either --token or --username and --password must be provided');
}