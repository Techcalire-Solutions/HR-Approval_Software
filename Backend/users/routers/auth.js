/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwtTokens = require('../../utils/jsonWebToken');
const User = require('../models/user');

router.post('/', async (req, res) => {
    try {
        const { empNo, password } = req.body;
        
        const user = await User.findOne({ where: { empNo: empNo,  separated: false} });
        
        if (!user) {
            return res.json({ message: 'User not found' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.json({ message: 'Incorrect password' });
        }

        const token = jwtTokens(user);
        res.cookie('refreshtoken', token.refreshToken, { httpOnly: true });

        return res.status(200).json({
            token: token,
            role: user.roleId,
            name: user.name,
            id: user.id,
            paswordReset: user.paswordReset,
            empNo: user.empNo
        });

    } catch (error) {
        res.send(error.message);
    }
});

router.get('/findbyuser/:id', async (req, res) => {
    try {
      const user = await User.findAll({
        where: {id: req.params.id}
      })
      res.send(user);
    } catch (error) {
      res.send(error.message)
    }
  })


module.exports = router;