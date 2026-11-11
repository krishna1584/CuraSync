'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { SOCKET_URL } from '../lib/config';

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

interface ReportProcessedData {
  reportId: string;
  reportTitle?: string;
  reportType?: string;
  message?: string;
  timestamp: string;
}

type AlertPreference = 'inAppAlerts' | 'reportAlerts';

// Reads the signed-in user's notification choices (cached at sign-in and when saved).
// Missing values default to "on".
const alertsAllowed = (key: AlertPreference) => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const prefs = raw ? JSON.parse(raw)?.notificationPreferences : null;
    return !prefs || prefs[key] !== false;
  } catch {
    return true;
  }
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

let globalSocket: Socket | null = null;
let registeredUserId: string | null = null;
let lastRegisteredUser: UserData | null = null;

// The server identifies the user from the JWT, never from client-supplied IDs.
const emitRegistration = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!globalSocket || !token) return false;
  globalSocket.emit('register_user', { token });
  return true;
};

// Disconnect and forget the current user (call on logout).
export const resetSocketSession = () => {
  registeredUserId = null;
  lastRegisteredUser = null;
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket.connect();
  }
};

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Use existing socket or create new one
    if (!globalSocket) {
      globalSocket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling']
      });

      globalSocket.on('connect', () => {
        setIsConnected(true);
        registeredUserId = null; // Reset on new connection
        // Re-authenticate automatically after a reconnect
        if (lastRegisteredUser && emitRegistration()) {
          registeredUserId = lastRegisteredUser.userId;
        } else {
          setUserRole(null);
        }
      });



      globalSocket.on('disconnect', () => {
        setIsConnected(false);
        registeredUserId = null; // Reset on disconnect
        setUserRole(null);
      });

      globalSocket.on('connect_error', (error) => {
        console.error('⚠️ Connection error:', error);
        setIsConnected(false);
      });

      const pushNotification = (type: string, message: string, timestamp: string, appointment?: Appointment) => {
        setNotifications((prev) => [{
          id: Date.now() + Math.random(),
          type,
          message,
          appointment,
          timestamp: new Date(timestamp || Date.now())
        }, ...prev]);
      };

      // Appointment booked / confirmed / status changed
      globalSocket.on('appointment_notification', (data: SocketEventData) => {
        if (!alertsAllowed('inAppAlerts')) return;
        pushNotification(data.type, data.message, data.timestamp, data.appointment);
        toast(data.message, { icon: '📅' });
      });

      // New appointments (hospital staff dashboards)
      globalSocket.on('appointment_update', (data: SocketEventData) => {
        if (!alertsAllowed('inAppAlerts')) return;
        pushNotification(data.type, `New appointment created: ${data.appointment?.reason || ''}`.trim(), data.timestamp, data.appointment);
      });

      // New prescription for the patient
      globalSocket.on('prescription_notification', (data: SocketEventData) => {
        if (!alertsAllowed('inAppAlerts')) return;
        pushNotification(data.type, data.message, data.timestamp);
        toast(data.message, { icon: '💊' });
      });

      // AI finished reading an uploaded report
      globalSocket.on('report_processed', (data: ReportProcessedData) => {
        if (!alertsAllowed('reportAlerts')) return;
        const message = data.message || `Your ${data.reportType || ''} report is ready`.replace('  ', ' ');
        pushNotification('report_processed', message, data.timestamp);
        toast.success(`${message}. Open Lab Results to see the values.`);
      });
    }

    setSocket(globalSocket);

    // Cleanup only on app unmount (not on component unmount)
    return () => {
    };
  }, []);

  const registerUser = useCallback((userData: UserData) => {
    // If switching to a different user, clear notifications and reset
    if (registeredUserId && registeredUserId !== userData.userId) {
      setNotifications([]);
      registeredUserId = null;
    }

    // Prevent duplicate registration for the same user
    if (registeredUserId === userData.userId) {
      return;
    }

    lastRegisteredUser = userData;

    if (globalSocket && globalSocket.connected) {
      if (!emitRegistration()) return;
      registeredUserId = userData.userId;
      setUserRole(userData.role);
    } else {
      // Wait for connection and retry
      setTimeout(() => {
        if (globalSocket && globalSocket.connected && registeredUserId !== userData.userId) {
          if (!emitRegistration()) return;
          registeredUserId = userData.userId;
          setUserRole(userData.role);
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
