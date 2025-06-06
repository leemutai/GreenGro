// Register user : /api/user/register

import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const register = async (req, res) => {

    try {
        const {name, email, password} = req.body;
        if(!name || !email || !password){
            return res.json({success: false, message:"Missing details"})

        }

        const existingUser = await User.findOne({email})

        if(existingUser)
            return res.json({success: false, message:"User already exists"})

        const hashedPassword = await  bcrypt.hash(password, 10);

        const user = await User.create({name, email, password: hashedPassword});

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET,{expiresIn:'7d'} );

        res.cookie('token', token, {
            httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', //csrf protection
            maxAge: 7*24*60*60*1000 // 7 days in milliseconds, cookie expiration time
        })

        return res.json({success: true, message:"User registered successfully", user: {email : user.email, name: user.name}})
        
    } catch (error) {
        console.log(error.message);
       // return res.json({success: false, message:"Internal server error"})
        res.json({success: false, message: error.message});
        
    }
}


// Login user : /api/user/login

export const login = async (req, res) => {
    try {
        const {email, password} = req.body;

        if(!email || !password)
            return res.json({success: false, message:"email and password are required"});

        const user = await User.findOne({email});

        if(!user) {
            return res.json({success: false, message:"invalid email or password"});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return res.json({success: false, message:"invalid email or password"});
        }


        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET,{expiresIn:'7d'} );

        res.cookie('token', token, {
            httpOnly: true,  
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', //csrf protection
            maxAge: 7*24*60*60*1000 // 7 days in milliseconds, cookie expiration time
        })

        return res.json({success: true, message:"User registered successfully", user: {email : user.email, name: user.name}})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message});
    }
}