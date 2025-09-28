import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs"
import {cloudinary} from "../lib/cloudinary.js";

//Signup new user
export const signup= async(req, res)=>{
    if (!req.body || typeof req.body !== 'object') {
        return res.json({success:false, message:"No data provided"});
    }
    const { fullName, email, password, bio } = req.body;
    if (!fullName || !email || !password || !bio) {
        return res.json({success:false, message:"Missing required fields"});
    }

    try{
        if  (!fullName || !email|| !password || !bio){
            return res.json({success:false, message:"missing details"})
        }

        const user= await User.findOne({email});
        if (user){
            return res.json({success:false, message:"Account already exists"})
        }

        const salt= await bcrypt.genSalt(10);
        const hashedPassword= await bcrypt.hash(password, salt);

        const newUser= await User.create({
            fullName, email, password: hashedPassword, bio // Only store hashed password
        });

            let token = null;
            if (newUser && newUser._id) {
                token = generateToken(newUser._id);
            }
            res.json({success:true, userData: newUser, token, message:" Account created successfully"})

        } catch(error){
            console.log(error.message);
            res.json({success:false, message: error.message}) // Fixed from req.json
        }
    
}

//Controller to login a user

export const login= async(req, res) =>{
    try{
        const{ email, password}= req.body;
        const userData = await User.findOne({ email }); // Fetch user from DB
        if (!userData) {
            return res.json({success: false, message:"Invalid credentials"});
        }
        const isPasswordCorrect= await bcrypt.compare(password, userData.password); // Compare password

        if(!isPasswordCorrect){
            return res.json({success: false, message:"Invalid credentials"})
        }

            let token = null;
            if (userData && userData._id) {
                token = generateToken(userData._id);
            }
            res.json({success:true, userData , token, message:" Login successfully"})
    }
    catch(error){
        console.log(error.message);
        res.json({success:false, message: error.message}) // Fixed from req.json
    }
}

//Controller to check if user is authenticated
export const checkAuth= (req, res)=>{
    res.json({success: true, user:req.user});
}

//Controller to update user profile details
export const updateProfile= async(req, res)=>{
    try{
        const { ProfilePic, bio, fullName } = req.body;
        const userId = req.user._id;
        let updatedFields = { bio, fullName };

        if (ProfilePic) {
            const upload = await cloudinary.uploader.upload(ProfilePic);
            updatedFields.profilePic = upload.secure_url; // use lowercase for MongoDB
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, { new: true });
        res.json({ success: true, user: updatedUser });
    } catch(error){

        console.log(error.message);
        res.json({success: false, message: error.message})
    }

}