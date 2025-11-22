import React from 'react';
import { X, Bell, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface Appointment {
  _id: string;
  patientId: { name: string; email: string; phone?: string };
  doctorId: { name: string; specialization?: string };
  appointmentDate: string;
  timeSlot: string;
  status: string;
  reason: string;
}

interface Notification {
  id: number;
  type: string;
  message: string;
  appointment?: Appointment;
  timestamp: Date;
}

interface NotificationBellProps {
  notifications: Notification[];
  onClear: (id: number) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, onClear }) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_appointment':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'appointment_confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'status_update':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'appointment_updated':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'appointment_created':
        return <AlertTriangle className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_appointment':
        return 'bg-blue-500 border-blue-300';
      case 'appointment_confirmed':
        return 'bg-green-500 border-green-300';
      case 'status_update':
        return 'bg-green-500 border-green-300';
      case 'appointment_updated':
        return 'bg-yellow-500 border-yellow-300';
      case 'appointment_created':
        return 'bg-purple-500 border-purple-300';
      default:
        return 'bg-gray-500 border-gray-300';
    }
  };

  return (
    <div className="fixed top-4 right-4 space-y-3 z-50 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getNotificationColor(notification.type)} text-white p-4 rounded-lg shadow-lg border-l-4 animate-slide-in`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {getNotificationIcon(notification.type)}
              <div className="flex-1">
                <div className="font-semibold text-sm">
                  {notification.type === 'new_appointment' && 'New Appointment'}
                  {notification.type === 'appointment_confirmed' && 'Appointment Confirmed'}
                  {notification.type === 'status_update' && 'Status Update'}
                  {notification.type === 'appointment_updated' && 'Appointment Updated'}
                  {notification.type === 'appointment_created' && 'New Booking Alert'}
                  {!['new_appointment', 'appointment_confirmed', 'status_update', 'appointment_updated', 'appointment_created'].includes(notification.type) && 'Notification'}
                </div>
                <div className="text-sm mt-1 opacity-90">
                  {notification.message}
                </div>
                {notification.appointment && (
                  <div className="text-xs mt-2 opacity-75 bg-black bg-opacity-20 rounded p-2">
                    <div><strong>Patient:</strong> {notification.appointment.patientId?.name}</div>
                    <div><strong>Date:</strong> {new Date(notification.appointment.appointmentDate).toLocaleDateString()}</div>
                    <div><strong>Time:</strong> {notification.appointment.timeSlot}</div>
                  </div>
                )}
                <div className="text-xs mt-1 opacity-75">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
            <button
              onClick={() => onClear(notification.id)}
              className="text-white hover:text-gray-200 ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};