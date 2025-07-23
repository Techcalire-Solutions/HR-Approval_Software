// controllers/backupController.js
const backupService = require('../services/backupService');
const restoreService = require('../services/restoreService');

// Create a new backup
exports.createBackup = async (req, res) => {
  try {
    const backupResult = await backupService.createBackup();
    
    res.json({
      success: true,
      message: 'Backup created successfully',
      backup: {
        localPath: backupResult.localPath,
        s3Path: backupResult.s3Path,
        size: backupResult.size,
        timestamp: backupResult.timestamp
      }
    });
  } catch (error) {
    console.error('Backup creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Backup creation failed',
      error: error.message
    });
  }
};

exports.listBackupss = async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    
    res.json({
      success: true,
      backups: backups.map(backup => ({
        name: backup.name,
        originalName: backup.originalName,
        path: backup.path,
        type: backup.type,
        size: backup.size,
        formattedDate: backup.formattedDate,
        formattedTime: backup.formattedTime,
        timestamp: backup.timestamp
      }))
    });
  } catch (error) {
    console.error('Failed to list backups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
};



exports.listBackups = async (req, res) => {
  try {
    const backups = await backupService.listBackups();

    const s3BackupsOnly = backups
      .filter(backup => backup.type === 's3')
      .map(backup => ({
        name: backup.name,
        originalName: backup.originalName,
        path: backup.path, 
        size: backup.size,
        type: backup.type,
        formattedDate: backup.formattedDate,
        formattedTime: backup.formattedTime,
        timestamp: backup.timestamp
      }));

    res.json({
      success: true,
      backups: s3BackupsOnly
    });
  } catch (error) {
    console.error('Failed to list backups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
};







exports.PaginatedlistBackups = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search } = req.query;

    const backups = await backupService.listBackups();

    // Filter only s3 backups
    let s3BackupsOnly = backups.filter(backup => backup.type === 's3');

    // Optional search by date (in YYYY-MM-DD format)
    if (search) {
      s3BackupsOnly = s3BackupsOnly.filter(backup =>
        backup.formattedDate === search
      );
    }

    // Sort backups by timestamp descending
    s3BackupsOnly.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Pagination logic
    const totalCount = s3BackupsOnly.length;
    const startIndex = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedBackups = s3BackupsOnly.slice(startIndex, startIndex + parseInt(pageSize));

    // Send paginated response
    res.json({
      success: true,
      count: totalCount,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      backups: paginatedBackups
    });
  } catch (error) {
    console.error('Failed to list backups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
};



// Restore latest backup
exports.restoreLatest = async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    
    if (backups.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No backups available'
      });
    }

    const result = await restoreService.restoreBackup(backups[0].path);
    
    res.json({
      success: true,
      message: 'Latest backup restored',
      backup: {
        name: backups[0].name,
        source: backups[0].type,
        size: backups[0].size,
        timestamp: backups[0].createdAt || backups[0].lastModified
      }
    });
  } catch (error) {
    console.error('Latest restore failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore latest backup',
      error: error.message
    });
  }
};

// Manual restore
exports.restoreManual = async (req, res) => {
  try {
    const { backupPath } = req.body;
    
    if (!backupPath) {
      const backups = await backupService.listBackups();
      return res.json({
        success: false,
        message: 'Please specify a backup path',
        availableBackups: backups.map(b => ({
          name: b.name,
          path: b.path,
          type: b.type,
          size: b.size,
          timestamp: b.createdAt || b.lastModified
        }))
      });
    }

    const result = await restoreService.restoreBackup(backupPath);
    
    res.json({
      success: true,
      message: 'Backup restored successfully',
      backupPath: backupPath,
      details: result
    });
  } catch (error) {
    console.error('Manual restore failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore backup',
      error: error.message
    });
  }
};


// controllers/backupController.js
exports.generateDownloadUrl = async (req, res) => {
  try {
    const { backupPath } = req.body;
    
    if (!backupPath.startsWith('s3://')) {
      return res.status(400).json({
        success: false,
        message: 'Only S3 backups can generate download URLs'
      });
    }

    const bucket = backupPath.replace('s3://', '').split('/')[0];
    const key = backupPath.replace(`s3://${bucket}/`, '');
    
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: 3600 // URL expires in 1 hour
    };

    const url = await backupService.s3.getSignedUrlPromise('getObject', params);
    
    res.json({
      success: true,
      url: url
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate download URL',
      error: error.message
    });
  }
};