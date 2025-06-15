const {getUserCollection}=require('../models/userModel');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
require('dotenv').config();

const signUp=async (req,res,body)=>{
    const {name,email,password}=JSON.parse(body);
    const users=getUserCollection();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.statusCode = 400;
        return res.end(JSON.stringify({error: 'Invalid email format'}));
    }

    // Password length validation
    if (password.length < 6) {
        res.statusCode = 400;
        return res.end(JSON.stringify({error: 'Password must be at least 6 characters long'}));
    }

    const existing= await users.findOne({email});
    if(existing){
        res.statusCode=409;
        return res.end(JSON.stringify({error: 'User with this email already exists'}));
    }

    const hashedPassword=await bcrypt.hash(password,10);
    users.insertOne({name,email,password: hashedPassword});

    res.end(JSON.stringify({message:'User Registered'})); 
}

const login=async(req,res,body)=>{
    const {email,password}=JSON.parse(body);
    const users=getUserCollection();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.statusCode = 400;
        return res.end(JSON.stringify({error: 'Invalid email format'}));
    }

    // Password length validation
    if (password.length < 6) {
        res.statusCode = 400;
        return res.end(JSON.stringify({error: 'Password must be at least 6 characters long'}));
    }

    const user=await users.findOne({email});
    if(!user || !await bcrypt.compare(password,user.password)){
        res.statusCode=401;
        res.end(JSON.stringify({error: "Invalid email or password"}));
        return;
    }

    const token=jwt.sign({id:user._id},process.env.JWT_SECRET);
    res.end(JSON.stringify({
        token,
        user: {
            name: user.name,
            email: user.email
        }
    }));
}

module.exports={signUp,login};
