const mongoose = require("mongoose");

const documentResultSchema = new mongoose.Schema({
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Applicant", // Reference to the Applicant model
    required: true, // Make sure applicantId is required
  },
  response: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

const DocumentResult = mongoose.model("DocumentResult", documentResultSchema);

module.exports = DocumentResult;
