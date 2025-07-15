const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const connectDB = require("./config/db");
const redis = require("redis");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

const redisClient = redis.createClient({
  url: process.env.redis_db,
});
redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.connect();
console.log("redis connected");

app.use((req, res, next) => {
  req.redisClient = redisClient;
  next();
});

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
