import axios from 'axios';
import { AuthOptions, authenticate } from '../auth';

export interface GetUserInfoOptions {
  apiUrl: string;
  username?: string;
  password?: string;
  token?: string;
  verbose?: boolean;
}

export async function getUserInfo(
  userIdOrUsername: string,
  options: GetUserInfoOptions
): Promise<void> {
  if (options.verbose) {
    console.log(`Getting info for user "${userIdOrUsername}"`);
  }

  const token = await authenticate(options);

  try {
    const response = await axios.get(
      `${options.apiUrl}/parent/users/${userIdOrUsername}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const user = response.data;

    console.log('User Information:');
    console.log('-'.repeat(40));
    console.log(`ID: ${user.id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Earned Credits: ${user.earnedCredits}`);
    console.log(`Claimed Credits: ${user.claimedCredits}`);
    console.log(`Multipliers:`);

    for (const [quizType, multiplier] of Object.entries(user.multipliers)) {
      console.log(`  ${quizType}: ${multiplier}`);
    }
    console.log('-'.repeat(40));
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(`Failed to get user info: ${error.response.data.error.message}`);
    } else {
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }
}