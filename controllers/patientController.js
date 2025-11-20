// controllers/patientController.js
const Appointment = require("../models/Appointment");

exports.submitPatientData = async (req, res) => {
  const formData = req.body;
  console.log(formData);
  
  // Check if user is authenticated via JWT middleware
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: "Can't Book Appointment - Login Again" });
  }

  // Use the authenticated user's email
  formData.email = user.email;
  
  try {
    const newAppointment = new Appointment(formData);
    await newAppointment.save();
    console.log(user.email);
    res.status(200).json({ message: "Appointment Submitted Successfully" });
  } catch (error) {
    console.error("MongoDB Save Error:", error);
    res.status(500).json({ error: "Error saving appointment data" });
  }
};
