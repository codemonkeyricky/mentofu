import { config } from 'dotenv';
import fs from 'fs';

// Load environment variables from .env file if it exists
config();

export interface CLIConfig {
  apiUrl: string;
  username?: string;
  password?: string;
  token?: string;
  verbose: boolean;
  dryRun: boolean;
}

export function loadConfig(): CLIConfig {
  return {
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
    token: process.env.ADMIN_TOKEN,
    verbose: !!process.env.VERBOSE,
    dryRun: !!process.env.DRY_RUN
  };
}