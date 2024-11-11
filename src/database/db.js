const mongoose = require("mongoose");
require("dotenv").config();

// Connection URL
const MONGODB_URI = `${process.env.MONGO_URI}`;

// Connect to MongoDB
const connectToDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully", MONGODB_URI);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectToDB;
