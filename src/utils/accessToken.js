const jwt = require("jsonwebtoken");

const generateAccessToken = (info) =>
  jwt.sign(info, process.env.ACCESS_SECERET_KEY, {
    expiresIn: "24h",
  });

module.exports = generateAccessToken;
