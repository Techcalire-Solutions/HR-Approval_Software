const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const authenticateToken = require('../../middleware/authorization');
// Create new backup
router.post('/backups',backupController.createBackup);
// Restore latest backup
router.get('/restore/latest', backupController.restoreLatest);

router.get('/backups', backupController.listBackups);
router.get('/backups/paginatedlist',authenticateToken, backupController.PaginatedlistBackups);

// Manual restore
router.post('/restore/manual',authenticateToken, backupController.restoreManual);


// routes/backupRoutes.js
router.post('/backups/generate-url', authenticateToken,backupController.generateDownloadUrl);

module.exports = router;