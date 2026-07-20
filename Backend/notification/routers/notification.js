/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Notification = require('../models/notification');
const { Op } = require('sequelize');


router.post('/create', authenticateToken, async (req, res) => {
    const { userId, message, route } = req.body;
    try {
        const notification = await Notification.create({
            userId,
            message,
            route
        });
        res.status(201).json({ notification });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/unread-count', authenticateToken, async (req, res) => {
    const userId = req.user.id; 
    try {
        const unreadCount = await Notification.count({
            where: {
                userId: userId,
                isRead: false
            }
        });
        res.json({ unreadCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.get('/user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const offset = (page - 1) * limit;

    try {
        const { count, rows: notifications } = await Notification.findAndCountAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: offset
        });

        const unreadCount = await Notification.count({
            where: { 
                userId,
                isRead: false 
            }
        });

        res.json({
            notifications,
            totalCount: count,
            unreadCount,
            currentPage: page,
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Error fetching paginated notifications:', error);
        res.status(500).json({ error: error.message });
    }
});




router.get('/', authenticateToken, async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    try {
        // Define the filter conditions
        const filterConditions = {
            message: {
                [Op.notLike]: '%by Super Admin%' // Excludes messages containing this text
            }
        };

        // 1. Fetch filtered notifications and their total count
        const { count, rows: notifications } = await Notification.findAndCountAll({
            where: filterConditions, // Added here
            order: [['createdAt', 'DESC']], 
            limit: limit,
            offset: offset
        });

        // 2. Fetch unread count matching the same filter
        const unreadCount = await Notification.count({
            where: { 
                ...filterConditions, // Added here
                isRead: false 
            }
        });

        res.json({
            notifications: notifications,
            totalCount: count,
            unreadCount: unreadCount 
        });
    } catch (error) {
        // Safe logging: avoid leaking full detailed backend errors to the response body
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Failed to fetch notifications." });
    }
});

// 5. ADMIN Route: Mark any notification as read (More specific path goes first)
router.put('/admin/mark-read/:notificationId', authenticateToken, async (req, res) => {
    const { notificationId } = req.params;
    try {
        const notification = await Notification.findOne({
            where: { id: notificationId }
        });

        if (!notification) {
            return res.status(404).json({ error: `Notification with ID ${notificationId} not found in database.` }); 
        }

        notification.isRead = true;
        await notification.save();

        res.json({
            message: 'Notification marked as read by admin.',
            notification
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. USER Route: Mark own notification as read
router.put('/mark-read/:notificationId', authenticateToken, async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id; 

    try {
        const notification = await Notification.findOne({
            where: {
                id: notificationId,
                userId: userId 
            }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found or does not belong to the user.' });
        }

        notification.isRead = true;
        await notification.save();

        res.json({
            message: 'Notification marked as read.',
            notification
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 7. Delete a single notification
router.delete('/delete/:notificationId', authenticateToken, async (req, res) => {
    const { notificationId } = req.params;
    try {
        const notification = await Notification.findByPk(notificationId);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found.' });
        }

        await notification.destroy();
        res.send('Notification deleted successfully.');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 8. Truncate all notifications
router.delete('/', authenticateToken, async (req, res) => {
    try {
        await Notification.destroy({ where: {}, truncate: true });
        res.json({ message: 'All notifications deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;