const { v4: uuidv4 } = require("uuid");
const { FaceSdk, ImageSource } = require("@regulaforensics/facesdk-webclient");
const {
  DocumentReaderApi,
  Scenario,
} = require("@regulaforensics/document-reader-webclient");
const Session = require("../model/Session");

const FaceResult = require("../model/FaceResult");
const DocumentResult = require("../model/DocumentResult");
const User = require("../model/user");
const Applicant = require("../model/applicantModel");
exports.verifyLink = async (req, res) => {
  try {
    const { userId, applicantId } = req.query;

    // Check if user and applicant exist
    const user = await User.findById(userId);
    const applicant = await Applicant.findById(applicantId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!applicant) {
      return res.status(404).json({ error: "Applicant not found" });
    }

    // Return the applicant if both user and applicant exist
    res.json({ applicant });
  } catch (error) {
    console.error("Error verifying link:", error.message);
    res.status(500).json({
      error:
        "An error occurred while verifying the link. Please try again later.",
    });
  }
};
exports.matchImages = async (req, res) => {
  const { applicantId, imageSrc, img } = req.body;
  if (!imageSrc || !img || !applicantId) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const session = await Applicant.findOne({ _id: applicantId });
    if (!session)
      return res.status(404).json({
        error:
          "The session ID provided is invalid/ Already Used. Please start a new session.",
      });
    if (session.sessionUsed.matchImagesUsed) {
      return res.status(400).json({
        error:
          "This session has already been used for image matching. Please create a new session.",
      });
    }
    let liveImageData = imageSrc.startsWith("data")
      ? imageSrc.split(",")[1]
      : imageSrc;
    let documentImageData = img.startsWith("data") ? img.split(",")[1] : img;
    const sdk = new FaceSdk({ basePath: process.env.REGULA_FACE_API_URL });
    const response = await sdk.matchingApi.match({
      images: [
        { type: ImageSource.LIVE, data: liveImageData, index: 0 },
        {
          type: ImageSource.DOCUMENT_PRINTED,
          data: documentImageData,
          index: 1,
        },
      ],
    });
    const similarity = response.results?.map((result) => result.similarity);
    const highestSimilarity = Math.max(...similarity);
    if (response.msg === "FACER_OK" && highestSimilarity >= 0.9) {
      const faceResult = new FaceResult({ applicantId, response });
      await faceResult.save();
      session.sessionUsed.matchImagesUsed = true;
      await session.save();
    }
    res.json(response);
  } catch (error) {
    console.error("Error matching images:", error.message);
    res.status(500).json({
      error: "Sorry, we could not match the images. Please try again later.",
    });
  }
};
exports.processDocument = async (req, res) => {
  const { applicantId, images } = req.body;
  if (!applicantId || !images[0] || !images[1]) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const session = await Applicant.findOne({ _id: applicantId });
    if (!session)
      return res.status(404).json({
        error:
          "The Applicant ID provided is invalid/ Already Used. Please start a new session.",
      });
    if (session.sessionUsed.processUsed) {
      return res.status(400).json({
        error:
          "This Applicant has already been used for document processing. Please create a new Applicant.",
      });
    }
    const api = new DocumentReaderApi({
      basePath: process.env.REGULA_DOC_API_URL,
    });
    const response = await api.process({
      images,
      processParam: { scenario: Scenario.FULL_PROCESS },
    });
    const fieldList = response.text?.fieldList;
    const ExpiryIndex = fieldList.findIndex(
      (field) => field.fieldName === "Date of Expiry"
    );
    const status = fieldList[ExpiryIndex]?.status;
    if (status === 1) {
      const documentResult = new DocumentResult({ applicantId, response });
      await documentResult.save();
      session.sessionUsed.processUsed = true;
      await session.save();
    }
    res.json(response);
  } catch (error) {
    console.error("Error processing document:", error.message);
    res.status(500).json({
      error:
        "Sorry, we could not process the document. Please try again later.",
    });
  }
};
exports.getDetails = async (req, res) => {
  const { id: applicantId } = req.params;
  if (!applicantId) {
    return res.status(400).json({ error: "Session ID not provided" });
  }
  try {
    const session = await Applicant.findOne({ _id: applicantId });
    if (!session) {
      return res.status(404).json({
        error: "The session ID provided is invalid or does not exist.",
      });
    }
    const faceResult = await FaceResult.findOne({ applicantId });
    const documentResult = await DocumentResult.findOne({ applicantId });
    const result = {
      Applicant: session,
      imageResponse: faceResult ? faceResult.response : null,
      documentResponse: documentResult ? documentResult.response : null,
    };
    res.json(result);
  } catch (error) {
    console.error("Error fetching session details:", error.message);
    res.status(500).json({
      error:
        "Sorry, we could not fetch session details. Please try again later.",
    });
  }
};
