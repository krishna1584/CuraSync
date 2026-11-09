const Appointment = require('../models/Appointment');

// Bookable consultation slots (24-hour "HH:MM"). A doctor's weekly availability,
// when set, narrows these down further.
const DEFAULT_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Appointment dates are stored as UTC midnight of the calendar day the patient picked.
// Accepts "YYYY-MM-DD" (or anything Date can parse) and returns that UTC midnight, or null.
const toDayStart = (value) => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  const date = match
    ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const dayRange = (dayStart) => ({
  $gte: dayStart,
  $lt: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
});

// True when the day is before "yesterday" in UTC. One day of slack covers patients
// in time zones ahead of UTC; exact past-time checks for today happen in the browser.
const isPastDay = (dayStart) => {
  const now = new Date();
  const yesterday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 24 * 60 * 60 * 1000;
  return dayStart.getTime() < yesterday;
};

/**
 * Slots a doctor offers on a given day.
 * Returns { slots: string[], reason?: string }.
 */
const slotsForDoctor = (doctor, dayStart) => {
  const availability = Array.isArray(doctor.availability) ? doctor.availability : [];
  if (availability.length === 0) {
    return { slots: [...DEFAULT_TIME_SLOTS] };
  }

  const weekday = WEEK_DAYS[dayStart.getUTCDay()];
  const windows = availability.filter(
    (a) => a && a.day && a.day.toLowerCase() === weekday.toLowerCase() && a.startTime && a.endTime
  );
  if (windows.length === 0) {
    return { slots: [], reason: `The doctor does not see patients on ${weekday}s` };
  }

  const slots = DEFAULT_TIME_SLOTS.filter((slot) =>
    windows.some((w) => slot >= w.startTime && slot < w.endTime)
  );
  return slots.length > 0
    ? { slots }
    : { slots: [], reason: 'No consultation slots fall inside the doctor\'s hours on this day' };
};

// Time slots already taken for a doctor on a day (scheduled appointments only).
const bookedSlots = async (doctorId, dayStart, excludeAppointmentId) => {
  const query = {
    doctorId,
    appointmentDate: dayRange(dayStart),
    status: 'scheduled'
  };
  if (excludeAppointmentId) query._id = { $ne: excludeAppointmentId };
  return Appointment.distinct('timeSlot', query);
};

module.exports = {
  DEFAULT_TIME_SLOTS,
  toDayStart,
  dayRange,
  isPastDay,
  slotsForDoctor,
  bookedSlots
};
