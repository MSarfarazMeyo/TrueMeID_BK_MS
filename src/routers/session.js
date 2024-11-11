const express = require("express");
const verifyAuth = require("../middlewares/requiredAuth");
const sessionController = require("../controllers/sessionController");

const controller = new sessionController();
let sessionRouter = express.Router();

sessionRouter.get("/", verifyAuth, async (req, res) => {
  try {
    let matchUser = await controller.getSessionInfo(req);

    return res.status(200).send(matchUser);
  } catch (err) {
    return res.status(404).send(err.message);
  }
});

module.exports = sessionRouter;
