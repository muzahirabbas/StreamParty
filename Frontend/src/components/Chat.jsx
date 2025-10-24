// File: src/components/Chat.jsx

import React, { useState, useRef, useEffect } from 'react';
import { useStreamContext } from '../context/StreamContext';
import SendIcon from './icons/SendIcon';
import CloseIcon from './icons/CloseIcon';
// --- FIX FOR BUG 1: Add imports ---
import MicOnIcon from './icons/MicOnIcon';
import MicOffIcon from './icons/MicOffIcon';

export default function Chat({ isFullScreen = false, onClose }) {
  // --- FIX FOR BUG 1: Get mic state/actions ---
  const { state, actions } = useStreamContext();
  const { messages, isMicOn, hasMic } = state;
  const { sendChatMessage, toggleMic } = actions;
  // --- END FIX ---

  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (chatInput.trim()) {
      sendChatMessage(chatInput.trim());
      setChatInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMessageClass = (type) => {
    switch (type) {
      case 'self':
        return 'bg-blue-600 text-white self-end';
      case 'peer':
        return 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 self-start';
      case 'system':
        return 'text-gray-500 dark:text-gray-400 italic text-sm text-center w-full';
      default:
        return 'bg-gray-200 dark:bg-gray-700 self-start';
    }
  };

  const containerClasses = isFullScreen
    ? 'fixed top-0 right-0 h-full w-full max-w-sm bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg z-50 flex flex-col animate-slide-in-right'
    : 'flex-1 w-full lg:max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col max-h-[70vh] lg:max-h-[80vh]';

  return (
    <div className={containerClasses}>
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold">Chat</h3>
        {isFullScreen && (
          <button
            onClick={onClose}
            className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-grow p-4 overflow-y-auto scrollbar-thin flex flex-col space-y-2">
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`p-3 rounded-lg max-w-[85%] break-words ${getMessageClass(msg.type)}`}
          >
            {msg.type === 'peer' && (
              <strong className="block text-sm">{msg.name}</strong>
            )}
            {msg.type ==='self' && (
              <strong className="block text-sm">You</strong>
            )}
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-grow px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={!chatInput.trim()}
          >
            <SendIcon />
          </button>
          
          {/* --- FIX FOR BUG 1: Add mic button --- */}
          {hasMic && (
            <button
              onClick={toggleMic}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
            >
              {isMicOn ? <MicOnIcon /> : <MicOffIcon />}
            </button>
          )}
          {/* --- END FIX --- */}

        </div>
      </div>
    </div>
  );
}