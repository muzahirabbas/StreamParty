// File: src/hooks/usePeerStream.js

import { useState, useRef, useCallback, useEffect } from 'react';

// --- START: CONFIGURATION ---
// This now correctly uses the .env.local variable
const WORKER_URL = import.meta.env.VITE_WORKER_URL; 
if (!WORKER_URL || WORKER_URL.includes('your-subdomain')) {
  alert("ERROR: 'VITE_WORKER_URL' in .env.local is not configured. Please deploy the worker and update the .env.local file.");
}

const httpUrl = WORKER_URL;
const wsUrl = WORKER_URL.replace(/^http/, 'ws');
const wsUrlBase = `${wsUrl}/ws`;
const pcConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};
// --- END: CONFIGURATION ---

export const usePeerStream = () => {
  // --- State ---
  const [isStreamer, setIsStreamer] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [streamerName, setStreamerName] = useState('Streamer');
  const [displayName, setDisplayName] = useState('Guest');
  const [enableMic, setEnableMic] = useState(true);
  const [joinWithMic, setJoinWithMic] = useState(true);
  const [isMicOn, setIsMicOn] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [isInStream, setIsInStream] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false); // For loaders
  const [isStartingStream, setIsStartingStream] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [streamerLeft, setStreamerLeft] = useState(false);
  const [isVideoHidden, setIsVideoHidden] = useState(false);

  // --- Chat State ---
  const [messages, setMessages] = useState([]); // Will be populated from localStorage
  const [isChatLoaded, setIsChatLoaded] = useState(false); // Prevents race condition
  
  // --- NEW: Dark Mode State ---
  // Initialize state from localStorage or system preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('theme');
    if (savedMode) {
      return savedMode === 'dark';
    }
    // If no saved mode, check system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  // --- END NEW STATE ---
  
  // --- Refs ---
  const localStreamRef = useRef(null);
  const localMicTrackRef = useRef(null);
  const wsRef = useRef(null);
  const peersRef = useRef(new Map()); // key: viewerId, value: { pc, dc }
  const guestAudioElementsRef = useRef(new Map()); // key: viewerId, value: <audio>
  const chatChannelRef = useRef(null); // For viewer
  const videoElRef = useRef(null);
  const guestAudioContainerRef = useRef(null);

  // --- Utility Functions ---

  const displayChatMessage = useCallback((text, type, name = '') => {
    const newMessage = {
      text,
      type, // 'self', 'peer', 'system'
      name,
      id: Date.now() + Math.random(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);
  const cleanup = useCallback(() => {
    console.log('Cleaning up...');
    
    // Close WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    wsRef.current = null;

    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localMicTrackRef.current) {
      localMicTrackRef.current.stop();
      localMicTrackRef.current = null;
    }

    // Close peer connections
    peersRef.current.forEach(peer => {
      peer.pc?.close();
      peer.dc?.close();
    });
    peersRef.current.clear();
    
    // Clear audio elements
    guestAudioElementsRef.current.forEach(audioEl => audioEl.remove());
    guestAudioElementsRef.current.clear();
    
    if(videoElRef.current) {
        videoElRef.current.srcObject = null;
    }

    // Reset state
    setIsInStream(false);
    setIsMicOn(false);
    setHasMic(false);
    // --- MODIFIED: Reset chat state on cleanup ---
    setMessages([]);
    setIsChatLoaded(false);
    // --- END MODIFICATION ---
    chatChannelRef.current = null;
    // Don't reset isStreamer or roomId, as they are set by URL
  }, []);
  const handleStreamerLeft = useCallback(() => {
    cleanup();
    setStreamerLeft(true);
    alert("The streamer has ended the stream.");
  }, [cleanup]);
  // --- WebRTC Handlers ---

  const handleViewerJoined = useCallback(async (viewerId, name) => {
    displayChatMessage(`${name} joined the stream.`, 'system');
    
    const pc = new RTCPeerConnection(pcConfig);

    // Add local tracks (screen + mic)
    localStreamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current);
    });

    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ice', candidate: e.candidate, to: viewerId }));
      }
    };

    pc.ontrack = (e) => {
      if (e.track.kind === 'audio' && guestAudioContainerRef.current) {
        console.log(`Receiving audio from ${name}`);
        const audioEl = document.createElement('audio');
        audioEl.srcObject = new MediaStream([e.track]);
        audioEl.autoplay = true;
        guestAudioContainerRef.current.appendChild(audioEl);
        guestAudioElementsRef.current.set(viewerId, audioEl);
      }
    };

    const dc = pc.createDataChannel('chat');
    setupChatChannel(dc, viewerId, name);

    peersRef.current.set(viewerId, { pc, dc, name });
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'offer', offer, to: viewerId }));
    }
  }, [displayChatMessage]);

  const handleOffer = useCallback(async (offer) => {
    const pc = new RTCPeerConnection(pcConfig);

    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ice', candidate: e.candidate }));
      }
    };

    pc.ontrack = (e) => {
      console.log("Got track!", e.track.kind);
      if (e.streams && e.streams[0] && videoElRef.current) {
        videoElRef.current.srcObject = e.streams[0];
      }
    };

    pc.ondatachannel = (e) => {
      chatChannelRef.current = e.channel;
      setupChatChannel(e.channel, null, 'Streamer');
    };

    if (localMicTrackRef.current) {
      pc.addTrack(localMicTrackRef.current);
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    peersRef.current.set('streamer', { pc });
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'answer', answer }));
    }
  }, []);

  const handleAnswer = useCallback(async (answer, viewerId) => {
    const peer = peersRef.current.get(viewerId);
    if (peer?.pc) {
      await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log(`Set remote description for ${viewerId}`);
    }
  }, []);
  const handleIceCandidate = useCallback(async (candidate, fromId) => {
    const peer = isStreamer ? peersRef.current.get(fromId) : peersRef.current.get('streamer');
    if (peer && peer.pc.remoteDescription) {
      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Error adding ICE candidate:", e);
      }
    }
  }, [isStreamer]);
  const handleViewerLeft = useCallback((viewerId) => {
    const peer = peersRef.current.get(viewerId);
    if (peer) {
      peer.pc.close();
      peer.dc.close();
      peersRef.current.delete(viewerId);
      displayChatMessage(`${peer.name || 'A guest'} has left.`, 'system');
    }
    guestAudioElementsRef.current.get(viewerId)?.remove();
    guestAudioElementsRef.current.delete(viewerId);
    console.log(`Cleaned up peer ${viewerId}`);
  }, [displayChatMessage]);
  // --- WebSocket Connection ---

  const connectToWebSocket = useCallback(() => {
    if (wsRef.current || !roomId) return; // Already connected or no room ID

    setIsInitializing(true);
    wsRef.current = new WebSocket(`${wsUrlBase}?room=${roomId}`);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      setIsInitializing(false);
      if (isStreamer) {
        wsRef.current.send(JSON.stringify({ type: 'init_streamer' }));
      } else {
        wsRef.current.send(JSON.stringify({ type: 'init_viewer', name: displayName }));
      }
    };

    wsRef.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'viewer_joined':
          handleViewerJoined(msg.viewerId, msg.name);
          break;
        case 'offer':
          handleOffer(msg.offer);
          break;
        case 'answer':
          handleAnswer(msg.answer, msg.from);
          break;
        case 'ice':
          handleIceCandidate(msg.candidate, msg.from);
          break;
        case 'viewer_left':
          handleViewerLeft(msg.viewerId);
          break;
        case 'streamer_left':
          handleStreamerLeft();
          break;
        default:
          console.warn("Unknown WS message type:", msg.type);
      }
    };
    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      wsRef.current = null;
      if (!isStreamer && isInStream) {
        handleStreamerLeft(); // Assume streamer left if WS closes unexpectedly
      }
    };
    wsRef.current.onerror = (err) => {
      console.error("WebSocket Error:", err);
      setIsInitializing(false);
      alert("WebSocket connection failed. Check the WORKER_URL and console.");
    };
  }, [roomId, isStreamer, displayName, handleViewerJoined, handleOffer, handleAnswer, handleIceCandidate, handleViewerLeft, handleStreamerLeft, isInStream]);
  // --- Chat ---

  const setupChatChannel = useCallback((dc, viewerId, peerName) => {
    dc.onopen = () => console.log(`Data channel open with ${viewerId || 'streamer'}`);
    
    dc.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      displayChatMessage(msg.text, 'peer', msg.name);
      
      // If streamer, rebroadcast to other viewers
      if (isStreamer && viewerId) {
        const broadcastMsg = JSON.stringify({ name: msg.name, text: msg.text });
        peersRef.current.forEach((peer, id) => {
          if (id !== viewerId && peer.dc.readyState === 'open') {
            peer.dc.send(broadcastMsg);
          }
        });
      }
    };
    dc.onclose = () => console.log(`Data channel closed with ${viewerId || 'streamer'}`);
  }, [isStreamer, displayChatMessage]);
  const sendChatMessage = useCallback((text) => {
    if (text.trim() === '') return;

    const myName = isStreamer ? streamerName : displayName;
    const msg = { name: myName, text };
    const msgString = JSON.stringify(msg);

    displayChatMessage(text, 'self', myName);

    if (isStreamer) {
      peersRef.current.forEach(peer => {
        if (peer.dc?.readyState === 'open') {
          peer.dc.send(msgString);
        }
      });
    } else if (chatChannelRef.current?.readyState === 'open') {
      chatChannelRef.current.send(msgString);
    }
  }, [isStreamer, streamerName, displayName, displayChatMessage]);
  // --- Media & Stream Control ---

  const initMic = async () => {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localMicTrackRef.current = micStream.getAudioTracks()[0];
      setIsMicOn(true);
      setHasMic(true);
      return localMicTrackRef.current;
    } catch (err) {
      console.error("Could not get mic:", err);
      alert("Could not get microphone. Check permissions.");
      setIsMicOn(false);
      setHasMic(false);
      return null;
    }
  };
  const startStream = useCallback(async () => {
    setIsStartingStream(true);
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = screenStream;

      if (enableMic) {
        const micTrack = await initMic();
        if (micTrack) {
          localStreamRef.current.addTrack(micTrack);
        } else {
          setEnableMic(false); // Update UI state if mic failed
        }
      }

      const res = await fetch(`${httpUrl}/create-room`, { method: 'POST' });
      if (!res.ok) throw new Error(`Failed to create room: ${await res.text()}`);
      
      const { roomId: newRoomId } = await res.json();
      setRoomId(newRoomId);
      
      setIsInStream(true);
      setIsStartingStream(false);
      
      // connectToWebSocket will be called by useEffect when roomId changes
    } catch (err) {
      console.error("Error starting stream:", err);
      alert(`Could not start stream. ${err.message}`);
      setIsStartingStream(false);
    }
  }, [enableMic]);
  const joinStream = useCallback(async () => {
    setIsJoining(true);
    if (joinWithMic) {
      await initMic();
    }
    
    setIsInStream(true);
    setIsJoining(false);
    connectToWebSocket(); // Manually call since roomId already exists
  }, [joinWithMic, connectToWebSocket]);
  const toggleMic = useCallback(() => {
    if (!localMicTrackRef.current || !hasMic) return;
    
    const nextState = !isMicOn;
    localMicTrackRef.current.enabled = nextState;
    setIsMicOn(nextState);
  }, [isMicOn, hasMic]);
  const toggleVideo = useCallback(() => {
    setIsVideoHidden(prev => !prev);
  }, []);
  const getRoomLink = useCallback(() => {
    return `${window.location.origin}?room=${roomId}`;
  }, [roomId]);
  const copyRoomLink = useCallback(() => {
    navigator.clipboard.writeText(getRoomLink());
  }, [getRoomLink]);
  
  // --- NEW: Dark Mode Toggle Function ---
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prevMode => !prevMode);
  }, []);
  // --- END NEW FUNCTION ---
  
  // --- Effects ---

  // Effect to connect to WS when roomId is set (for streamer)
  useEffect(() => {
    if (isStreamer && roomId && !wsRef.current) {
      connectToWebSocket();
    }
  }, [isStreamer, roomId, connectToWebSocket]);
  // Effect for component cleanup
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // --- Load/Save Chat History ---
  // Load chat from localStorage when roomId is set
  useEffect(() => {
    if (roomId) {
      const chatKey = `peerstream-chat-${roomId}`;
      const savedMessages = localStorage.getItem(chatKey);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([]); // Start fresh if no history
      }
      setIsChatLoaded(true); // Signal that loading is done
    } else {
      // If roomId is cleared (e.g., leaving stream), reset
      setMessages([]);
      setIsChatLoaded(false);
    }
  }, [roomId]); // Runs once when room ID is known or cleared

  // Save chat to localStorage whenever messages change (after initial load)
  useEffect(() => {
    // Only save *after* initial load is complete and we have a room
    if (isChatLoaded && roomId) { 
      const chatKey = `peerstream-chat-${roomId}`;
      localStorage.setItem(chatKey, JSON.stringify(messages));
    }
  }, [messages, roomId, isChatLoaded]); // Runs when messages change
  
  // --- NEW: Dark Mode Effect (Persistence) ---
  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    // 1. Update localStorage
    localStorage.setItem('theme', theme);
    // 2. Update <html> tag for Tailwind
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]); // Runs every time isDarkMode changes
  // --- END NEW EFFECT ---

  // --- Public Interface ---
  const state = {
    isStreamer,
    roomId,
    streamerName,
    displayName,
    enableMic,
    joinWithMic,
    isMicOn,
    hasMic,
    messages, // This will now be the persisted message list
    isInStream,
    isInitializing,
    isStartingStream,
    isJoining,
    streamerLeft,
    isVideoHidden,
    localStream: localStreamRef.current,
    isDarkMode, // --- NEW: Expose state ---
  };
  const actions = {
    setIsStreamer,
    setRoomId,
    setStreamerName,
    setDisplayName,
    setEnableMic,
    setJoinWithMic,
    startStream,
    joinStream,
    toggleMic,
    toggleVideo,
    sendChatMessage,
    copyRoomLink,
    getRoomLink,
    getVideoElRef: () => videoElRef,
    getGuestAudioContainerRef: () => guestAudioContainerRef,
    toggleDarkMode, // --- NEW: Expose action ---
  };
  return { state, actions };
};