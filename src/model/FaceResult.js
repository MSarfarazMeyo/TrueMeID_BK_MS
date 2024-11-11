const mongoose = require("mongoose");

const faceResultSchema = new mongoose.Schema({
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Applicant", // Reference to the Applicant model
    required: true, // Make sure applicantId is required
  },
  response: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

const FaceResult = mongoose.model("FaceResult", faceResultSchema);

module.exports = FaceResult;
