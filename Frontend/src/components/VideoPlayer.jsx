// File: src/components/VideoPlayer.jsx

import React, { useEffect, useState } from 'react'; // Import useState
import { useStreamContext } from '../context/StreamContext.jsx';
import MicOnIcon from './icons/MicOnIcon';
import MicOffIcon from './icons/MicOffIcon';
import VideoOnIcon from './icons/VideoOnIcon';
import VideoOffIcon from './icons/VideoOffIcon';
import FullscreenEnterIcon from './icons/FullscreenEnterIcon';
import FullscreenExitIcon from './icons/FullscreenExitIcon';
import OrientationIcon from './icons/OrientationIcon';
import TheaterModeIcon from './icons/TheaterModeIcon.jsx';
import CloseIcon from './icons/CloseIcon'; // Import CloseIcon for hiding controls

export default function VideoPlayer({ onToggleFullscreen, isFullScreen }) {
  const { state, actions } = useStreamContext();
  const {
    isMicOn,
    isVideoHidden,
    localStream,
    isStreamer,
    hasMic,
    isTheaterMode,
  } = state;
  const { toggleMic, toggleVideo, getVideoElRef, toggleTheaterMode } = actions;

  const [areControlsVisible, setAreControlsVisible] = useState(true);

  const videoRef = getVideoElRef();
  const isMuted = isStreamer;

  // Effect to attach streamer's local stream
  useEffect(() => {
    if (isStreamer && localStream && videoRef.current) {
      videoRef.current.srcObject = localStream;
    }
  }, [isStreamer, localStream, videoRef]);

  // Effect to mute guest's video when hidden
  useEffect(() => {
    if (!isStreamer && videoRef.current) {
      videoRef.current.muted = isVideoHidden;
    }
  }, [isVideoHidden, isStreamer, videoRef]);

  // Effect to handle exiting theater mode if user hits Esc (from fullscreen)
   useEffect(() => {
    const checkFullScreen = () => {
      // Check if BOTH state thinks we are in theater mode AND DOM says we are not fullscreen
      if (isTheaterMode && !document.fullscreenElement) {
        // If we exit fullscreen and are in theater mode, exit theater mode too
        toggleTheaterMode();
      }
    };
    document.addEventListener('fullscreenchange', checkFullScreen);
    return () => document.removeEventListener('fullscreenchange', checkFullScreen);
  }, [isTheaterMode, toggleTheaterMode]); // Dependencies are correct


  // --- THIS IS THE FIX: Implemented the function ---
  const handleToggleOrientation = async () => {
    // Screen Orientation API only works reliably in fullscreen mode
    if (!document.fullscreenElement) {
      alert("Please enter fullscreen first to change orientation.");
      return;
    }

    // Check if the API is supported
    if (screen.orientation && screen.orientation.lock) {
      try {
        const currentOrientation = screen.orientation.type;
        // Lock to the opposite orientation
        if (currentOrientation.startsWith('landscape')) {
          await screen.orientation.lock('portrait');
        } else {
          await screen.orientation.lock('landscape');
        }
      } catch (err) {
        // Handle errors, e.g., user denied permission or API failed
        console.error("Failed to lock orientation:", err);
        // Provide user feedback if needed, but avoid alerts if possible
        // alert(`Could not lock orientation: ${err.message}`);
      }
    } else {
      // Inform the user if the feature is not supported
      alert("Your browser does not support screen orientation lock.");
    }
  };
  // --- END FIX ---

  const showControls = () => {
    setAreControlsVisible(true);
  };

  return (
    <div
      className="relative w-full h-full bg-black rounded-lg overflow-hidden shadow-lg cursor-pointer"
      onClick={showControls}
    >

      {/* "Stream Hidden" overlay */}
      {isVideoHidden && (
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-white p-4 bg-black z-10">
          <VideoOffIcon className="w-16 h-16 mb-4" />
          <h3 className="text-xl font-semibold">Stream Hidden</h3>
          <p className="text-gray-300">Chat and audio are still active.</p>
          <button
            onClick={(e) => { e.stopPropagation(); toggleVideo(); }}
            className="mt-6 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Show Stream
          </button>
        </div>
      )}

      {/* The Video Element */}
      <video
        ref={videoRef}
        id="video"
        autoPlay
        playsInline
        muted={isMuted}
        className="w-full h-full object-contain"
        style={{ visibility: isVideoHidden ? 'hidden' : 'visible' }}
      ></video>

      {/* Conditionally render controls overlay */}
      {areControlsVisible && (
        <div
          className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent z-20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hide Controls Button */}
          <button
            onClick={() => setAreControlsVisible(false)}
            className="absolute top-2 left-2 p-2 text-white bg-black/30 rounded-full hover:bg-black/60 z-30"
            title="Hide Controls"
          >
            <CloseIcon className="w-5 h-5"/>
          </button>

          <div className="flex items-center justify-between mt-8"> {/* Added margin-top */}

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
              {/* Orientation Button */}
              <button
                onClick={handleToggleOrientation} // This will now work
                className="p-2 text-white bg-black/30 rounded-full hover:bg-black/60"
                title="Toggle Orientation (Fullscreen only)"
              >
                <OrientationIcon />
              </button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-4">
              {/* Theater Mode Button */}
              <button
                 onClick={toggleTheaterMode}
                className="p-2 text-white bg-black/30 rounded-full hover:bg-black/60"
                title={isTheaterMode ? 'Exit Theater Mode' : 'Enter Theater Mode'}
              >
                <TheaterModeIcon />
              </button>
              {/* Hide/Show Video Button */}
              <button
                 onClick={toggleVideo}
                className="p-2 text-white bg-black/30 rounded-full hover:bg-black/60"
                title={isVideoHidden ? 'Show Video' : 'Hide Video'}
              >
                {isVideoHidden ? <VideoOffIcon /> : <VideoOnIcon />}
              </button>
              {/* Fullscreen Button */}
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
      )}
    </div>
  );
}