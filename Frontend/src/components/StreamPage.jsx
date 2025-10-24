
import React, { useRef, useState, useEffect } from 'react';
import { useStreamContext } from '../context/StreamContext';
import VideoPlayer from './VideoPlayer';
import Chat from './Chat';
import CopyIcon from './icons/CopyIcon';
import ChatIcon from './icons/ChatIcon';

export default function StreamPage() {
  const { state, actions } = useStreamContext();
  const { isStreamer, roomId } = state;
  const { copyRoomLink } = actions;
  const [isCopied, setIsCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isChatVisibleInFs, setIsChatVisibleInFs] = useState(false);
  const streamPageRef = useRef(null);
  const videoPlayerContainerRef = useRef(null);

  const handleCopy = () => {
    copyRoomLink();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    const checkFullScreen = () => {
      setIsFullScreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setIsChatVisibleInFs(false); // Close chat when exiting fullscreen
      }
    };
    document.addEventListener('fullscreenchange', checkFullScreen);
    return () => document.removeEventListener('fullscreenchange', checkFullScreen);
  }, []);

  const toggleFullscreen = () => {
    if (!streamPageRef.current) return;
    
    if (!document.fullscreenElement) {
      streamPageRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div ref={streamPageRef} className="w-full h-full flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Share Link Bar (Streamer only, not in fullscreen) */}
      {isStreamer && !isFullScreen && (
        <div className="w-full bg-white dark:bg-gray-800 p-4 shadow-md mb-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Share this link with your guests:
          </label>
          <div className="flex mt-2">
            <input
              type="text"
              readOnly
              value={actions.getRoomLink()}
              className="flex-grow px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
            >
              <CopyIcon />
              <span className="ml-2">{isCopied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content: Video + Chat */}
      <div className="flex-grow flex flex-col lg:flex-row gap-4 w-full h-full">
        {/* Video Player */}
        <div 
          ref={videoPlayerContainerRef} 
          className="flex-grow relative h-[60vh] lg:h-auto"
        >
          <VideoPlayer
            containerRef={videoPlayerContainerRef}
            onToggleFullscreen={toggleFullscreen}
            isFullScreen={isFullScreen}
          />

          {/* Fullscreen Chat Toggle Button */}
          {isFullScreen && !isChatVisibleInFs && (
            <button
              onClick={() => setIsChatVisibleInFs(true)}
              className="absolute top-4 right-4 z-40 p-3 bg-black/50 text-white rounded-full hover:bg-black/80"
              title="Show Chat"
            >
              <ChatIcon />
            </button>
          )}
        </div>

        {/* Chat Component */}
        {(!isFullScreen || isChatVisibleInFs) && (
          <Chat
            isFullScreen={isFullScreen}
            onClose={() => setIsChatVisibleInFs(false)}
          />
        )}
      </div>

      {/* Hidden container for guest audio */}
      <div ref={actions.getGuestAudioContainerRef()} id="guest-audio-container" className="hidden"></div>
    </div>
  );
}
