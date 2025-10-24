// File: src/components/StreamerControls.jsx

import React, { useState } from 'react'; // Import useState
import { useStreamContext } from '../context/StreamContext.jsx'; // Make sure this is .jsx
import Loader from './Loader';

export default function StreamerControls() {
  const { state, actions } = useStreamContext();
  const { streamerName, enableMic, isStartingStream } = state || {}; // Add default {}
  const { setStreamerName, setEnableMic, startStream } = actions || {}; // Add default {}

  // --- NEW: State for Join URL input ---
  const [joinUrl, setJoinUrl] = useState('');
  // --- END NEW ---

  const handleStartSubmit = (e) => {
    e.preventDefault();
    if (startStream) { // Check if action exists
        startStream();
    }
  };

  // --- NEW: Handler for Join URL button ---
  const handleJoinUrl = (e) => {
    e.preventDefault();
    if (!joinUrl.trim()) {
      alert('Please enter a stream URL.');
      return;
    }
    try {
      // Basic validation: Check if it looks like a valid URL and contains "?room="
      const url = new URL(joinUrl);
      if (!url.searchParams.has('room')) {
        throw new Error('Invalid StreamParty URL: Missing room parameter.');
      }
      // Redirect the browser to the entered URL
      window.location.href = joinUrl;
    } catch (error) {
      console.error("Invalid URL entered:", error);
      alert(`Invalid StreamParty URL entered. Please ensure it includes '?room=...'`);
    }
  };
  // --- END NEW ---


  if (isStartingStream) {
    return <Loader text="Starting your stream..." />;
  }

  return (
    // Increased max-width to accommodate both sections
    <div className="w-full max-w-lg p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl">

      {/* --- Section 1: Start Stream --- */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-6">Start a New Stream</h2>
        <form onSubmit={handleStartSubmit} className="space-y-6">
          <div>
            <label htmlFor="streamer-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Name
            </label>
            <input
              type="text"
              id="streamer-name"
              value={streamerName || 'Streamer'} // Handle initial undefined state
              onChange={(e) => setStreamerName && setStreamerName(e.target.value)} // Check if action exists
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Streamer"
            />
          </div>

          <div className="flex items-center">
            <input
              id="enable-mic"
              type="checkbox"
              checked={enableMic === undefined ? true : enableMic} // Handle initial undefined state
              onChange={(e) => setEnableMic && setEnableMic(e.target.checked)} // Check if action exists
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="enable-mic" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
              Enable Microphone
            </label>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={!startStream} // Disable if action not ready
          >
            Start Stream
          </button>
        </form>
      </div>

      {/* --- Divider --- */}
      <hr className="border-gray-300 dark:border-gray-600" />

      {/* --- NEW Section 2: Join Stream --- */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-6">Or Join an Existing Stream</h2>
        <form onSubmit={handleJoinUrl} className="space-y-6">
          <div>
            <label htmlFor="join-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Paste Stream Link Here
            </label>
            <input
              type="url" // Use type="url" for better mobile keyboards
              id="join-url"
              value={joinUrl}
              onChange={(e) => setJoinUrl(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="https://streamparty.pages.dev/?room=..."
              required // Make field required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Join Stream
          </button>
        </form>
      </div>
      {/* --- END NEW Section --- */}

    </div>
  );
}