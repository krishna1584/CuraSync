// Appointment dates are stored as midnight UTC of the booked calendar day,
// so the day is read from the UTC date, while "today" is the viewer's local date.

const pad = (n: number) => String(n).padStart(2, '0');

// "YYYY-MM-DD" of the calendar day an appointment is booked for.
export const appointmentDay = (value: string | Date) => {
  const d = new Date(value);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

// "YYYY-MM-DD" of today in the viewer's own time zone.
export const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
