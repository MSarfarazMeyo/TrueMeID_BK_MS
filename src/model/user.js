const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String },
  fullName: { type: String }, // Assuming this corresponds to the user's full name
  email: { type: String },
  companyName: { type: String }, // Assuming this corresponds to the company name
  password: { type: String },
  accessToken: { type: String }, // This might be used for authentication tokens
  speakeasySecret: { type: String, default: "" },
  two_factor_enabled: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
