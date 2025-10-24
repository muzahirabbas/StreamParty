// File: src/App.jsx

import React, { useEffect, useState } from 'react';
import { BrowserRouter, useSearchParams } from 'react-router-dom';
import { StreamProvider, useStreamContext } from './context/StreamContext.jsx'; // Make sure this is .jsx
import Header from './components/Header';
import StreamerControls from './components/StreamerControls';
import GuestJoin from './components/GuestJoin';
import StreamPage from './components/StreamPage';
import Loader from './components/Loader';

// Removed the invalid tag from the line below
function AppContent() { //
  const [searchParams] = useSearchParams(); //
  const { state, actions } = useStreamContext(); //
  // --- MODIFIED: Get isTheaterMode --- //
  // Added default {} to safely destructure even if state/actions are initially null
  const { isInStream, streamerLeft, isStreamer, roomId, isInitializing, isTheaterMode } = state || {};
  // --- END MODIFICATION --- //
  const { setRoomId, setIsStreamer, setDeferredPrompt } = actions || {}; // Added default {} and setDeferredPrompt for PWA

  const [isLoading, setIsLoading] = useState(true); //

  // --- NEW: PWA Install Prompt Listener ---
  useEffect(() => {
    // Ensure setDeferredPrompt is available before adding listener
    if (!setDeferredPrompt) return;

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      console.log('beforeinstallprompt event captured');
      setDeferredPrompt(e); // Save the event using the action from context
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [setDeferredPrompt]); // Dependency: the action function from context
  // --- END NEW ---

  useEffect(() => { //
    // Ensure actions are loaded before proceeding
    if (!setRoomId || !setIsStreamer) return; // Added check

    const roomFromUrl = searchParams.get('room'); //
    if (roomFromUrl) { //
      setRoomId(roomFromUrl); //
      setIsStreamer(false); //
    } else { //
      setIsStreamer(true); //
    } //
    setIsLoading(false); //
  }, [searchParams, setRoomId, setIsStreamer]); //

  if (isLoading || isInitializing) { //
    return <Loader text="Initializing..." />; //
  } //

  const renderContent = () => { //
    if (streamerLeft) { //
      return ( //
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Stream Ended</h2>
          <p>The streamer has ended the stream.</p>
          <button //
            onClick={() => window.location.href = '/'} //
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" //
          >
            Go Home
          </button>
        </div> //
      ); //
    } //

    if (isInStream) { //
      return <StreamPage />; //
    } //

    if (isStreamer) { //
      return <StreamerControls />; 
    } //

    if (roomId) { //
      return <GuestJoin />; 
    } //

    return <StreamerControls />; 
  }; //

  return ( 
    <div className="min-h-screen flex flex-col">
      {/* --- MODIFIED: Conditionally render Header --- */} 
      {!isTheaterMode && <Header />} 
      {/* --- END MODIFICATION --- */} 
      <main className="flex-grow flex items-center justify-center p-4 animate-fade-in">
        {renderContent()}
      </main>
    </div> //
  ); //
} //

export default function App() { //
  return ( //
    <BrowserRouter>
      <StreamProvider>
        <AppContent />
      </StreamProvider>
    </BrowserRouter> //
  ); //
} //