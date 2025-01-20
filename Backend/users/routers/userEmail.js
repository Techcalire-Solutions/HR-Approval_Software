const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const UserEmail = require('../models/userEmail')

router.get('/byuseridforleave/:id', authenticateToken, async (req, res) => {
    try {
        const user = await UserEmail.findOne({
            where: { userId: req.params.id, type: 'Leave'}
        });

        res.send(user);
    } catch (error) {
        res.send(error.message);
    }
});

router.post('/add', authenticateToken, async(req, res) => {
    const userId = req.user.id
    const { email, appPassword, type } = req.body;
    try {
        const UE = new UserEmail({email, appPassword, type, userId});
        await UE.save()
        res.send(UE)
    } catch (error) {
        res.send(error.message);
    }
});

module.exports = router;