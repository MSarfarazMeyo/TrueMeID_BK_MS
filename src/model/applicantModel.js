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
    createdDate: {
      type: Date,
      default: Date.now, // Set the default value to the current date when created
    },
    updatedDate: {
      type: Date,
      default: Date.now, // Set the default value to the current date when created
    },
  },
  { versionKey: false }
);

// Pre-save hook to update the updatedDate field on modification
applicantModel.pre("save", function (next) {
  if (this.isModified()) {
    this.updatedDate = Date.now(); // Update the updatedDate field whenever the document is modified
  }
  next();
});

const Applicant = mongoose.model("Applicant", applicantModel);
module.exports = Applicant;
