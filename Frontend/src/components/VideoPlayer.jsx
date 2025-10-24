// File: src/components/VideoPlayer.jsx

import React, { useEffect } from 'react';
import { useStreamContext } from '../context/StreamContext';
import MicOnIcon from './icons/MicOnIcon';
import MicOffIcon from './icons/MicOffIcon';
import VideoOnIcon from './icons/VideoOnIcon';
import VideoOffIcon from './icons/VideoOffIcon';
import FullscreenEnterIcon from './icons/FullscreenEnterIcon';
import FullscreenExitIcon from './icons/FullscreenExitIcon';
import OrientationIcon from './icons/OrientationIcon'; // --- NEW: Import icon ---

export default function VideoPlayer({ onToggleFullscreen, isFullScreen }) {
  const { state, actions } = useStreamContext();
  const {
    isMicOn,
    isVideoHidden,
    localStream,
    isStreamer,
    hasMic,
  } = state;
  const { toggleMic, toggleVideo, getVideoElRef } = actions;
  const videoRef = getVideoElRef();

  // Streamer mutes their own video element to prevent echo
  const isMuted = isStreamer;

  // Effect to attach streamer's local stream (from previous fix)
  useEffect(() => {
    if (isStreamer && localStream && videoRef.current) {
      videoRef.current.srcObject = localStream;
    }
  }, [isStreamer, localStream, videoRef]);

  // --- NEW: FIX FOR MUTE-ON-HIDE BUG ---
  // This effect mutes the guest's video element when the video is hidden
  useEffect(() => {
    // We only control mute for the GUEST (streamer is always muted)
    if (!isStreamer && videoRef.current) {
      // Mute the video element if video is hidden, unmute if shown
      videoRef.current.muted = isVideoHidden;
    }
    // We only want this to run when isVideoHidden changes
  }, [isVideoHidden, isStreamer, videoRef]);
  // --- END NEW FIX ---

  // --- NEW: Handler for Orientation Toggle ---
  const handleToggleOrientation = async () => {
    if (!document.fullscreenElement) {
      alert("Please enter fullscreen first to change orientation.");
      return;
    }
    
    if (screen.orientation && screen.orientation.lock) {
      try {
        const currentOrientation = screen.orientation.type;
        if (currentOrientation.startsWith('landscape')) {
          await screen.orientation.lock('portrait');
        } else {
          await screen.orientation.lock('landscape');
        }
      } catch (err) {
        console.error("Failed to lock orientation:", err);
      }
    } else {
      alert("Your browser does not support screen orientation lock.");
    }
  };
  // --- END NEW HANDLER ---

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden shadow-lg">
      
      {/* "Stream Hidden" overlay */}
      {isVideoHidden && (
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-white p-4 bg-black z-10">
          <VideoOffIcon className="w-16 h-16 mb-4" />
          <h3 className="text-xl font-semibold">Stream Hidden</h3>
          <p className="text-gray-300">Chat and audio are still active.</p>
          <button
            onClick={toggleVideo}
            className="mt-6 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Show Stream
          </button>
        </div>
      )}

      {/* The Video Element - ALWAYS RENDERED */}
      <video
        ref={videoRef}
        id="video"
        autoPlay
        playsInline
        muted={isMuted} // Streamer is always muted, guest is controlled by useEffect
        className="w-full h-full object-contain"
        style={{ visibility: isVideoHidden ? 'hidden' : 'visible' }}
      ></video>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity z-20">
        <div className="flex items-center justify-between">
          
          {/* Left Controls */}
          <div className="flex items-center space-x-4">
            {hasMic && (
              <button
                onClick={toggleMic}
                className="p-2 text-white bg-black/30 rounded-full hover:bg-black/60"
                title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
              >
                {isMicOn ? <MicOnIcon /> : <MicOffIcon />}
              </button>
            )}

            {/* --- NEW: Orientation Button --- */}
            <button
              onClick={handleToggleOrientation}
              className="p-2 text-white bg-black/30 rounded-full hover:bg-black/60"
              title="Toggle Orientation (Fullscreen only)"
            >
              <OrientationIcon />
            </button>
            {/* --- END NEW BUTTON --- */}

          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleVideo}
              className="p-2 text-white bg-black/30 rounded-full hover:bg-black/60"
              title={isVideoHidden ? 'Show Video' : 'Hide Video'}
            >
              {isVideoHidden ? <VideoOffIcon /> : <VideoOnIcon />}
            </button>
            <button
              onClick={onToggleFullscreen}
              className="p-2 text-white bg-black/30 rounded-full hover:bg-black/60"
              title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullScreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}