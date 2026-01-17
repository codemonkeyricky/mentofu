import axios from 'axios';
import { AuthOptions, authenticate } from '../auth';

export interface UpdateMultiplierOptions {
  apiUrl: string;
  username?: string;
  password?: string;
  token?: string;
  verbose?: boolean;
  dryRun?: boolean;
}

export async function updateMultiplier(
  userIdOrUsername: string,
  quizType: string,
  value: number,
  options: UpdateMultiplierOptions
): Promise<void> {
  if (options.verbose) {
    console.log(`Updating multiplier for user "${userIdOrUsername}" with quiz type "${quizType}" to value ${value}`);
  }

  if (options.dryRun) {
    console.log('Dry run mode: Operation would be performed with these parameters');
    return;
  }

  const token = await authenticate(options);

  try {
    await axios.patch(
      `${options.apiUrl}/admin/users/${userIdOrUsername}/multiplier`,
      {
        quizType,
        multiplier: value
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`Successfully updated multiplier for user "${userIdOrUsername}"`);
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(`Failed to update multiplier: ${error.response.data.error.message}`);
    } else {
      throw new Error(`Failed to update multiplier: ${error.message}`);
    }
  }
}