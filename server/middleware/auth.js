import User from "../models/User.js";
import jwt from "jsonwebtoken";
const { JsonWebTokenError } = jwt;

// Middleware to protect routes
export const protectRoute = async (req, res, next) => {
    try {
        // 1. Get the token from the standard 'Authorization' header
        const authHeader = req.headers.authorization;
        
        // 2. Check if the header or token exists
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: "Unauthorized: No Token Provided" });
        }

        const token = authHeader.split(' ')[1];

        // 3. Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Find the user from the token's payload
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // 5. Attach user to the request and proceed
        req.user = user;
        next();

    } catch (error) {
        console.log("Error in protectRoute middleware:", error.message);

        // 6. Differentiate between JWT errors and other server errors
        if (error instanceof JsonWebTokenError) {
            // If the token is invalid or expired
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid Token" });
        }

        // For any other unexpected errors
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};