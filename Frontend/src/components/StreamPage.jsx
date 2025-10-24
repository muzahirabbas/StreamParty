// File: src/components/StreamPage.jsx

import React, { useRef, useState, useEffect } from 'react';
import { useStreamContext } from '../context/StreamContext.jsx'; // Make sure this is .jsx
import VideoPlayer from './VideoPlayer';
import Chat from './Chat';
import CopyIcon from './icons/CopyIcon';
import ChatIcon from './icons/ChatIcon';

export default function StreamPage() {
  const { state, actions } = useStreamContext();
  const { isStreamer, roomId, isTheaterMode } = state;
  const { copyRoomLink } = actions;
  const [isCopied, setIsCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isChatVisibleInFs, setIsChatVisibleInFs] = useState(false);
  // --- NEW: State for chat visibility in theater mode ---
  const [isChatVisibleInTheater, setIsChatVisibleInTheater] = useState(false);
  // --- END NEW ---
  const streamPageRef = useRef(null);
  const videoPlayerContainerRef = useRef(null);

  const handleCopy = () => {
    copyRoomLink();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    const checkFullScreen = () => {
      const fullscreenActive = !!document.fullscreenElement;
      setIsFullScreen(fullscreenActive);
      if (!fullscreenActive) {
        setIsChatVisibleInFs(false); // Close FS chat when exiting fullscreen
      }
    };
    document.addEventListener('fullscreenchange', checkFullScreen);
    return () => document.removeEventListener('fullscreenchange', checkFullScreen);
  }, []);

  // --- NEW: Effect to reset theater chat visibility when exiting theater mode ---
  useEffect(() => {
    if (!isTheaterMode) {
      setIsChatVisibleInTheater(false);
    }
  }, [isTheaterMode]);
  // --- END NEW ---

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
    // Make container relative for absolute positioning of chat button
    <div ref={streamPageRef} className="relative w-full h-full flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Share Link Bar */}
      {isStreamer && !isFullScreen && !isTheaterMode && (
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

      {/* Main Content classes */}
      <div
        className={
          isTheaterMode
            ? 'fixed inset-0 bg-black' // Theater mode fills viewport
            : 'flex-grow flex flex-col lg:flex-row gap-4 w-full h-full' // Normal layout
        }
      >
        {/* Video Player container classes */}
        <div
          ref={videoPlayerContainerRef}
          className={
            isTheaterMode
              ? 'w-full h-full' // Theater mode fills container
              : 'flex-grow relative h-[60vh] lg:h-auto' // Normal layout
          }
        >
          <VideoPlayer
            containerRef={videoPlayerContainerRef}
            onToggleFullscreen={toggleFullscreen}
            isFullScreen={isFullScreen}
          />

          {/* Chat Toggle Button (Only in Fullscreen OR Theater mode, when chat is hidden) */}
          {((isFullScreen && !isChatVisibleInFs) || (isTheaterMode && !isChatVisibleInTheater)) && (
            <button
              onClick={() => {
                if (isFullScreen) setIsChatVisibleInFs(true);
                if (isTheaterMode) setIsChatVisibleInTheater(true);
              }}
              className="absolute top-4 right-4 z-40 p-3 bg-black/50 text-white rounded-full hover:bg-black/80"
              title="Show Chat"
            >
              <ChatIcon />
            </button>
          )}
        </div>

        {/* Chat Component */}
        {/* Show if:
            1. Not fullscreen AND not theater mode
            2. OR Fullscreen AND chat is visible in FS
            3. OR Theater mode AND chat is visible in Theater
        */}
        {((!isFullScreen && !isTheaterMode) || (isFullScreen && isChatVisibleInFs) || (isTheaterMode && isChatVisibleInTheater)) && (
          <Chat
            // Pass correct flag based on mode
            isFullScreen={isFullScreen || isTheaterMode}
            onClose={() => {
              if (isFullScreen) setIsChatVisibleInFs(false);
              if (isTheaterMode) setIsChatVisibleInTheater(false);
            }}
          />
        )}
      </div>

      <div ref={actions.getGuestAudioContainerRef()} id="guest-audio-container" className="hidden"></div>
    </div>
  );
}