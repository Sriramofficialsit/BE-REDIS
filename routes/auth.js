const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, age, dob, contact } = req.body;

    if (!name || !email || !password || !age || !dob || !contact) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    if (!/^\d{10}$/.test(contact)) {
      return res.status(400).json({ message: "Invalid contact number" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      age,
      dob,
      contact,
    });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    await req.redisClient.setEx(`token:${token}`, 3600, user._id.toString());

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const cachedUser = await req.redisClient.get(`user:${req.user.userId}`);
    if (cachedUser) {
      return res.json(JSON.parse(cachedUser));
    }

    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await req.redisClient.setEx(
      `user:${req.user.userId}`,
      3600,
      JSON.stringify(user)
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, age, dob, contact } = req.body;
    if (!name || !age || !dob || !contact) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!/^\d{10}$/.test(contact)) {
      return res.status(400).json({ message: "Invalid contact number" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, age, dob, contact },
      { new: true, runValidators: true }
    ).select("-password");
    await req.redisClient.setEx(
      `user:${req.user.userId}`,
      3600,
      JSON.stringify(user)
    );
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
