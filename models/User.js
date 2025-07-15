const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  age: {
    type: Number,
    required: [true, "Age is required"],
    min: [1, "Invalid age"],
  },
  dob: {
    type: Date,
    required: [true, "Date of birth is required"],
  },
  contact: {
    type: String,
    required: [true, "Contact number is required"],
    match: [/^\d{10}$/, "Invalid contact number"],
  },
});

module.exports = mongoose.model("User", userSchema);
