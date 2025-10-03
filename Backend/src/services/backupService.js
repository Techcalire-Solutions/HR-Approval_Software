// services/backupService.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { S3 } = require('aws-sdk');
const moment = require('moment');
const { backupDir, pgConfig, awsConfig } = require('../config/backupConfig');

class BackupService {
  constructor() {
    this.s3 = new S3({
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey,
      region: awsConfig.region
    });
    this.pgDumpPath = this.findPgDumpPath();
  }

  // Find pg_dump executable path
  findPgDumpPath() {
    const possiblePaths = [
      '/usr/bin/pg_dump',
      '/usr/local/bin/pg_dump',
      '/opt/homebrew/bin/pg_dump',
      'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
      'C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe',
      'C:\\Program Files\\PostgreSQL\\13\\bin\\pg_dump.exe',
      'pg_dump' // Fallback to system PATH
    ];

    for (const path of possiblePaths) {
      try {
        if (fs.existsSync(path)) {
          return path;
        }
      } catch (err) {
        console.warn(`Error checking path ${path}:`, err.message);
      }
    }
    return 'pg_dump';
  }

  // Create a new backup
  async createBackup() {
    // const timestamp = moment().format('YYYYMMDD-HHmmss');
    // const backupFileName = `backup-${timestamp}.dump`;

    const timestamp = moment().format('DDMMYY-HHmmss');
    const backupFileName = `backup-${timestamp}.dump`;
    const localBackupPath = path.join(backupDir, backupFileName);

    // Create local backup
    await this.createLocalBackup(localBackupPath);
    
    // Upload to S3
    const s3Key = `database-backups/${backupFileName}`;
    await this.uploadToS3(localBackupPath, s3Key);
    
    return {
      localPath: localBackupPath,
      s3Path: `s3://${awsConfig.bucket}/${s3Key}`,
      size: fs.statSync(localBackupPath).size,
      timestamp: timestamp
    };
  }

  async createLocalBackup(filePath) {
    const command = [
      `"${this.pgDumpPath}"`,
      `-U "${pgConfig.user}"`,
      `-h "${pgConfig.host}"`,
      `-p "${pgConfig.port}"`,
      `-F c`, // Custom format (compressed)
      `-b`, // Include blobs
      `-v`, // Verbose
      `-f "${filePath}"`,
      `"${pgConfig.database}"`
    ].join(' ');

    return new Promise((resolve, reject) => {
      const env = { ...process.env, PGPASSWORD: pgConfig.password };
      
      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Backup error: ${error.message}`);
          console.error(`Command output: ${stdout}`);
          console.error(`Command error: ${stderr}`);
          return reject(new Error(`Backup failed: ${stderr || error.message}`));
        }
        resolve();
      });
    });
  }

  async uploadToS3(localPath, s3Key) {
    try {
      const fileContent = fs.readFileSync(localPath);
      const params = {
        Bucket: awsConfig.bucket,
        Key: s3Key,
        Body: fileContent
      };
      
      const data = await this.s3.upload(params).promise();
      return data;
    } catch (err) {
      console.error('S3 upload failed:', err);
      throw err;
    }
  }

  // List available backups
  async listBackups() {
    try {
      // List local backups
      const localFiles = fs.readdirSync(backupDir)
        .filter(file => file.match(/^backup-.*\.dump$/))
        .map(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            type: 'local',
            size: stats.size,
            createdAt: stats.birthtime
          };
        });

      // List S3 backups
      let s3Backups = [];
      try {
        const s3Data = await this.s3.listObjectsV2({
          Bucket: awsConfig.bucket,
          Prefix: 'database-backups/'
        }).promise();

        s3Backups = s3Data.Contents.map(item => ({
          name: item.Key.split('/').pop(),
          path: `s3://${awsConfig.bucket}/${item.Key}`,
          type: 's3',
          size: item.Size,
          lastModified: item.LastModified
        }));
      } catch (s3Error) {
        console.error('Error listing S3 backups:', s3Error);
      }

      // Combine and sort by date (newest first)
      return [...localFiles, ...s3Backups].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.lastModified);
        const dateB = new Date(b.createdAt || b.lastModified);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error listing backups:', error);
      throw error;
    }
  }
  


  async listBackups() {
    try {
      // List local backups
      const localBackups = await this.listLocalBackups();
      
      // List S3 backups
      const s3Backups = await this.listS3Backups();
      
      // Combine and sort by date (newest first)
      return [...localBackups, ...s3Backups].sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error listing backups:', error);
      throw error;
    }
  }

  async listLocalBackups() {
    if (!fs.existsSync(backupDir)) {
      return [];
    }

    return fs.readdirSync(backupDir)
      .filter(file => file.match(/^backup-.*\.(dump|sql)$/))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        const timestamp = this.extractTimestamp(file) || stats.birthtime;
        
        return {
          name: this.formatBackupName(timestamp),
          originalName: file,
          path: filePath,
          type: 'local',
          size: stats.size,
          formattedDate: moment(timestamp).format('DD MMM YYYY'),
          formattedTime: moment(timestamp).format('h:mm A'),
          timestamp: moment(timestamp).valueOf()
        };
      });
  }

  async listS3Backups() {
    try {
      const data = await this.s3.listObjectsV2({
        Bucket: awsConfig.bucket,
        Prefix: 'database-backups/'
      }).promise();

      return data.Contents
        .filter(item => item.Key.match(/backup-.*\.(dump|sql)$/))
        .map(item => {
          const timestamp = this.extractTimestamp(item.Key) || item.LastModified;
          
          return {
            name: this.formatBackupName(timestamp),
            originalName: path.basename(item.Key),
            path: `s3://${awsConfig.bucket}/${item.Key}`,
            type: 's3',
            size: item.Size,
            formattedDate: moment(timestamp).format('DD MMM YYYY'),
            formattedTime: moment(timestamp).format('h:mm A'),
            timestamp: moment(timestamp).valueOf()
          };
        });
    } catch (error) {
      console.error('Error listing S3 backups:', error);
      return [];
    }
  }

//   extractTimestamp(filename) {
//     const match = filename.match(/backup-(\d{8}-\d{6})/);
//     if (match) {
//       return moment(match[1], 'YYYYMMDD-HHmmss').toDate();
//     }
//     return null;
//   }

extractTimestamp(filename) {
  // Try both formats (new DDMMYY and old YYYYMMDD for backward compatibility)
  const match = filename.match(/backup-(\d{6}-\d{6})/);
  if (match) {
    // Try parsing as DDMMYY first
    const ddmmyy = moment(match[1], 'DDMMYY-HHmmss');
    if (ddmmyy.isValid()) {
      return ddmmyy.toDate();
    }
    
    // Fallback to old YYYYMMDD format if needed
    const yyyymmdd = moment(match[1], 'YYYYMMDD-HHmmss');
    if (yyyymmdd.isValid()) {
      return yyyymmdd.toDate();
    }
  }
  return null;
}

//   formatBackupName(timestamp) {
//     return `Backup ${moment(timestamp).format('DD MMM YYYY, h:mm A')}`;
//   }
formatBackupName(timestamp) {
  return `Backup ${moment(timestamp).format('DD-MM-YY, HH:mm:ss')}`;
}
}


// Export a singleton instance
module.exports = new BackupService();




