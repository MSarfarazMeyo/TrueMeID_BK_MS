require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { router } = require("./routers");
const bodyParser = require("body-parser");
const connectToDB = require("./database/db");
const compareFaces = require("../src/services/compareFace");
const path = require("path");

const port = process.env.PORT;
const host = process.env.HOST;

const app = express();

app.use(cors());

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(express.json());

app.use("/api", router);
app.post("/compareFaces", compareFaces);

// Serve static files from React's build directory
app.use(express.static(path.join(__dirname, "../build")));

// Handle all routes by sending the index.html
// This is necessary for React Router to work properly
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../build", "index.html"));
});

const appPromise = async () => {
  try {
    await connectToDB();
  } catch (error) {}
  await app.listen(port, host, () => {
    console.log(`Server is running at port:${port} host:${host}`);
  });
};
appPromise();

module.exports = app;
