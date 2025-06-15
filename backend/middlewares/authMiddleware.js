const jwt=require('jsonwebtoken');
require('dotenv').config();

const verifyToken=(req)=>{
    // authHeader contain bearer egadja....
    // for getting the token, token=authHeader.split(' ')[1]
    const authHeader=req.headers['authorization'];
    if(!authHeader){
        return null;
    }

    const token=authHeader.split(' ')[1];
    if(!token){
        return null;
    }

    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        return decoded.id;
    }
    catch{
        return null;
    }
}

module.exports={verifyToken};