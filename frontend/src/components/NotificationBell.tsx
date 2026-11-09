'use client';

import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

const TITLES: Record<string, string> = {
  new_appointment: 'New appointment',
  appointment_confirmed: 'Appointment confirmed',
  status_update: 'Status update',
  appointment_updated: 'Appointment updated',
  appointment_created: 'New booking',
  new_prescription: 'New prescription',
  report_processed: 'Report ready',
};

// The one notification bell: a count on the icon, and the list opens on tap.
export function NotificationBell() {
  const { notifications, clearNotification } = useSocket();
  const [open, setOpen] = useState(false);
  const count = notifications.length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={count > 0 ? `Notifications, ${count} new` : 'Notifications'}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      >
        <Bell className="h-6 w-6" />
        {count > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="fixed inset-x-2 top-[4.5rem] z-50 flex max-h-[70dvh] flex-col overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/5 md:inset-x-auto md:left-[16.5rem] md:top-4 md:w-96">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h2 className="font-semibold text-gray-900">Notifications</h2>
              {count > 0 && (
                <button
                  type="button"
                  onClick={() => notifications.forEach((item) => clearNotification(item.id))}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear all
                </button>
              )}
            </div>
            {count === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">You&apos;re all caught up.</p>
            ) : (
              <ul className="divide-y divide-gray-100 overflow-y-auto">
                {notifications.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{TITLES[item.type] || 'Notification'}</p>
                      <p className="mt-0.5 break-words text-sm text-gray-600">{item.message}</p>
                      <p className="mt-1 text-xs text-gray-400">{new Date(item.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => clearNotification(item.id)}
                      aria-label="Dismiss notification"
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
