const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Notification = require('../models/notification')

// Middleware to check if user is Super Admin or Admin
function checkAdminRole(req, res, next) {
    const userRole = req.user.role; // Assuming user role is stored in req.user
    if (userRole === 'Super Administrator' || userRole === 'admin') {
        next(); // User is authorized, proceed to the next middleware
    } else {
        return res.status(403).json({ message: 'Access denied.' });
    }
}

router.post('/create', authenticateToken, async (req, res) => {
    const { userId, message } = req.body;

    try {
        const notification = await Notification.create({
            userId,
            message,
        });
        res.status(201).json({ notification });
    } catch (error) {
        console.error('Error creating notification:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;

    try {
        const notifications = await Notification.findAll({
            where : {userId},
            order : [['createdAt','DESC']]
        });
        res.json({ notifications });
    } catch (error) {
        console.error('Error retrieving notifications:', error.message);
        res.status(500).send('Internal Server Error');
    }
});



// router.get('/', authenticateToken, async (req, res) => {
//     try {

//         const notifications = await Notification.findAll({
//             order: [['createdAt', 'DESC']], 
//         });

//         res.json(notifications);

//     } catch (error) {
//         console.error('Error fetching notifications:', error.message);
//         res.status(500).send('Internal Server Error');
//     }
// });

// Get all notifications (accessible by Super Admin and Admin)


router.get('/', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            order: [['createdAt', 'DESC']], 
        });
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

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
            return res.status(404).send('Notification not found or does not belong to the user.');
        }

        notification.isRead = true;
        await notification.save();

        res.json({
            message: 'Notification marked as read.',
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error.message);
        res.status(500).send('Internal Server Error');
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
        console.error('Error fetching unread count:', error.message);
        res.status(500).send('Internal Server Error');
    }
});



router.delete('/delete/:notificationId', authenticateToken, async (req, res) => {
    const { notificationId } = req.params;

    try {
        const notification = await Notification.findByPk(notificationId);
        if (!notification) {
            return res.status(404).send('Notification not found.');
        }

        await notification.destroy();
        res.send('Notification deleted successfully.');
    } catch (error) {
        console.error('Error deleting notification:', error.message);
        res.status(500).send('Internal Server Error');
    }
});



router.delete('/', authenticateToken, async (req, res) => {
    try {
        await Notification.destroy({ where: {}, truncate: true });
        res.json({ message: 'All notifications deleted successfully.' });
    } catch (error) {
        console.error('Error deleting notifications:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})


module.exports = router;
