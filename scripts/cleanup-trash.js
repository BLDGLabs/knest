#!/usr/bin/env node

/**
 * Cleanup old deleted tasks
 * 
 * Permanently deletes tasks that have been in trash for 7+ days.
 * Run manually or via cron.
 * 
 * Usage:
 *   node scripts/cleanup-trash.js [days]
 * 
 * Default: 7 days
 */

import * as db from '../src/services/dynamodb.js';

const daysOld = parseInt(process.argv[2]) || 7;

console.log(`Cleaning up tasks deleted ${daysOld}+ days ago...`);

try {
  const count = await db.cleanupOldDeletedTasks(daysOld);
  console.log(`✅ Permanently deleted ${count} old tasks`);
  process.exit(0);
} catch (error) {
  console.error('❌ Error cleaning up trash:', error);
  process.exit(1);
}
