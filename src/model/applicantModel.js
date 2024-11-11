const { default: mongoose } = require("mongoose");

const applicantModel = new mongoose.Schema(
  {
    name: { type: String },
    sessionUsed: {
      processUsed: { type: Boolean, default: false },
      matchImagesUsed: { type: Boolean, default: false },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true, // Ensure that each applicant must be linked to a user
    },
  },

  { versionKey: false }
);

const Applicant = mongoose.model("Applicant", applicantModel);
module.exports = Applicant;
