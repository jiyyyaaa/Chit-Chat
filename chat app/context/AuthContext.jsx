import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// --- Setup ---
const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;
export const AuthContext = createContext();

// --- Auth Provider Component ---
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    // --- State ---
    // Initialize authUser from localStorage if available
    const [authUser, setAuthUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    
    // --- Effects ---
    useEffect(() => {
        // Axios Interceptor to automatically add the token to requests
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem("token");
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Initial check to see if a user is already logged in
        const token = localStorage.getItem("token");
        if (token) {
            checkAuth();
        }

        // Cleanup: Eject the interceptor when the component unmounts
        return () => {
            axios.interceptors.request.eject(requestInterceptor);
        };
    }, []);

    // --- Core Functions ---
    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/auth/check");
            if (data.success) {
                setAuthUser(data.user);
                localStorage.setItem("user", JSON.stringify(data.user));
                connectSocket(data.user);
            } else {
                // If check fails (e.g., invalid token), log the user out
                logout();
            }
        } catch (error) {
            logout(); // Also logout on network error
            console.error("Auth check failed:", error);
        }
    };

    const login = async (credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/login`, credentials);
            if (data.success) {
                setAuthUser(data.userData);
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.userData));
                connectSocket(data.userData);
                toast.success(data.message);
                navigate("/");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
            toast.error(errorMessage);
        }
    };

    const signup = async (credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/signup`, credentials);
             if (data.success) {
                setAuthUser(data.userData);
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.userData));
                connectSocket(data.userData);
                toast.success(data.message);
                navigate("/");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
             const errorMessage = error.response?.data?.message || "Sign up failed. Please try again.";
            toast.error(errorMessage);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setAuthUser(null);
        setOnlineUsers([]);
        socket?.disconnect();
        setSocket(null);
        toast.success("Logged out successfully");
        navigate("/login");
    };

    const updateProfile = async (body) => {
        if (!authUser) {
            toast.error("You must be logged in to update your profile.");
            return;
        }
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated successfully");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to update profile.";
            toast.error(errorMessage);
        }
    };

    // --- Socket.IO Management ---
    const connectSocket = (userData) => {
        // Disconnect any existing socket before creating a new one
        if (socket) {
            socket.disconnect();
        }

        if (!userData) return;

        const newSocket = io(backendUrl, {
            query: {
                userId: userData._id,
            }
        });

        newSocket.on("connect", () => {
            console.log("Socket connected:", newSocket.id);
        });
        
        newSocket.on("getOnlineUsers", (users) => {
            setOnlineUsers(users);
        });

        newSocket.on("disconnect", () => {
             console.log("Socket disconnected");
        });

        setSocket(newSocket);
    };

    // --- Context Value ---
    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        signup,
        logout,
        updateProfile
    };

    // --- Provider JSX ---
    // if (authUser === null) {
    //     return (
    //         <AuthContext.Provider value={value}>
    //             <div style={{textAlign: 'center', marginTop: '20vh', color: '#888'}}>Loading...</div>
    //         </AuthContext.Provider>
    //     );
    
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
