// models/Patient.js
const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  gender: String,
  email: String,
  department: String,
  date: String, // Can be Date type if you plan to parse it properly
  hospital: String,
});

module.exports = mongoose.model("Patient", patientSchema);
