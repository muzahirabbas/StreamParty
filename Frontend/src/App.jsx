
import React, { useEffect, useState } from 'react';
import { BrowserRouter, useSearchParams } from 'react-router-dom';
import { StreamProvider, useStreamContext } from './context/StreamContext';
import Header from './components/Header';
import StreamerControls from './components/StreamerControls';
import GuestJoin from './components/GuestJoin';
import StreamPage from './components/StreamPage';
import Loader from './components/Loader';

function AppContent() {
  const [searchParams] = useSearchParams();
  const { state, actions } = useStreamContext();
  const { isInStream, streamerLeft, isStreamer, roomId, isInitializing } = state;
  const { setRoomId, setIsStreamer } = actions;

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const roomFromUrl = searchParams.get('room');
    if (roomFromUrl) {
      setRoomId(roomFromUrl);
      setIsStreamer(false);
    } else {
      setIsStreamer(true);
    }
    setIsLoading(false);
  }, [searchParams, setRoomId, setIsStreamer]);

  if (isLoading || isInitializing) {
    return <Loader text="Initializing..." />;
  }

  const renderContent = () => {
    if (streamerLeft) {
      return (
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Stream Ended</h2>
          <p>The streamer has ended the stream.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      );
    }

    if (isInStream) {
      return <StreamPage />;
    }

    if (isStreamer) {
      return <StreamerControls />;
    }

    if (roomId) {
      return <GuestJoin />;
    }
    
    // Default case (should be streamer controls if no room)
    return <StreamerControls />;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 animate-fade-in">
        {renderContent()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <StreamProvider>
        <AppContent />
      </StreamProvider>
    </BrowserRouter>
  );
}
