import axios from 'axios';
import { AuthOptions, authenticate } from '../auth';

export interface UpdateCreditsOptions {
  apiUrl: string;
  username?: string;
  password?: string;
  token?: string;
  verbose?: boolean;
  dryRun?: boolean;
}

export interface CreditUpdates {
  earned?: number;
  claimed?: number;
  earnedDelta?: number;
  claimedDelta?: number;
}

export async function updateCredits(
  userIdOrUsername: string,
  updates: CreditUpdates,
  options: UpdateCreditsOptions
): Promise<void> {
  if (options.verbose) {
    console.log(`Updating credits for user "${userIdOrUsername}" with updates:`, updates);
  }

  if (options.dryRun) {
    console.log('Dry run mode: Operation would be performed with these parameters');
    return;
  }

  const token = await authenticate(options);

  try {
    await axios.patch(
      `${options.apiUrl}/admin/users/${userIdOrUsername}/credits`,
      updates,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`Successfully updated credits for user "${userIdOrUsername}"`);
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(`Failed to update credits: ${error.response.data.error.message}`);
    } else {
      throw new Error(`Failed to update credits: ${error.message}`);
    }
  }
}