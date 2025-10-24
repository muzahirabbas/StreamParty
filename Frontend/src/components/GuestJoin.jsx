
import React from 'react';
import { useStreamContext } from '../context/StreamContext';
import Loader from './Loader';

export default function GuestJoin() {
  const { state, actions } = useStreamContext();
  const { roomId, displayName, joinWithMic, isJoining } = state;
  const { setDisplayName, setJoinWithMic, joinStream } = actions;

  const handleSubmit = (e) => {
    e.preventDefault();
    joinStream();
  };

  if (isJoining) {
    return <Loader text={`Joining stream ${roomId}...`} />;
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold text-center">
        Join Stream
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-300">
        You're about to join room: <strong className="text-blue-500">{roomId}</strong>
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Your Name
          </label>
          <input
            type="text"
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            placeholder="Guest"
          />
        </div>

        <div className="flex items-center">
          <input
            id="join-with-mic"
            type="checkbox"
            checked={joinWithMic}
            onChange={(e) => setJoinWithMic(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="join-with-mic" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
            Join with Microphone
          </label>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Join Stream
        </button>
      </form>
    </div>
  );
}
