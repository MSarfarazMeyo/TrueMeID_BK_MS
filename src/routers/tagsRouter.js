const express = require("express");
const tagsController = require("../controllers/tagsController");
const verifyAuth = require("../middlewares/requiredAuth");

const tagsRouter = express.Router();
const Controller = new tagsController();
tagsRouter.post("/addTags", verifyAuth, async (req, res) => {
  try {
    const response = await Controller.addTags();
    return res.status(response.code).json(response.data);
  } catch (error) {
    console.error(error);
    return res.status(error.code).json(error.error);
  }
});
