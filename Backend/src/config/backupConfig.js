// config/backupConfig.js
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Ensure backup directory exists
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// PostgreSQL configuration
const pgConfig = {
  user: process.env.USER_NAME || 'rfq_mailer_admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rfq_mailer_db',
  password: process.env.DB_PASSWORD || 'P0stgr3SQL$ecure!',
  port: process.env.DB_PORT || 5432,
};

// AWS S3 configuration
const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  bucket: process.env.AWS_BUCKET_NAME
};

module.exports = {
  backupDir,
  pgConfig,
  awsConfig,
  retentionDays: process.env.BACKUP_RETENTION_DAYS || 7
};