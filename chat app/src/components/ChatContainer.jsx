import React, { useRef, useEffect, useContext, useState } from 'react'; // 1. Imported useState
import toast from 'react-hot-toast'; // 2. Imported toast
import assets from '../assets/assets';
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
// 3. Removed 'mongoose' import

const ChatContainer = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } = useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef();
  const [input, setInput] = useState('');

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    await sendMessage({
      text: input.trim(),
    });
    setInput('');
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    const reader = new FileReader();

    reader.onloadend = async () => {
      await sendMessage({
        image: reader.result,
      });
      e.target.value = ""; // Clear file input after sending
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    // Automatically scroll to the latest message
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const isUserOnline = selectedUser && onlineUsers.includes(selectedUser._id);

  return selectedUser ? (
    <div className='h-full flex flex-col overflow-hidden relative backdrop-blur-lg'>
      {/*------ Header -----*/}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="Profile" className='w-8 h-8 rounded-full' />
        <div className='flex-1 text-lg text-white flex items-center gap-2'>
          <p>{selectedUser.fullName}</p>
          {/* 4. Fixed online status indicator logic */}
          {isUserOnline && <span className='w-2 h-2 rounded-full bg-green-500'></span>}
        </div>
        <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="Back" className='md:hidden max-w-7 cursor-pointer' />
        <img src={assets.help_icon} alt="Help" className='max-md:hidden max-w-5' />
      </div>

      {/*----- Chat Area ------*/}
      <div className='flex-1 flex flex-col overflow-y-scroll p-3 pb-6'>
        {messages.map((msg) => {
          const isSender = msg.senderId === authUser._id;
          const profilePic = isSender ? (authUser.profilePic || assets.avatar_icon) : (selectedUser.profilePic || assets.avatar_icon);
          
          return (
            // 5. Simplified message alignment and added unique key
            <div key={msg._id} className={`flex items-end gap-2 w-full my-1 ${isSender ? 'justify-end' : 'justify-start'}`}>
              {!isSender && <img src={profilePic} alt="Avatar" className='w-7 h-7 rounded-full self-start' />}
              
              <div className="flex flex-col max-w-[70%]">
                {msg.image ? (
                  <img src={msg.image} alt="Sent" className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden' />
                ) : (
                  // 6. Corrected message bubble rounding for a classic chat look
                  <p className={`p-2 px-3 md:text-sm font-light rounded-lg break-words text-white ${isSender ? 'bg-violet-600/50 rounded-br-none' : 'bg-gray-600/50 rounded-bl-none'}`}>
                    {msg.text}
                  </p>
                )}
                <p className={`text-xs text-gray-500 mt-1 ${isSender ? 'text-right' : 'text-left'}`}>
                  {formatMessageTime(msg.createdAt)}
                </p>
              </div>

              {isSender && <img src={profilePic} alt="Avatar" className='w-7 h-7 rounded-full self-start' />}
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>

      {/*===== Bottom Area -------*/}
      {/* 7. Wrapped input in a form for better handling */}
      <form onSubmit={handleSendMessage} className='flex items-center gap-3 p-3'>
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            type='text'
            placeholder="Send a message"
            className='flex-1 bg-transparent text-sm p-3 border-none outline-none text-white placeholder-gray-400'
          />
          <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg' hidden />
          <label htmlFor='image'>
            {/* 8. Removed incorrect onClick from gallery icon */}
            <img src={assets.gallery_icon} alt="Upload" className='w-5 mr-2 cursor-pointer' />
          </label>
        </div>
        <button type="submit">
          {/* 9. The form's submit button now works correctly */}
          <img src={assets.send_button} alt="Send" className='w-7 cursor-pointer' />
        </button>
      </form>
    </div>
  ) : (
    <div className='flex-grow flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
      <img src={assets.logo_icon} className='max-w-16' alt="Logo" />
      <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatContainer;