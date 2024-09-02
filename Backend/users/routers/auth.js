const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwtTokens = require('../../utils/jsonWebToken');
const User = require('../models/user');

router.post('/', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Attempting login for email: ${email}`);

        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        console.log(`Password valid: ${validPassword}`);

        if (!validPassword) {
            console.log('Incorrect password');
            return res.status(401).json({ message: 'Incorrect password' });
        }

        const token = jwtTokens(user);
        console.log(`Generated tokens for user: ${user.id}`);

        res.cookie('refreshtoken', token.refreshToken, { httpOnly: true });

        return res.status(200).json({
            token: token,
            role: user.roleId,
            name: user.name,
            id: user.id
        });

    } catch (error) {
        console.error('Error occurred:', error.message);
        res.status(500).json({ message: 'Internal server error' });
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

router.post('/branchlogin', async(req, res)=> {
    try {
        const { branchCode, authorizationCode } = req.body;
        const branch = await Branch.findOne({where: { branchCode: branchCode }});

        if(!branch){
            return res.status(404).send('Branch not found');            
        }
        const validPassword = await bcrypt.compare(authorizationCode, branch.authorizationCode);

        if(!validPassword){
            return res.status(401).send('incorrect authorization code' );
        }
        
        let branchToken = {id:branch.id, name:branch.branchName, branchCode: branch.branchCode, branchType: branch.branchType};

        let token = jwtTokens(branchToken);

        res.cookie('refreshtoken', token.refreshToken, {httpOnly : true})


        return res.status(200).send({"token" : token, "branch" : branch});

    } catch (error) {
        res.send(error.message);
    }    
})



module.exports = router;