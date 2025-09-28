import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext"; // 👈 We need to import AuthContext to get the logged-in user
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  // 👈 We get the authenticated user from AuthContext
  const { socket, axios, authUser } = useContext(AuthContext);

  // ✅ This is the function we need to make sure is called
  const getUsers = async () => {
    console.log("1. Attempting to fetch users..."); // Our first checkpoint log
    if (!authUser) {
      console.log("   -> Aborted: No authenticated user.");
      return;
    }
    try {
      const { data } = await axios.get("/api/messages/users");
      console.log("   -> Server Response:", data); // A new log to see what the server sent back
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      console.error("   -> Error fetching users:", error); // A new log to see the error object
      toast.error(error.response?.data?.message || "Failed to fetch users");
    }
  };

  // 👈 This is the CRITICAL piece of logic.
  // This useEffect hook watches for `authUser` to change.
  // When you log in, `authUser` goes from `null` to an object, which triggers this code.
  useEffect(() => {
    if (authUser) {
      getUsers();
    }
  }, [authUser]);


  // (The rest of your code remains the same)

  // ✅ Get messages for a user
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get messages");
    }
  };

  // ✅ Send a message
  const sendMessage = async (messageData) => {
    if (!selectedUser) return toast.error("No user selected");
    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );
      if (data.success) {
        setMessages((prevMessages) => [...prevMessages, data.newMessage]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  };

  // ✅ Handle sockets
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      } else {
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    };
    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, selectedUser]);

  const value = {
    messages,
    users,
    selectedUser,
    getUsers,
    unseenMessages,
    getMessages,
    sendMessage,
    setSelectedUser,
    setUnseenMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

