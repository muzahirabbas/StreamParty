
import React from 'react';
// --- NEW: Import context and icons ---
import { useStreamContext } from '../context/StreamContext';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
// --- END IMPORTS ---

export default function Header() {
  // --- NEW: Get dark mode state and action ---
  const { state, actions } = useStreamContext();
  const { isDarkMode } = state;
  const { toggleDarkMode } = actions;
  // --- END NEW ---

  return (
    <header className="w-full bg-white dark:bg-gray-800 shadow-md">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          StreamParty by Zaari
        </h1>

        {/* --- NEW: Dark Mode Toggle Button --- */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <SunIcon /> : <MoonIcon />}
        </button>
        {/* --- END NEW BUTTON --- */}
        
      </nav>
    </header>
  );
}