const express = require("express");
const applicantController = require("../controllers/applicantController");
const upload = require("../middlewares/multerConfig");
const verifyAuth = require("../middlewares/requiredAuth");
const useragent = require("useragent");

const applicantRouter = express.Router();
const Controller = new applicantController();

applicantRouter.post("/create-applicant", verifyAuth, async (req, res) => {
  try {
    const { name, userId } = req.body; // Expecting both name and userId in the request body
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const response = await Controller.createApplicant(name, userId);
    return res.status(response.code).json(response.data);
  } catch (error) {
    return res.status(error.code).json(error.error);
  }
});

applicantRouter.get("/get-all-applicants", verifyAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1; // Default to 1 if not provided
    const searchText = req.query.searchText || "";
    const response = await Controller.getApplicantData(
      userId,
      page,
      searchText
    );
    return res.status(response.code).json(response.data);
  } catch (error) {
    console.log(error);

    return res
      .status(error.code || 500)
      .json({ error: error.message || "An error occurred" });
  }
});

applicantRouter.get("/get-dashboard-data", verifyAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const response = await Controller.getDashboardData(userId);
    return res.status(response.code).json(response.data);
  } catch (error) {
    console.log(error);

    return res
      .status(error.code || 500)
      .json({ error: error.message || "An error occurred" });
  }
});

applicantRouter.get(
  "/get-applicant/:externalId",
  verifyAuth,
  async (req, res) => {
    try {
      const { externalId } = req.params;
      const response = await Controller.getApplicantData(externalId);
      return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      return res.status(error.code).json(error.error);
    }
  }
);

applicantRouter.post("/filter-applicants", verifyAuth, async (req, res) => {
  try {
    const page = req.query.page;
    const response = await Controller.filterApplicants(req.body, page);
    return res.status(response.code).json(response);
  } catch (error) {
    console.error(error);
    return res.status(error.code).json(error.error);
  }
});
applicantRouter.patch(
  "/update-event/:applicantId",
  verifyAuth,
  async (req, res) => {
    try {
      const applicantId = req.params.applicantId;

      const response = await Controller.updateApplicantEvents(
        applicantId,
        body
      );
      return res.status(response.code).json(response);
    } catch (error) {
      console.error(error);
      return res.status(error.code).json(error.error);
    }
  }
);
applicantRouter.get(
  "/:applicantId/get-events/:inspectionId",
  verifyAuth,
  async (req, res) => {
    try {
      const applicantId = req.params.applicantId;
      const inspectionId = req.params.inspectionId;
      const response = await Controller.getEvents(applicantId, inspectionId);
      return res.status(response.code).send(response.data);
    } catch (error) {
      return res.status(error.code).json(error.error);
    }
  }
);

applicantRouter.patch(
  "/change-applicant-info/:applicantId",
  verifyAuth,
  async (req, res) => {
    try {
      const applicantId = req.params.applicantId;
      const response = await Controller.changeApplicantInfo(
        applicantId,
        req.body
      );

      return res.status(response.code).send(response.data);
    } catch (error) {
      return res.status(error.code).send(error);
    }
  }
);

applicantRouter.post("/required-doc/:applicantId", async (req, res) => {
  try {
    const applicantId = req.params.applicantId;
    const response = await Controller.getRequiredDoc(applicantId);

    return res.status(response.code).send(response.data);
  } catch (error) {
    return res.status(error.code).send(error);
  }
});
applicantRouter.patch(
  "/top-level-info/:applicantId",
  verifyAuth,
  async (req, res) => {
    try {
      const applicantId = req.params.applicantId;
      const response = await Controller.changeTopLevelInfo(
        applicantId,
        req.body
      );

      return res.status(response.code).send(response.data);
    } catch (error) {
      return res.status(error.code).send(error);
    }
  }
);
applicantRouter.post(
  "/holdReviewStatus/:applicantId",
  verifyAuth,
  async (req, res) => {
    try {
      const { applicantId } = req.params;
      const response = await Controller.holdReviewstatus(applicantId);
      return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      return res.status(error.code).json(error.error);
    }
  }
);
applicantRouter.post(
  "/declineReviewStatus/:inspectionId",
  verifyAuth,
  async (req, res) => {
    try {
      const { inspectionId } = req.params;
      const response = await Controller.declineReviewStatus(
        inspectionId,
        req.body
      );
      return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      return res.status(error.code).json(error.error);
    }
  }
);
applicantRouter.post(
  "/approveReviewstatus/:externalId",
  verifyAuth,
  async (req, res) => {
    try {
      const externalId = req.params.externalId;
      const response = await Controller.approveReviewstatus(
        externalId,
        req.body
      );
      return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      return res.status(error.code).json(error.error);
    }
  }
);
applicantRouter.post(
  "/:externalId/id-doc-def/:imageId",
  verifyAuth,
  async (req, res) => {
    try {
      const externalId = req.params.externalId;
      const imageId = req.params.imageId;
      const response = await Controller.idDocDef(externalId, imageId, req.body);
      return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      return res.status(error.code).json(error.error);
    }
  }
);
applicantRouter.post(
  "/:externalId/face-match-with-selfie/:imageId",
  verifyAuth,
  async (req, res) => {
    try {
      const externalId = req.params.externalId;
      const imageId = req.params.imageId;
      const response = await Controller.compareSelfie(externalId, imageId);
      return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      return res.status(error.code).json(error.error);
    }
  }
);
applicantRouter.post(
  "/:externalId/modify-image/:imageId",
  verifyAuth,
  async (req, res) => {
    try {
      const externalId = req.params.externalId;
      const imageId = req.params.imageId;
      const response = await Controller.flipImage(
        externalId,
        imageId,
        req.body
      );
      return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      return res.status(error.code).json(error.error);
    }
  }
);
applicantRouter.get("/get-images/:externalId", verifyAuth, async (req, res) => {
  try {
    const externalId = req.params.externalId;
    const response = await Controller.getImages(externalId);
    return res.status(200).json(response);
  } catch (error) {
    return res.status(error.code).json(error.error);
  }
});
applicantRouter.get(
  "/get-duplicates/:applicantId",
  verifyAuth,
  async (req, res) => {
    try {
      const applicantId = req.params.applicantId;
      const response = await Controller.getDuplicateApplicants(applicantId);
      return res.status(200).json(response);
    } catch (error) {
      return res.status(error.code).json(error.error);
    }
  }
);
applicantRouter.get("/verification-steps/:externalUserId", async (req, res) => {
  try {
    const { externalUserId } = req.params;
    const response = await Controller.getVerificationStatus(externalUserId);

    return res.status(response.code).send(response.data);
  } catch (error) {
    return res.status(error.code).send(error);
  }
});
applicantRouter.post(
  "/applicant-level/:applicantId",
  verifyAuth,
  async (req, res) => {
    try {
      const applicantId = req.params.applicantId;
      const { name } = req.body;

      const response = await Controller.changeApplicantLevel(applicantId, name);

      return res.status(response.code).send(response.data);
    } catch (error) {
      return res.status(error.code).send(error);
    }
  }
);
applicantRouter.post(
  "/risk-level/:applicantId",
  verifyAuth,
  async (req, res) => {
    try {
      const applicantId = req.params.applicantId;
      const response = await Controller.addRiskLevel(applicantId, req.body);

      return res.status(response.code).send(response.data);
    } catch (error) {
      return res.status(error.code).send(error);
    }
  }
);
applicantRouter.get(
  "/risk-level/:applicantId",
  verifyAuth,
  async (req, res) => {
    try {
      const applicantId = req.params.applicantId;
      const response = await Controller.getRiskLevel(applicantId);
      return res.status(response.code).send(response.data);
    } catch (error) {
      return res.status(error.code).send(error);
    }
  }
);

applicantRouter.post(
  "/reset-verification/:applicantId",
  verifyAuth,
  async (req, res) => {
    try {
      const applicantId = req.params.applicantId;
      const { idDocSetType } = req.body;
      const response = await Controller.resetVerification(
        applicantId,
        idDocSetType
      );

      return res.status(response.code).send(response.data);
    } catch (error) {
      return res.status(error.code).send(error);
    }
  }
);

applicantRouter.post(
  "/reset-profile/:applicantId",
  verifyAuth,
  async (req, res) => {
    try {
      const applicantId = req.params.applicantId;
      const response = await Controller.resetCompleteProfile(applicantId);

      return res.status(response.code).send(response.data);
    } catch (error) {
      return res.status(error.code).send(error);
    }
  }
);

applicantRouter.patch(
  "/activation-switch/:applicantId",
  verifyAuth,
  async (req, res) => {
    try {
      const applicantId = req.params.applicantId;
      const { status } = req.body;
      const response = await Controller.profileActivationSwitch(
        applicantId,
        status
      );

      return res.status(response.code).send(response.data);
    } catch (error) {
      return res.status(error.code).send(error);
    }
  }
);

applicantRouter.post(
  "/profile/review-applicant/:applicantId",
  async (req, res) => {
    try {
      const applicantId = req.params.applicantId;
      const response = await Controller.reviewApplicantSandbox(
        applicantId,
        req.body
      );

      return res.status(response.code).send(response.data);
    } catch (error) {
      return res.status(error.code).send(error);
    }
  }
);
applicantRouter.post(
  "/profile/request-check/:applicantId",
  verifyAuth,
  async (req, res) => {
    try {
      const applicantId = req.params.applicantId;
      const response = await Controller.requestApplicantCheck(
        applicantId,
        req.body
      );

      return res.status(response.code).send(response.data);
    } catch (error) {
      return res.status(error.code).send(error);
    }
  }
);
applicantRouter.post(
  "/add-id-docs/:applicantId",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("file not found");
      }
      const { metadata } = req.body;
      const { warning } = req.headers;

      const applicantId = req.params.applicantId;

      const response = await Controller.addIdDocuments(
        applicantId,
        metadata,
        req.file,
        warning
      );

      return res.status(response.code).send(response.data);
    } catch (error) {
      return res.status(error.code).send(error);
    }
  }
);
applicantRouter.post(
  "/add-id-doc/:applicantId",
  verifyAuth,
  async (req, res) => {
    try {
      const { warning } = req.headers;
      const applicantId = req.params.applicantId;
      const response = await Controller.addIdDocument(
        applicantId,
        req.body,
        warning
      );

      return res.status(response.code).send(response.data);
    } catch (error) {
      return res.status(error.code).send(error);
    }
  }
);

applicantRouter.post(
  "/delete-id-docs/:applicantId",
  verifyAuth,
  async (req, res) => {
    try {
      const applicantId = req.params.applicantId;
      const response = await Controller.deleteIdDocuments(
        applicantId,
        req.body
      );
      return res.status(response.code).send(response.data);
    } catch (error) {
      return res.status(error.code).send(error);
    }
  }
);
applicantRouter.delete(
  "/:imageId/reset-revert/:inspectionId",
  // verifyAuth,
  async (req, res) => {
    try {
      const inspectionId = req.params.inspectionId;
      const imageId = req.params.imageId;
      const response = await Controller.resetRevertImage(
        inspectionId,
        imageId,
        req.query
      );

      return res.status(response.code).send(response.data);
    } catch (error) {
      return res.status(error.code).send(error);
    }
  }
);

applicantRouter.get("/fetch-images/:externalId", async (req, res) => {
  try {
    const externalId = req.params.externalId;
    const response = await Controller.fetchImages(externalId);
    return res.status(response.code).send(response.data);
  } catch (error) {
    return res.status(error.code || 403).send(error || "internal server error");
  }
});
applicantRouter.patch(
  "/update-info/:applicantId",
  verifyAuth,
  async (req, res) => {
    try {
      const applicantId = req.params.applicantId;
      const response = await Controller.updateApplicantInfo(
        applicantId,
        req.body
      );
      return res.status(response.code).send(response.data);
    } catch (error) {
      return res
        .status(error.code || 403)
        .send(error || "internal server error");
    }
  }
);
applicantRouter.get(
  "/get-check-data/:applicantId",
  verifyAuth,
  async (req, res) => {
    try {
      const applicantId = req.params.applicantId;
      const response = await Controller.getApplicantCheckData(applicantId);
      return res.status(response.code).send(response.data);
    } catch (error) {
      return res
        .status(error.code || 403)
        .send(error || "internal server error");
    }
  }
);

applicantRouter.get("/get-levels", verifyAuth, async (req, res) => {
  try {
    const applicantId = req.params.applicantId;
    const response = await Controller.getApplicantLevels();
    return res.status(response.code).send(response.data);
  } catch (error) {
    return res.status(error.code || 403).send(error || "internal server error");
  }
});

applicantRouter.get("/get-imageid", async (req, res) => {
  try {
    const { inspectionId, imageId } = req.query;
    const response = await Controller.getImageId(inspectionId, imageId);

    return res.status(response.code).send(response.data);
  } catch (error) {
    return res.status(error.code).send(error);
  }
});
applicantRouter.get("/summary/:applicantId", async (req, res) => {
  try {
    const applicantId = req.params.applicantId;
    const response = await Controller.getSummary(applicantId);
    return res.status(response.code).json(response.data);
  } catch (error) {
    return res.status(error.code).json(error.error);
  }
});

module.exports = applicantRouter;
