/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Notification = require('../models/notification')



router.post('/create', authenticateToken, async (req, res) => {
    const { userId, message,route } = req.body;

    try {
        const notification = await Notification.create({
            userId,
            message,
            route
        });
        res.status(201).json({ notification });
    } catch (error) {
        res.send(error.message);
    }
});



router.get('/user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    
    // 1. Extract and parse pagination parameters from query string with defaults
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    
    // 2. Calculate offset (how many items to skip)
    const offset = (page - 1) * limit;

    try {
        // 3. Fetch notifications and count total records simultaneously
        const { count, rows: notifications } = await Notification.findAndCountAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: offset
        });

        // 4. Get the overall unread count for the badge
        const unreadCount = await Notification.count({
            where: { 
                userId,
                isRead: false // Matches the model property you use in the frontend
            }
        });

        // 5. Send structured response back to Angular
        res.json({
            notifications,
            totalCount: count,
            unreadCount,
            currentPage: page,
            totalPages: Math.ceil(count / limit)
        });

    } catch (error) {
        // Log on server and return a clean HTTP 500 status instead of res.send()
        console.error('Error fetching paginated notifications:', error);
        res.status(500).json({ error: error.message });
    }
});




router.get('/', authenticateToken, async (req, res) => {
    // 1. Get page and limit from query params (default to page 1, 10 items)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    try {
        // 2. Fetch the paginated subset of data AND the total count
        const { count, rows: notifications } = await Notification.findAndCountAll({
            order: [['createdAt', 'DESC']], 
            limit: limit,
            offset: offset
        });

        // 3. Count global unread notifications
        const unreadCount = await Notification.count({
            where: { isRead: false }
        });

        // 4. Send the correct structured object back to Angular
        res.json({
            notifications: notifications, // This is the array of 10 items
            totalCount: count,            // Total rows in DB (e.g., 10000)
            unreadCount: unreadCount      // Total unread 
        });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- MOVE THIS ONE ABOVE ---
// Route for Admin and Super Admin to mark notifications as read
router.put('/admin/mark-read/:notificationId', authenticateToken, async (req, res) => {
    const { notificationId } = req.params;
    try {
        const notification = await Notification.findOne({
            where: { id: notificationId }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found.' }); 
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

// --- KEEP THIS ONE BELOW ---
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

router.put('/markold-read/:notificationId', authenticateToken, async (req, res) => {
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
            return res.send('Notification not found or does not belong to the user.');
        }

        notification.isRead = true;
        await notification.save();

        res.json({
            message: 'Notification marked as read.',
            notification
        });
    } catch (error) {
        res.send(error.message);
    }
});

// Route for Admin and Super Admin to mark notifications as read
router.put('/admin/mark-read/:notificationId', authenticateToken, async (req, res) => {
    const { notificationId } = req.params;

    try {
        // Fetch the notification by ID
        const notification = await Notification.findOne({
            where: {
                id: notificationId
            }
        });

        if (!notification) {
            return res.send('Notification not found.');
        }

        // Mark notification as read
        notification.isRead = true;
        await notification.save();

        res.json({
            message: 'Notification marked as read.',
            notification
        });
    } catch (error) {
        res.send(error.message);
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
        res.send(error.message);
    }
});



router.delete('/delete/:notificationId', authenticateToken, async (req, res) => {
    const { notificationId } = req.params;

    try {
        const notification = await Notification.findByPk(notificationId);
        if (!notification) {
            return res.send('Notification not found.');
        }

        await notification.destroy();
        res.send('Notification deleted successfully.');
    } catch (error) {
        res.send(error.message);
    }
});



router.delete('/', authenticateToken, async (req, res) => {
    try {
        await Notification.destroy({ where: {}, truncate: true });
        res.json({ message: 'All notifications deleted successfully.' });
    } catch (error) {
        res.send(error.message);
    }
})


module.exports = router;
