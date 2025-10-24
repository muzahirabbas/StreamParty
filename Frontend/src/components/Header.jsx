// File: src/components/Header.jsx

import React from 'react';
import { useStreamContext } from '../context/StreamContext.jsx';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import InstallIcon from './icons/InstallIcon'; // --- NEW: Import Install Icon ---

export default function Header() {
  const { state, actions } = useStreamContext();
  // --- MODIFIED: Get PWA state/actions ---
  const { isDarkMode, deferredPrompt } = state;
  const { toggleDarkMode, handleInstallPrompt } = actions;
  // --- END MODIFICATION ---

  return (
    <header className="w-full bg-white dark:bg-gray-800 shadow-md">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          StreamParty by Zaari {/* Or your preferred name */}
        </h1>

        {/* --- Container for Right-Side Buttons --- */}
        <div className="flex items-center space-x-2">
          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* --- NEW: Install App Button (Conditional) --- */}
          {deferredPrompt && ( // Only show if the prompt event is available
            <button
              onClick={handleInstallPrompt}
              className="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Install StreamParty App"
            >
              <InstallIcon />
            </button>
          )}
          {/* --- END NEW BUTTON --- */}
        </div>
      </nav>
    </header>
  );
}