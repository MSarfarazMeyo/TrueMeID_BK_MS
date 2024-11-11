const express = require("express");
const authController = require("../controllers/authController");
const authRouter = express.Router();
const Controller = new authController();

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminCredentials = await Controller.login(email, password);
    if (
      adminCredentials.email === email &&
      adminCredentials.password === password
    ) {
      return res.status(200).send({ message: "Login Successfully" });
    }
    const response = await Controller.login(email, password);

    return res.status(response.code || 200).send(response.data);
  } catch (error) {
    return res.status(error.code).send(error.error);
  }
});

authRouter.post("/login/verify", async (req, res) => {
  try {
    console.log("api hit");

    const { email, secret, token } = req.body;
    verifiedData = await Controller.verifyQrCode(email, secret, token);
    return res.status(verifiedData.code || 200).send(verifiedData);
  } catch (error) {
    console.warn(error);

    return res.status(error.code).send(error.error);
  }
});

authRouter.post("/signup", async (req, res) => {
  try {
    const adminCredentials = await Controller.signup(req, res);

    return res.status(200).send(adminCredentials);
  } catch (error) {
    return res.status(error.code).send(error.error);
  }
});

authRouter.get("/get-admin-credentials/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const response = await Controller.getAdminCredentials(email);
    return res.status(200).json(response);
  } catch (error) {
    return res.status(error.code).json(error);
  }
});

authRouter.patch("/update-admin/:email", async (req, res) => {
  try {
    const email = req.params.email;

    const response = await Controller.updateAdmin(req.body, email);

    return res.status(response.code || 200).send(response.data);
  } catch (error) {
    return res.status(error.code).send(error.error);
  }
});

module.exports = authRouter;
