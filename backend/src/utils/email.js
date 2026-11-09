const nodemailer = require('nodemailer');

let transporter = null;

// Email is sent only when SMTP settings are present in the environment.
const isEmailConfigured = () => Boolean(
  process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS
);

// Email verification (OTP codes at sign-up/login) is OFF unless explicitly turned on.
// While off, anyone can register and sign in with any address (e.g. test1@gmail.com)
// and no verification email is ever sent. The OTP code below is kept for later use.
const isEmailVerificationEnabled = () => process.env.EMAIL_VERIFICATION_ENABLED === 'true';

const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.EMAIL_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
};

/**
 * Send an email. Returns true when it was handed to the SMTP server.
 * Without SMTP settings it returns false; outside production the message is
 * printed to the console so flows like OTP verification can still be tested.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[email not configured] To: ${to} | ${subject}\n${text}`);
    }
    return false;
  }

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
      html
    });
    return true;
  } catch (error) {
    console.error('Email send failed:', error.message);
    return false;
  }
};

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const sendOtpEmail = (email, otp, name = '') => sendEmail({
  to: email,
  subject: 'Your CuraSync verification code',
  text: `Hello${name ? ` ${name}` : ''},\n\nYour CuraSync verification code is ${otp}. It expires in 10 minutes.\n\nIf you did not create an account, you can ignore this email.`,
  html: `<p>Hello${name ? ` ${escapeHtml(name)}` : ''},</p><p>Your CuraSync verification code is <strong style="font-size:20px;letter-spacing:2px">${escapeHtml(otp)}</strong>.</p><p>It expires in 10 minutes. If you did not create an account, you can ignore this email.</p>`
});

module.exports = { isEmailConfigured, isEmailVerificationEnabled, sendEmail, sendOtpEmail, escapeHtml };
