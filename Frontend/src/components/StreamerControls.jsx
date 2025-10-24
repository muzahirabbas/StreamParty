
import React from 'react';
import { useStreamContext } from '../context/StreamContext';
import Loader from './Loader';

export default function StreamerControls() {
  const { state, actions } = useStreamContext();
  const { streamerName, enableMic, isStartingStream } = state;
  const { setStreamerName, setEnableMic, startStream } = actions;

  const handleSubmit = (e) => {
    e.preventDefault();
    startStream();
  };

  if (isStartingStream) {
    return <Loader text="Starting your stream..." />;
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold text-center">Start a New Stream</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="streamer-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Your Name
          </label>
          <input
            type="text"
            id="streamer-name"
            value={streamerName}
            onChange={(e) => setStreamerName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            placeholder="Streamer"
          />
        </div>

        <div className="flex items-center">
          <input
            id="enable-mic"
            type="checkbox"
            checked={enableMic}
            onChange={(e) => setEnableMic(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="enable-mic" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
            Enable Microphone
          </label>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Start Stream
        </button>
      </form>
    </div>
  );
}
