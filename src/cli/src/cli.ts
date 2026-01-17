#!/usr/bin/env node

import { Command } from 'commander';
import { updateMultiplier } from './commands/update-multiplier';
import { updateCredits } from './commands/update-credits';
import { listUsers } from './commands/list-users';
import { getUserInfo } from './commands/get-user';
import { loadConfig } from './config';

const program = new Command();

// Global options
program
  .option('--api-url <url>', 'API base URL')
  .option('--username <username>', 'Admin username')
  .option('--password <password>', 'Admin password')
  .option('--token <token>', 'Direct JWT token')
  .option('--verbose', 'Show detailed output')
  .option('--dry-run', 'Validate without making changes')
  .name('quiz-admin')
  .description('Admin CLI for managing quiz users and credits')
  .version('1.0.0');

// Load configuration
const config = loadConfig();

// Set default values from config
if (!program.opts().apiUrl && config.apiUrl) {
  program.opts().apiUrl = config.apiUrl;
}

// Update Multiplier command
program
  .command('update-multiplier')
  .description('Update multiplier for a user per quiz type')
  .option('--user <userId|username>', 'User ID or username')
  .option('--quiz-type <quiz-type>', 'Quiz type')
  .option('--value <integer>', 'Multiplier value')
  .option('--list-types', 'List valid quiz types')
  .action(async (options) => {
    if (options.listTypes) {
      console.log('Valid quiz types:');
      console.log('- simple-math');
      console.log('- simple-math-2');
      console.log('- simple-math-3');
      console.log('- simple-math-4');
      console.log('- simple-math-5');
      console.log('- simple-words');
      return;
    }

    if (!options.user || !options.quizType || options.value === undefined) {
      console.error('Error: --user, --quiz-type, and --value are required');
      process.exit(1);
    }

    try {
      await updateMultiplier(
        options.user,
        options.quizType,
        parseInt(options.value),
        {
          apiUrl: program.opts().apiUrl || config.apiUrl,
          username: program.opts().username || config.username,
          password: program.opts().password || config.password,
          token: program.opts().token || config.token,
          verbose: program.opts().verbose || config.verbose,
          dryRun: program.opts().dryRun || config.dryRun
        }
      );
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

// Update Credits command
program
  .command('update-credits')
  .description('Update credits for a user')
  .option('--user <userId|username>', 'User ID or username')
  .option('--earned <value>', 'Set earned credits')
  .option('--claimed <value>', 'Set claimed credits')
  .option('--earned-delta <value>', 'Earned credits delta')
  .option('--claimed-delta <value>', 'Claimed credits delta')
  .action(async (options) => {
    if (!options.user) {
      console.error('Error: --user is required');
      process.exit(1);
    }

    try {
      await updateCredits(
        options.user,
        {
          earned: options.earned ? parseInt(options.earned) : undefined,
          claimed: options.claimed ? parseInt(options.claimed) : undefined,
          earnedDelta: options.earnedDelta ? parseInt(options.earnedDelta) : undefined,
          claimedDelta: options.claimedDelta ? parseInt(options.claimedDelta) : undefined
        },
        {
          apiUrl: program.opts().apiUrl || config.apiUrl,
          username: program.opts().username || config.username,
          password: program.opts().password || config.password,
          token: program.opts().token || config.token,
          verbose: program.opts().verbose || config.verbose,
          dryRun: program.opts().dryRun || config.dryRun
        }
      );
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

// List Users command
program
  .command('list-users')
  .description('List users with optional search')
  .option('--search <username>', 'Search by username')
  .option('--limit <number>', 'Limit number of results')
  .option('--show-multipliers', 'Show multipliers')
  .option('--show-credits', 'Show credits')
  .action(async (options) => {
    try {
      await listUsers(
        {
          search: options.search,
          limit: options.limit ? parseInt(options.limit) : undefined,
          showMultipliers: options.showMultipliers,
          showCredits: options.showCredits
        },
        {
          apiUrl: program.opts().apiUrl || config.apiUrl,
          username: program.opts().username || config.username,
          password: program.opts().password || config.password,
          token: program.opts().token || config.token,
          verbose: program.opts().verbose || config.verbose
        }
      );
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

// Get User Info command
program
  .command('get-user')
  .description('Get detailed user information')
  .option('--user <userId|username>', 'User ID or username')
  .action(async (options) => {
    if (!options.user) {
      console.error('Error: --user is required');
      process.exit(1);
    }

    try {
      await getUserInfo(
        options.user,
        {
          apiUrl: program.opts().apiUrl || config.apiUrl,
          username: program.opts().username || config.username,
          password: program.opts().password || config.password,
          token: program.opts().token || config.token,
          verbose: program.opts().verbose || config.verbose
        }
      );
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse();