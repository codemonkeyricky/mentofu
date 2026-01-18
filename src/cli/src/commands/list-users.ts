import axios from 'axios';
import { AuthOptions, authenticate } from '../auth';

export interface ListUsersOptions {
  apiUrl: string;
  username?: string;
  password?: string;
  token?: string;
  verbose?: boolean;
}

export interface ListUsersFilters {
  search?: string;
  limit?: number;
  showMultipliers?: boolean;
  showCredits?: boolean;
}

export async function listUsers(
  filters: ListUsersFilters,
  options: ListUsersOptions
): Promise<void> {
  if (options.verbose) {
    console.log('Listing users with filters:', filters);
  }

  const token = await authenticate(options);

  try {
    const response = await axios.get(
      `${options.apiUrl}/parent/users`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: filters
      }
    );

    const users = response.data.users || [];

    console.log(`Found ${users.length} users:`);
    console.log('-'.repeat(80));

    for (const user of users) {
      console.log(`User ID: ${user.id}`);
      console.log(`Username: ${user.username}`);
      console.log(`Earned Credits: ${user.earnedCredits}`);
      console.log(`Claimed Credits: ${user.claimedCredits}`);

      if (filters.showMultipliers && user.multipliers) {
        console.log('Multipliers:');
        for (const [quizType, multiplier] of Object.entries(user.multipliers)) {
          console.log(`  ${quizType}: ${multiplier}`);
        }
      }

      console.log('-'.repeat(80));
    }
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(`Failed to list users: ${error.response.data.error.message}`);
    } else {
      throw new Error(`Failed to list users: ${error.message}`);
    }
  }
}