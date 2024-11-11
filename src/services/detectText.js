const {
  RekognitionClient,
  DetectTextCommand,
} = require("@aws-sdk/client-rekognition");

const client = new RekognitionClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.ACCESSKEY,
    secretAccessKey: process.env.SECRETACCESSKEY,
  },
});

const params = {
  Image: {
    S3Object: {
      Bucket: "trumeid-uploads",
      Name: "id.jpeg",
    },
  },
};

const command = new DetectTextCommand(params);

client
  .send(command)
  .then((response) => {
    console.log("Detected Text:", JSON.stringify(response, null, 2));
    response.TextDetections.forEach((label) => {
      console.log(`Detected Text: ${label.DetectedText}`);
      console.log(`Type: ${label.Type}`);
      console.log(`ID: ${label.Id}`);

      if (label.ParentId !== undefined) {
        console.log(`Parent ID: ${label.ParentId}`);
      }

      console.log(`Confidence: ${label.Confidence}`);
      console.log(`Polygon:`);
      console.log(label.Geometry.Polygon);
    });
  })
  .catch((err) => {
    console.error("Error detecting text:", err);
  });
