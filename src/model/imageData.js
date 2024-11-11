const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  ImageId: { type: String },
  applicantId: { type: String }, 
  country: { type: String },
  type: { type: String }, 
  imageBase64: { type: String },
  date: { type: Date },
});

const ImageModel = mongoose.model("Image", imageSchema);
module.exports = ImageModel;
