const { exec } = require('child_process');
const path = require('path'); // Make sure this line is at the top
const fs = require('fs');
const { S3 } = require('aws-sdk');
const { pgConfig, awsConfig, backupDir } = require('../config/backupConfig');

class RestoreService {
  constructor() {
    // Validate AWS configuration
    if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
      throw new Error('AWS credentials not configured');
    }

    this.s3 = new S3({
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey,
      region: awsConfig.region || 'ap-south-1'
    });
    
    this.pgRestorePath = this.findPgRestorePath();
    this.tempDir = path.join(__dirname, '../temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  findPgRestorePath() {
    const possiblePaths = [
      '/usr/bin/pg_restore',
      '/usr/local/bin/pg_restore',
      '/opt/homebrew/bin/pg_restore',
      'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_restore.exe',
      'C:\\Program Files\\PostgreSQL\\14\\bin\\pg_restore.exe',
      'C:\\Program Files\\PostgreSQL\\13\\bin\\pg_restore.exe',
      'C:\\Program Files\\PostgreSQL\\12\\bin\\pg_restore.exe',
      'pg_restore' // Fallback to system PATH
    ];

    for (const possiblePath of possiblePaths) {
      try {
        if (fs.existsSync(possiblePath)) {
          console.log(`Found pg_restore at: ${possiblePath}`);
          return possiblePath;
        }
      } catch (err) {
        console.warn(`Error checking path ${possiblePath}:`, err.message);
      }
    }

    console.warn('pg_restore not found in standard locations, trying system PATH');
    return 'pg_restore';
  }

  async restoreBackup(backupIdentifier) {
    try {
      if (!backupIdentifier) {
        throw new Error('Backup path is required');
      }

      console.log(`Starting restore process for: ${backupIdentifier}`);
      
      // Resolve the backup file location
      const localBackupPath = await this.resolveBackupPath(backupIdentifier);
      console.log(`Resolved backup path: ${localBackupPath}`);

      // Execute the restore command
      await this.executeRestoreCommand(localBackupPath);
      
      console.log(`Restore completed successfully from: ${localBackupPath}`);
      
      return { 
        success: true, 
        restoredFrom: backupIdentifier,
        localPath: localBackupPath
      };
    } catch (error) {
      console.error('Restore failed:', error);
      throw new Error(`Restore process failed: ${error.message}`);
    }
  }

  async resolveBackupPath(backupIdentifier) {
    // Handle S3 paths
    if (backupIdentifier.startsWith('s3://')) {
      return await this.downloadFromS3(backupIdentifier);
    }
    
    // Handle local absolute paths
    if (path.isAbsolute(backupIdentifier)) {
      if (!fs.existsSync(backupIdentifier)) {
        throw new Error(`Backup file not found at: ${backupIdentifier}`);
      }
      return backupIdentifier;
    }
    
    // Check in default backup directory
    const backupPath = path.join(backupDir, backupIdentifier);
    if (fs.existsSync(backupPath)) {
      return backupPath;
    }
    
    // Check in temp directory
    const tempPath = path.join(this.tempDir, backupIdentifier);
    if (fs.existsSync(tempPath)) {
      return tempPath;
    }
    
    throw new Error(`Could not resolve backup path for: ${backupIdentifier}`);
  }

  async executeRestoreCommand(localBackupPath) {
    const command = [
      `"${this.pgRestorePath}"`,
      `-U "${pgConfig.user}"`,
      `-h "${pgConfig.host}"`,
      `-p "${pgConfig.port}"`,
      `-d "${pgConfig.database}"`,
      `-v`,
      `-c`,
      `--if-exists`,
      `--no-owner`,
      `--no-privileges`,
      `"${localBackupPath}"`
    ].join(' ');

    return new Promise((resolve, reject) => {
      const env = { 
        ...process.env, 
        PGPASSWORD: pgConfig.password 
      };

      console.log(`Executing restore command: ${command.replace(pgConfig.password, '*****')}`);
      
      const childProcess = exec(command, { env });

      childProcess.stdout.on('data', (data) => {
        console.log(data.toString());
      });
      
      childProcess.stderr.on('data', (data) => {
        console.error(data.toString());
      });
      
      childProcess.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`pg_restore exited with code ${code}`));
        }
        resolve();
      });
    });
  }

  async downloadFromS3(s3Uri) {
    const bucket = s3Uri.replace('s3://', '').split('/')[0];
    const key = s3Uri.replace(`s3://${bucket}/`, '');
    const fileName = path.basename(key);
    const localPath = path.join(this.tempDir, fileName);

    try {
      console.log(`Downloading from S3: ${s3Uri}`);
      const data = await this.s3.getObject({ 
        Bucket: bucket, 
        Key: key 
      }).promise();
      
      fs.writeFileSync(localPath, data.Body);
      console.log(`Downloaded backup to: ${localPath}`);
      
      return localPath;
    } catch (err) {
      console.error('S3 download failed:', err);
      throw new Error(`Failed to download from S3: ${err.message}`);
    }
  }
}

module.exports = new RestoreService();