import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:10000', {
        auth: {
          userId: user.id,
          token: localStorage.getItem('token')
        }
      });

      newSocket.on('connect', () => {
        setConnected(true);
        console.log('Socket connected');
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
        console.log('Socket disconnected');
      });

      newSocket.on('new_message', (message) => {
        console.log('New message received:', message);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  const sendMessage = (message) => {
    if (socket && connected) {
      socket.emit('send_message', message);
    }
  };

  const joinRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('join_conversation', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('leave_conversation', roomId);
    }
  };

  const value = {
    socket,
    connected,
    sendMessage,
    joinRoom,
    leaveRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};