/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const Chat = require('../model/chat');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const { Op } = require('sequelize');


router.post('/add', authenticateToken, async (req, res) => {
  const { toId, fromId, message, time, status, deleted } = req.body;
    try {
          const chat = new Chat({ toId, fromId, message, time, status, deleted });
          await chat.save();
          
          res.send(chat);

    } catch (error) {
        res.send(error.message);
    }
})

router.get('/findall', authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.findAll({});

    res.send(chats);
  } catch (error) {
    res.send( error.message );
  }
});

// chatsbyuser?loginId=1&selectedUserId=2
router.get('/chatsbyuser', authenticateToken, async (req, res) => {
    const { loginId, selectedUserId } = req.query;
  
    try {
      const chats = await Chat.findAll({
        where: {
          [Op.or]: [
            { toId: loginId, fromId: selectedUserId },
            { toId: selectedUserId, fromId: loginId }
          ]
        },
        order: [['time', 'ASC']], 
      });
  
      res.send(chats);
    } catch (error) {
      res.send( error.message );
    }
});

router.put('/updatestatus/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updatedMessage = await Chat.findByPk(id);

    updatedMessage.status = status;

    await updatedMessage.save();
    res.send(updatedMessage);
  } catch (error) {
    res.send(error.message);
  }
});

router.get('/chatsbyto', authenticateToken, async (req, res) => {
  try {
    const toId = req.query.id;
    const fromId = req.query.userid;

    // Get all chats where the 'toId' matches the provided 'id'
    const chats = await Chat.findAll({
      where: { toId: toId, fromId: fromId },
      order: [['time', 'ASC']],
    });

    const unreadMessagesCount = chats.filter(chat => chat.status === 'Sent').length;
    res.send({ chats, unreadMessagesCount });
  } catch (error) {
    res.send(error.message);
  }
});

module.exports = router;