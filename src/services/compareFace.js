const {
  RekognitionClient,
  CompareFacesCommand,
} = require("@aws-sdk/client-rekognition");
const sharp = require("sharp");

const client = new RekognitionClient({
  region: process.env.REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.ACCESSKEY,
    secretAccessKey: process.env.SECRETACCESSKEY,
  },
});

const compareFaces = async (req, res) => {
  const sourceImage = req.body.sourceImage;
  const targetImage = req.body.targetImage;

  try {
    let sourceImageParams, targetImageParams;

    sourceImageParams = await handleImageInput(sourceImage, "source");

    targetImageParams = await handleImageInput(targetImage, "target");

    const params = {
      SourceImage: sourceImageParams,
      TargetImage: targetImageParams,
      SimilarityThreshold: 80,
      QualityFilter: "AUTO",
    };

    const command = new CompareFacesCommand(params);
    const response = await client.send(command);

    let result = {};
    if (response.FaceMatches.length > 0) {
      response.FaceMatches.forEach((match) => {
        result.matchFound = true;
        result.similarity = match.Similarity.toFixed(2);
        result.faceDetails = match.Face;
      });
    } else {
      result.matchFound = false;
    }

    if (response.UnmatchedFaces.length > 0) {
      result.unmatchedFaces = response.UnmatchedFaces;
    }

    res.json({
      message: "Face comparison complete",
      result,
    });
  } catch (error) {
    console.error("Error comparing faces:", error.message);
    res.status(500).json({
      message: "Error comparing faces",
      error: error.message,
    });
  }
};

const handleImageInput = async (imageInput, type) => {
  if (typeof imageInput === "string" && imageInput.startsWith("data:image/")) {
    return await handleBase64Image(imageInput, type);
  } else if (typeof imageInput === "string") {
    return {
      S3Object: {
        Bucket: "trumeid-uploads",
        Name: imageInput,
      },
    };
  } else {
    console.error(`Invalid ${type} image input`);
    throw new Error(`Invalid ${type} image input`);
  }
};

const handleBase64Image = async (base64Image, type) => {
  let imageBuffer;
  if (base64Image.startsWith("data:image/webp;base64,")) {
    const webpImage = base64Image.split(",")[1];
    imageBuffer = Buffer.from(webpImage, "base64");

    imageBuffer = await sharp(imageBuffer).jpeg().toBuffer();
  } else if (base64Image.startsWith("data:image/png;base64,")) {
    const pngImage = base64Image.split(",")[1];
    imageBuffer = Buffer.from(pngImage, "base64");

    imageBuffer = await sharp(imageBuffer).jpeg().toBuffer();
  } else if (base64Image.startsWith("data:image/jpeg;base64,")) {
    const jpegImage = base64Image.split(",")[1];
    imageBuffer = Buffer.from(jpegImage, "base64");
  } else {
    console.error(`Invalid ${type} image format`);
    throw new Error(`Invalid ${type} image format`);
  }

  return { Bytes: imageBuffer };
};

module.exports = compareFaces;
