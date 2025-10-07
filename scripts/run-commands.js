#!/usr/bin/env node

/**
 * Automated script to execute commands from commands.sh
 * This script runs Wrangler commands for setting up secrets and migrations
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Constants
const DEFAULT_PASSWORD_SALT_ROUNDS = 12;

// Password hashing function
const hashPassword = async (password, saltRounds = DEFAULT_PASSWORD_SALT_ROUNDS) => {
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Helper function to log messages with colors
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.blue}${msg}${colors.reset}`)
};

// Commands to execute (extracted from commands.sh)
const commands = [
  {
    name: 'Setup TWILIO_ACCOUNT_SID Secret',
    cmd: 'wrangler secrets-store secret create "acefd69d51d8446f9873c88efc6a47f3" --name TWILIO_ACCOUNT_SID --scopes workers',
    category: 'secrets'
  },
  {
    name: 'Setup TWILIO_AUTH_TOKEN Secret',
    cmd: 'wrangler secrets-store secret create "acefd69d51d8446f9873c88efc6a47f3" --name TWILIO_AUTH_TOKEN --scopes workers',
    category: 'secrets'
  },
  {
    name: 'Setup SENDGRID_API_KEY Secret',
    cmd: 'wrangler secrets-store secret create "acefd69d51d8446f9873c88efc6a47f3" --name SENDGRID_API_KEY --scopes workers',
    category: 'secrets'
  },
  {
    name: 'Execute Migration - Users Schema',
    cmd: 'wrangler d1 execute \'pos-db-global\' --file=\'./migrations/001_users_schema.sql\' --remote',
    category: 'migrations',
    module: 'users'
  },
  {
    name: 'Execute Migration - Seed Users Data',
    cmd: 'wrangler d1 execute \'pos-db-global\' --file=\'./migrations/002_seed_users_data.sql\' --remote',
    category: 'migrations',
    module: 'users'
  }
];

/* Update user migration with hashed passwords before execution */
const updateUserMigrationPasswords = async () => {
  try {
    const migrationPath = './migrations/002_seed_users_data.sql';

    if (!existsSync(migrationPath)) {
      return; // Skip if file doesn't exist
    }

    log.info('Updating user migration with hashed passwords...');

    let migrationContent = readFileSync(migrationPath, 'utf-8');
    const oldHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj.UIQ8PO4GK';

    /* Check if already updated */
    const occurrenceCount = (migrationContent.match(new RegExp(oldHash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

    if (occurrenceCount === 0) {
      log.info('Migration already has updated password hashes');
      return;
    }

    /* Generate new password hashes */
    const [adminHash, supportHash, operationsHash, userHash] = await Promise.all([
      hashPassword('Admin@123!'),
      hashPassword('Support@456!'),
      hashPassword('Operations@789!'),
      hashPassword('User@2024!')
    ]);

    /* Replace passwords in order */
    let replacementCount = 0;
    migrationContent = migrationContent.replace(new RegExp(oldHash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), () => {
      replacementCount++;
      if (replacementCount === 1) {
        return adminHash; /* System Administrator */
      } else if (replacementCount === 2) {
        return supportHash; /* Support Agent */
      } else if (replacementCount === 3) {
        return operationsHash; /* Operations Manager */
      } else {
        return userHash; /* All other users */
      }
    });

    /* Write updated content back */
    writeFileSync(migrationPath, migrationContent, 'utf-8');
    log.success(`Updated ${replacementCount} password hashes in migration file`);

  } catch (error) {
    log.warning(`Failed to update migration passwords: ${error.message}`);
    /* Continue with migration even if password update fails */
  }
};

// Execute a single command with error handling
const executeCommand = async (commandObj) => {
  const { name, cmd, category } = commandObj;

  try {
    /* Update user migration passwords before executing user data migration */
    if (name === 'Execute Migration - Seed Users Data') {
      await updateUserMigrationPasswords();
    }

    log.info(`Executing: ${name}`);

    // Execute command
    const output = execSync(cmd, {
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 30000 // 30 second timeout
    });

    log.success(`${name} completed successfully`);

    // Show output if it exists
    if (output.trim()) {
      console.log(`   Output: ${output.trim()}`);
    }

    return { success: true, name, output };

  } catch (error) {
    log.error(`${name} failed`);
    console.log(`   Error: ${error.message}`);

    if (error.stdout) {
      console.log(`   Stdout: ${error.stdout}`);
    }

    if (error.stderr) {
      console.log(`   Stderr: ${error.stderr}`);
    }

    return { success: false, name, error: error.message };
  }
};

// Check if required files exist
const checkPrerequisites = () => {
  log.header('🔍 Checking Prerequisites...');

  const requiredFiles = [
    './migrations/001_users_schema.sql',
    './migrations/002_seed_users_data.sql'
  ];

  const missingFiles = requiredFiles.filter(file => !existsSync(file));

  if (missingFiles.length > 0) {
    log.error('Missing required migration files:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    return false;
  }
  
  // Check if wrangler is installed
  try {
    execSync('wrangler --version', { stdio: 'pipe', encoding: 'utf-8' });
    log.success('Wrangler CLI is available');
  } catch (error) {
    try {
      // Try with explicit path
      execSync('/home/jrbuser/.nvm/versions/node/v24.2.0/bin/wrangler --version', { stdio: 'pipe', encoding: 'utf-8' });
      log.success('Wrangler CLI is available');
    } catch (pathError) {
      log.error('Wrangler CLI not found. Please install it first.');
      return false;
    }
  }
  
  log.success('All prerequisites met');
  return true;
};

// Parse command line arguments
const parseArguments = () => {
  const args = process.argv.slice(2);
  const options = {
    secrets: true,
    migrations: true,
    help: false,
    module: null, // Specific module filter
    remote: false // Remote execution flag
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg.toLowerCase()) {
      case '--secrets-only':
      case '-s':
        options.secrets = true;
        options.migrations = false;
        break;
      case '--migrations-only':
      case '-m':
        options.secrets = false;
        options.migrations = true;
        break;
      case '--all':
      case '-a':
        options.secrets = true;
        options.migrations = true;
        break;
      case '--module':
        /* Get next argument as module name */
        if (i + 1 < args.length) {
          options.module = args[i + 1];
          options.secrets = false;
          options.migrations = true;
          i++; /* Skip next argument */
        } else {
          log.error('--module requires a module name');
          process.exit(1);
        }
        break;
      case '--remote':
        options.remote = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        log.warning(`Unknown argument: ${arg}`);
    }
  }

  return options;
};

// Display help information
const showHelp = () => {
  console.log(`${colors.bold}${colors.green}🚀 POS Backend Setup Script${colors.reset}\n`);
  console.log(`${colors.bold}Usage:${colors.reset}`);
  console.log('  node run-commands.js [options]\n');
  console.log(`${colors.bold}Options:${colors.reset}`);
  console.log('  -s, --secrets-only           Execute only secrets setup commands');
  console.log('  -m, --migrations-only        Execute only database migration commands');
  console.log('  -a, --all                    Execute all commands (default)');
  console.log('  --module <module-name>      Execute migrations for specific module only');
  console.log('  --remote                    Execute migrations on remote D1 database');
  console.log('  -h, --help                  Show this help message\n');
  console.log(`${colors.bold}Available Modules:${colors.reset}`);
  console.log('  users                       User management module\n');
  console.log(`${colors.bold}Examples:${colors.reset}`);
  console.log('  node run-commands.js                                # Run all commands (local)');
  console.log('  node run-commands.js --remote                       # Run all commands (remote)');
  console.log('  node run-commands.js --secrets-only                 # Setup secrets only');
  console.log('  node run-commands.js --migrations-only              # Run all migrations (local)');
  console.log('  node run-commands.js --migrations-only --remote     # Run all migrations (remote)');
  console.log('  node run-commands.js --module users                 # Run only users module (local)');
  console.log('  node run-commands.js --module users --remote        # Run only users module (remote)');
  console.log('  npm run setup -- --module users                     # Using npm script with module option');
};

// Main execution function
const main = async () => {
  const options = parseArguments();
  
  // Show help if requested
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  console.log(`${colors.bold}${colors.green}🚀 POS Backend Setup Script${colors.reset}\n`);
  
  // Show what will be executed
  const executionPlan = [];
  const environment = options.remote ? 'Remote' : 'Local';

  if (options.secrets) executionPlan.push('Secrets Setup');
  if (options.migrations) {
    if (options.module) {
      executionPlan.push(`Database Migrations (Module: ${options.module}, ${environment})`);
    } else {
      executionPlan.push(`Database Migrations (All, ${environment})`);
    }
  }

  if (executionPlan.length === 0) {
    log.warning('No commands selected for execution. Use --help for usage information.');
    process.exit(1);
  }

  log.info(`Execution plan: ${executionPlan.join(', ')}`);
  console.log();
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    process.exit(1);
  }
  
  console.log();
  
  // Group commands by category
  const secretsCommands = commands.filter(cmd => cmd.category === 'secrets');

  /* Filter migrations by module if specified */
  let migrationCommands = commands.filter(cmd => cmd.category === 'migrations');
  if (options.module) {
    const moduleCommands = migrationCommands.filter(cmd => cmd.module === options.module);
    if (moduleCommands.length === 0) {
      log.error(`No migrations found for module: ${options.module}`);
      log.info('Available modules: users');
      process.exit(1);
    }
    migrationCommands = moduleCommands;
    log.info(`Filtered ${migrationCommands.length} migration(s) for module: ${options.module}`);
  }

  /* Add --remote flag to migration commands if specified */
  if (options.remote && options.migrations) {
    migrationCommands = migrationCommands.map(cmd => ({
      ...cmd,
      cmd: cmd.cmd.includes('--remote') ? cmd.cmd : `${cmd.cmd.replace('--remote', '').trim()} --remote`
    }));
    log.info('Migrations will be executed on remote D1 database');
  } else if (options.migrations) {
    /* Remove --remote flag for local execution */
    migrationCommands = migrationCommands.map(cmd => ({
      ...cmd,
      cmd: cmd.cmd.replace('--remote', '').trim()
    }));
    log.info('Migrations will be executed on local D1 database');
  }

  const results = {
    secrets: [],
    migrations: [],
    totalSuccess: 0,
    totalFailed: 0
  };

  // Execute secrets setup
  if (options.secrets && secretsCommands.length > 0) {
    log.header('🔐 Setting up Secrets...');

    for (const command of secretsCommands) {
      const result = await executeCommand(command);
      results.secrets.push(result);

      if (result.success) {
        results.totalSuccess++;
      } else {
        results.totalFailed++;
      }

      // Add small delay between commands
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log();
  }
  
  // Execute migrations
  if (options.migrations && migrationCommands.length > 0) {
    /* Dynamic header based on module filter */
    if (options.module) {
      const moduleNames = {
        'users': 'Users'
      };
      const moduleName = moduleNames[options.module] || options.module;
      log.header(`📊 Running ${moduleName} Module Migrations...`);
    } else {
      log.header('📊 Running Database Migrations...');
    }

    for (const command of migrationCommands) {
      const result = await executeCommand(command);
      results.migrations.push(result);

      if (result.success) {
        results.totalSuccess++;
      } else {
        results.totalFailed++;
      }

      // Add small delay between commands
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log();
  }

  // Display summary
  log.header('📋 Execution Summary');
  const totalExecuted = results.totalSuccess + results.totalFailed;
  console.log(`   Total Commands Executed: ${totalExecuted}`);
  console.log(`   ${colors.green}Successful: ${results.totalSuccess}${colors.reset}`);
  console.log(`   ${colors.red}Failed: ${results.totalFailed}${colors.reset}`);
  
  if (results.totalFailed > 0) {
    console.log(`\n${colors.yellow}⚠ Some commands failed. Please check the errors above.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}🎉 All commands executed successfully!${colors.reset}`);
    process.exit(0);
  }
};

// Handle process interruption
process.on('SIGINT', () => {
  log.warning('\nProcess interrupted by user');
  process.exit(1);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

// Run the script
if (import.meta.main) {
  main().catch(error => {
    log.error(`Script execution failed: ${error.message}`);
    process.exit(1);
  });
}

export default { executeCommand, checkPrerequisites };