
import React, { createContext, useContext } from 'react';
import { usePeerStream } from '../hooks/usePeerStream';

const StreamContext = createContext(null);

export const useStreamContext = () => {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error('useStreamContext must be used within a StreamProvider');
  }
  return context;
};

export const StreamProvider = ({ children }) => {
  const { state, actions } = usePeerStream();

  return (
    <StreamContext.Provider value={{ state, actions }}>
      {children}
    </StreamContext.Provider>
  );
};
