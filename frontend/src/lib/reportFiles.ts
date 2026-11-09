// Rules for medical report uploads. These match what the backend accepts.

export const REPORT_TYPES = [
  'Blood Test',
  'Urine Test',
  'X-Ray',
  'MRI',
  'CT Scan',
  'Ultrasound',
  'ECG',
  'Pathology',
  'Other',
];

export const REPORT_FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png';
export const REPORT_FILE_HINT = 'PDF, JPG or PNG, up to 10MB';

const MAX_REPORT_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = /\.(pdf|jpe?g|png)$/i;

// Returns a message explaining why the file can't be used, or null if it's fine.
export const validateReportFile = (file: File): string | null => {
  if (!ALLOWED_EXTENSIONS.test(file.name)) return 'Only PDF, JPG and PNG files are allowed';
  if (file.size === 0) return 'This file is empty';
  if (file.size > MAX_REPORT_FILE_BYTES) return 'File size must be less than 10MB';
  return null;
};

// "YYYY-MM-DD" for today in the browser's own time zone.
export const todayLocalDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
