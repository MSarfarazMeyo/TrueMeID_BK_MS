const express = require("express");
const verificationController = require("../controllers/verificationController");
const verifyAuth = require("../middlewares/requiredAuth");

const verificationRouter = express.Router();
const Controller = new verificationController();

verificationRouter.get("/get-review-status", verifyAuth, async (req, res) => {
  try {
    const { applicantId } = req.body;
    const response = await Controller.getApplicantReviewStatus(applicantId);

    return res.status(response.code).send(response.data);
  } catch (error) {
    return res.status(error.code).send(error);
  }
});
verificationRouter.get("/doc-status/:data", verifyAuth, async (req, res) => {
  try {
    const { data } = req.params;
    const { applicantId } = req.query;
    const response = await Controller.docVerificationStatus(applicantId, data);
    return res.status(response.code).send(response.data);
  } catch (error) {
    return res.status(error.code).send(error);
  }
});
//

verificationRouter.get("/rejection-reason", verifyAuth, async (req, res) => {
  try {
    const { applicantId } = req.body;
    const response = await Controller.getRejectionReason(applicantId);

    return res.status(response.code).send(response.data);
  } catch (error) {
    return res.status(error.code).send(error);
  }
});
// verificationRouter.get('/verification-steps/:applicantId',verifyAuth,async(req, res)=>{
//   try {

//       const {applicantId}= req.params
//       const response= await Controller.getVerificationStatus(applicantId)

//       return res.status(response.code).send(response.data)
//   } catch (error) {
//       return res.status(error.code).send(error)
//   }
// });
verificationRouter.get("/get-image", verifyAuth, async (req, res) => {
  try {
    const { inspectionId, imageId } = req.query;
    const response = await Controller.getImageDocument(inspectionId, imageId);

    return res.status(response.code).send(response.data);
  } catch (error) {
    return res.status(error.code).send(error);
  }
});

module.exports = verificationRouter;
