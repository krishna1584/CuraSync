'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: NotificationData[];
  registerUser: (userData: UserData) => void;
  clearNotification: (id: number) => void;
  userRole: string | null;
}

interface UserData {
  userId: string;
  role: string;
  name: string;
}

interface Appointment {
  _id: string;
  patientId: { name: string; email: string; phone?: string };
  doctorId: { name: string; specialization?: string };
  appointmentDate: string;
  timeSlot: string;
  status: string;
  reason: string;
}

interface NotificationData {
  id: number;
  type: string;
  message: string;
  appointment?: Appointment;
  timestamp: Date;
}

interface SocketEventData {
  type: string;
  message: string;
  appointment?: Appointment;
  timestamp: string;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

let globalSocket: Socket | null = null;
let registeredUserId: string | null = null;
let currentUserRole: string | null = null;

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Use existing socket or create new one
    if (!globalSocket) {
      console.log('🔌 Creating new socket connection...');
      globalSocket = io('http://localhost:5000', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling']
      });

      globalSocket.on('connect', () => {
        console.log('✅ Connected to server:', globalSocket?.id);
        setIsConnected(true);
        registeredUserId = null; // Reset on new connection
        currentUserRole = null;
        setUserRole(null);
      });

      globalSocket.on('registration_confirmed', (data) => {
        console.log('✅ Registration confirmed:', data);
      });

      globalSocket.on('test_connection', (data) => {
        console.log('🧪 TEST CONNECTION RECEIVED:', data);
        console.log('🧪 This socket can receive events!');
      });

      globalSocket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        setIsConnected(false);
        registeredUserId = null; // Reset on disconnect
        currentUserRole = null;
        setUserRole(null);
      });

      globalSocket.on('connect_error', (error) => {
        console.error('⚠️ Connection error:', error);
        setIsConnected(false);
      });

      // Listen for appointment notifications
      globalSocket.on('appointment_notification', (data: SocketEventData) => {
        console.log('\n📨 ========================================');
        console.log('📨 APPOINTMENT NOTIFICATION RECEIVED!');
        console.log('📨 Type:', data.type);
        console.log('📨 Message:', data.message);
        console.log('📨 Current user role:', currentUserRole);
        console.log('📨 Timestamp:', data.timestamp);
        console.log('📨 ========================================\n');
        
        // Show notification - backend already filters by sending to correct user
        const notificationId = Date.now();
        
        setNotifications((prev) => {
          const newNotifications = [{
            id: notificationId,
            type: data.type,
            message: data.message,
            appointment: data.appointment,
            timestamp: new Date(data.timestamp)
          }, ...prev];
          
          console.log('✅ Notification added! Total notifications:', newNotifications.length);
          return newNotifications;
        });

        // Notification will stay until manually dismissed
      });

      // Listen for appointment updates (for admin dashboard)
      globalSocket.on('appointment_update', (data: SocketEventData) => {
        console.log('📨 Appointment update received:', data);
        const notificationId = Date.now();
        
        setNotifications((prev) => [{
          id: notificationId,
          type: data.type,
          message: `New appointment created: ${data.appointment?.reason}`,
          appointment: data.appointment,
          timestamp: new Date(data.timestamp)
        }, ...prev]);

        // Notification will stay until manually dismissed
      });

      console.log('✅ All socket event listeners registered');
    }

    setSocket(globalSocket);

    // Cleanup only on app unmount (not on component unmount)
    return () => {
      // Don't disconnect here - keep connection alive
      console.log('SocketProvider cleanup (keeping connection alive)');
    };
  }, []);

  const registerUser = useCallback((userData: UserData) => {
    // If switching to a different user, clear notifications and reset
    if (registeredUserId && registeredUserId !== userData.userId) {
      console.log(`Switching user from ${registeredUserId} to ${userData.userId}`);
      setNotifications([]);
      registeredUserId = null;
    }

    // Prevent duplicate registration for the same user
    if (registeredUserId === userData.userId) {
      console.log(`User ${userData.name} already registered, skipping...`);
      return;
    }

    if (globalSocket && globalSocket.connected) {
      globalSocket.emit('register_user', userData);
      registeredUserId = userData.userId;
      currentUserRole = userData.role;
      setUserRole(userData.role);
      console.log(`Registered user: ${userData.name} (${userData.role}) with ID: ${userData.userId}`);
    } else {
      console.log('Socket not connected, waiting to register user...');
      // Wait for connection and retry
      setTimeout(() => {
        if (globalSocket && globalSocket.connected && registeredUserId !== userData.userId) {
          globalSocket.emit('register_user', userData);
          registeredUserId = userData.userId;
          currentUserRole = userData.role;
          setUserRole(userData.role);
          console.log(`Registered user (retry): ${userData.name} (${userData.role})`);
        }
      }, 1000);
    }
  }, []);

  const clearNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, notifications, registerUser, clearNotification, userRole }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
