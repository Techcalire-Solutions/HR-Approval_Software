const cron = require('node-cron');
const backupService = require('./backupService');
const fs = require('fs');
const { awsConfig, retentionDays } = require('../config/backupConfig');

// Regular function instead of class
function scheduleBackups() {
  // Run daily at 2 AM (configurable via environment variable)
  const backupSchedule = process.env.BACKUP_SCHEDULE || '0 2 * * *';
  
  const job = cron.schedule(backupSchedule, async () => {
    console.log('\n--- Starting scheduled backup ---', new Date().toISOString());
    try {
      const backupResult = await backupService.createBackup();
      console.log(`Backup created: ${backupResult.localPath}`);
      
      // Apply retention policy
      await applyRetentionPolicy();
      
      console.log('--- Scheduled backup completed successfully ---');
    } catch (error) {
      console.error('Scheduled backup failed:', error);
    }
  });

  return job;
}

async function applyRetentionPolicy() {
  try {
    console.log('Applying retention policy...');
    const backups = await backupService.listBackups();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const backupsToDelete = backups.filter(backup => {
      const backupDate = backup.createdAt || backup.lastModified;
      return new Date(backupDate) < cutoffDate;
    });

    for (const backup of backupsToDelete) {
      try {
        if (backup.type === 'local') {
          fs.unlinkSync(backup.path);
          console.log(`Deleted old local backup: ${backup.name}`);
        } else if (backup.type === 's3') {
          const key = backup.path.replace(`s3://${awsConfig.bucket}/`, '');
          await backupService.s3.deleteObject({
            Bucket: awsConfig.bucket,
            Key: key
          }).promise();
          console.log(`Deleted old S3 backup: ${backup.name}`);
        }
      } catch (err) {
        console.error(`Error deleting backup ${backup.name}:`, err.message);
      }
    }

    console.log(`Retention policy applied. Kept backups from last ${retentionDays} days.`);
  } catch (error) {
    console.error('Error applying retention policy:', error);
  }
}

module.exports = {
  scheduleBackups,
  applyRetentionPolicy
};