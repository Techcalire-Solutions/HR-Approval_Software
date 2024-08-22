const jwt = require('jsonwebtoken');


function jwtTokens({id,name,email,phoneNumber,roleId}){
    const user = {id,name,email,phoneNumber,roleId};
    console.log(user)
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'});
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '1d'});
    return({accessToken, refreshToken});    
}

module.exports = jwtTokens;