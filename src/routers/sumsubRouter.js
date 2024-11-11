const express = require("express");
const sumsubController = require("../controllers/sumsubController");
const verifyAuth = require("../middlewares/requiredAuth");

const sumsubRouter = express.Router();
const Controller = new sumsubController();

sumsubRouter.post(
  "/createAccessToken/:externalUserId/:levelName",
  async (req, res) => {
    try {
      const externalUserId = req.params.externalUserId;
      const levelName = req.params.levelName;

      const response = await Controller.generateAccessToken(
        externalUserId,
        levelName
      );

      // const jsonResponse= JSON.stringify(response.data)
      return res.status(response.code).send(response.data);
    } catch (error) {
      return res.status(error.code).json(error.error);
    }
  }
);
sumsubRouter.post("/webhook", async (req, res) => {
  try {
    const response = await Controller.webhookUpdate(req.body);
    return res.status(response.code).send(response.data);
  } catch (error) {
    throw {
      code: error.code,
      error: error.error,
    };
  }
});

// sumsubRouter.post('/login', verifyAuth,async (req, res) => {
//   const { email, pass } = req.body;

//   if (email && pass) {
//     if (email === 'user@ignition-innovation.com' && pass === 'Password@1') {
//       res.status(200).json({
//         api_key: 'ythrn643ng6539ng7o3bf73k'
//       });
//     } else {
//       res.status(401).json({
//         message: 'Invalid Credentials'
//       });
//     }
//   } else {
//     res.status(400).json({
//       message: 'Incomplete Data set provided'
//     });
//   }
// });

sumsubRouter.post("/generate-sdk-link", verifyAuth, async (req, res) => {
  try {
    const { levelName, externalUserId } = req.body;
    const response = await Controller.generateSDKLink(
      levelName,
      externalUserId
    );
    res.status(response.code).send(response.data);
  } catch (error) {
    res.status(403).send(error);
  }
});

module.exports = {
  sumsubRouter,
};
