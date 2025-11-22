import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketHook {
  socket: Socket | null;
  isConnected: boolean;
  notifications: NotificationData[];
  registerUser: (userData: UserData) => void;
  clearNotification: (id: number) => void;
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

export const useSocket = (): SocketHook => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    // Listen for appointment notifications
    newSocket.on('appointment_notification', (data: SocketEventData) => {
      console.log('Appointment notification received:', data);
      const notificationId = Date.now();
      
      setNotifications((prev) => [{
        id: notificationId,
        type: data.type,
        message: data.message,
        appointment: data.appointment,
        timestamp: new Date(data.timestamp)
      }, ...prev]);

      // Auto-remove notification after 8 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter(notification => notification.id !== notificationId));
      }, 8000);
    });

    // Listen for appointment updates (for admin dashboard)
    newSocket.on('appointment_update', (data: SocketEventData) => {
      console.log('Appointment update received:', data);
      const notificationId = Date.now();
      
      setNotifications((prev) => [{
        id: notificationId,
        type: data.type,
        message: `New appointment created: ${data.appointment?.reason}`,
        appointment: data.appointment,
        timestamp: new Date(data.timestamp)
      }, ...prev]);

      // Auto-remove notification after 6 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter(notification => notification.id !== notificationId));
      }, 6000);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const registerUser = (userData: UserData) => {
    if (socket) {
      socket.emit('register', userData);
      console.log(`Registered user: ${userData.name} (${userData.role})`);
    }
  };

  const clearNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    socket,
    isConnected,
    notifications,
    registerUser,
    clearNotification
  };
};