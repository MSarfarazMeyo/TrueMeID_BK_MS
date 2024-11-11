const express = require("express");
const { sumsubRouter } = require("./sumsubRouter");
const applicantRouter = require("./applicantRouter");
const verificationRouter = require("./verificationRouter");
const authRouter = require("./authRouter");
const {
  verifyLink,
  matchImages,
  getDetails,
  processDocument,
} = require("../controllers/verificationControllerDocs");
const sessionRouter = require("./session");

require("dotenv").config();

const router = express.Router();

router.use("/sumsub-api", sumsubRouter);
router.use("/auth", authRouter);
router.use("/applicant", applicantRouter);
router.use("/verification", verificationRouter);
router.use("/session", sessionRouter);

router.get("/verifyLink", verifyLink);
router.post("/matchImages", matchImages);
router.post("/process", processDocument);
router.get("/getDetails/:id", getDetails);

module.exports = {
  router: router,
};
