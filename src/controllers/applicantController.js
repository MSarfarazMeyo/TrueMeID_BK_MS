const { default: axios } = require("axios");
const signRequest = require("../utils/signRequest");
const Applicant = require("../model/applicantModel");
const fs = require("fs");
const SUMSUB_BASE_URL = process.env.SUMSUB_BASE_URL || "https://api.sumsub.com";
const Sumsub = require("../utils/sumsub");
const RiskLevel = require("../model/risk");
const Image = require("../model/imageData");
const User = require("../model/user");

class applicantController {
  async createApplicant(name, userId) {
    try {
      const user = await User.findById(userId); // Assuming you have a User model and `findById` method
      if (!user) {
        throw { code: 404, error: "User not found" };
      }
      const applicant = await Applicant.create({
        name,
        sessionUsed: { processUsed: false, matchImagesUsed: false },
        userId, // Linking the applicant with the user
      });

      // Return the entire applicant document after creation
      return {
        code: 200,
        data: applicant,
      };
    } catch (error) {
      throw {
        code: 404,
        error: error.message,
      };
    }
  }

  async getApplicantData(externalId) {
    try {
      const uri = `/resources/applicants/-;externalUserId=${externalId}/one`;
      const headers = signRequest(uri, "GET");

      const response = await axios({
        method: "GET",
        url: `${SUMSUB_BASE_URL}${uri}`,
        headers: headers,
      });

      return response.data;
    } catch (error) {
      throw {
        code: 404,
        error: error,
      };
    }
  }

  async getDuplicateApplicants(applicantId) {
    try {
      const uri = `/resources/applicants/${applicantId}/similarApplicants?onlyByText=false`;
      const headers = signRequest(uri, "GET");

      const response = await axios({
        method: "GET",
        url: `${SUMSUB_BASE_URL}${uri}`,
        headers: headers,
      });

      return response.data;
    } catch (error) {
      throw {
        code: 404,
        error: error,
      };
    }
  }
  async getImages(externalId) {
    try {
      const applicantData = await Sumsub.getApplicant(externalId);
      const inspectionId = applicantData.inspectionId;
      const uri = `/resources/inspections/${inspectionId}`;
      const headers = signRequest(uri, "GET");

      const response = await axios({
        method: "GET",
        url: `${SUMSUB_BASE_URL}${uri}`,
        headers: headers,
      });
      const faceMatchChecks = response.data.checks.filter(
        (item) => item.checkType === "FACE_MATCH"
      );
      const livenessChecks = response.data.checks.filter(
        (item) => item.checkType === "FACE_LIVELINESS"
      );
      const faceMatchIds = faceMatchChecks
        .flatMap((item) => item.imageIds)
        .filter(Boolean);
      const livenessCheckIds = livenessChecks
        .flatMap((item) =>
          item.livenessInfo.livenessData.images.map((image) => image.imageId)
        )
        .filter(Boolean);
      const faceMatchIdsPromise = faceMatchIds.map((imageId) =>
        Sumsub.getImage(imageId, inspectionId)
      );
      const livenessCheckIdsPromise = livenessCheckIds.map((imageId) =>
        Sumsub.getImage(imageId, inspectionId)
      );
      const imageIds = response.data.images.map((item) => item.imageId);
      const imagePromises = imageIds.map((imageId) =>
        Sumsub.getImage(imageId, inspectionId)
      );
      const [faceMatchImages, livenessCheckImages, images] = await Promise.all([
        Promise.all(faceMatchIdsPromise),
        Promise.all(livenessCheckIdsPromise),
        Promise.all(imagePromises),
      ]);
      const mappedImages = response.data.images.map((item, index) => ({
        ...item,
        image: images[index],
      }));
      const mappedFaceMatchChecks = faceMatchChecks.map((item, index) => ({
        ...item,
        image: faceMatchImages.slice(
          index * item.imageIds.length,
          (index + 1) * item.imageIds.length
        ),
      }));
      const mappedLivenessChecks = livenessChecks.map((item, index) => ({
        ...item,
        livenessInfo: {
          ...item.livenessInfo,
          livenessData: {
            ...item.livenessInfo.livenessData,
            images: item.livenessInfo.livenessData.images.map(
              (imageData, imgIndex) => ({
                ...imageData,
                image: livenessCheckImages[imgIndex],
              })
            ),
          },
        },
      }));

      const result = {
        images: mappedImages,
        checks: {
          faceMatch: mappedFaceMatchChecks,
          liveness: mappedLivenessChecks,
        },
      };
      return result;
    } catch (error) {
      throw {
        code: 404,
        error: error,
      };
    }
  }
  async holdReviewstatus(applicantId) {
    try {
      const uri = `/resources/applicants/${applicantId}/review/status/onHold`;

      const headers = signRequest(uri, "POST", null);
      const option = {
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      };
      const result = await axios({
        method: "POST",
        url: `${SUMSUB_BASE_URL}${uri}`,
        data: null,
        headers: option.headers,
      });
      return {
        code: 200,
        data: result.data,
      };
    } catch (error) {
      throw {
        code: 403,
        error: error,
      };
    }
  }
  async declineReviewStatus(inspectionId, body) {
    const data = JSON.stringify({
      clientComment: body.clientComment,
      moderationComment: body.moderationComment,
      rejectLabels: body.rejectLabels,
      reviewAnswer: body.reviewAnswer,
      reviewRejectType: body.reviewRejectType,
    });
    try {
      const uri = `/resources/inspections/${inspectionId}/reviews/complete`;

      const headers = signRequest(uri, "POST", data);
      const option = {
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      };
      const result = await axios({
        method: "POST",
        url: `${SUMSUB_BASE_URL}${uri}`,
        data: data,
        headers: option.headers,
      });
      return {
        code: 200,
        data: result.data,
      };
    } catch (error) {
      throw {
        code: 403,
        error: error,
      };
    }
  }
  async approveReviewstatus(externalId, body) {
    try {
      const applicantData = await Sumsub.getApplicant(externalId);
      const inspectionId = applicantData.inspectionId;
      const uri = `/resources/inspections/${inspectionId}/reviews/complete`;
      const data = JSON.stringify({
        clientComment: body.clientComment,
        moderationComment: body.moderationComment,
        rejectLabels: body.rejectLabels,
        reviewAnswer: body.reviewAnswer,
        reviewRejectType: body.reviewRejectType,
      });
      const headers = signRequest(uri, "POST", data);
      const option = {
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      };
      const result = await axios({
        method: "POST",
        url: `${SUMSUB_BASE_URL}${uri}`,
        data: data,
        headers: option.headers,
      });
      return {
        code: 200,
        data: result.data,
      };
    } catch (error) {
      throw {
        code: 403,
        error: error,
      };
    }
  }
  async idDocDef(externalId, imageId, body) {
    try {
      const applicantData = await Sumsub.getApplicant(externalId);
      const inspectionId = applicantData.inspectionId;
      const uri = `/resources/inspections/${inspectionId}/idDocDef/${imageId}`;
      const data = JSON.stringify({
        country: body.country,
        idDocSubType: body.idDocSubType,
        idDocType: body.idDocType,
      });
      const headers = signRequest(uri, "POST", data);
      const option = {
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      };
      const result = await axios({
        method: "POST",
        url: `${SUMSUB_BASE_URL}${uri}`,
        data: data,
        headers: option.headers,
      });
      return {
        code: 200,
        data: result.data,
      };
    } catch (error) {
      throw {
        code: 404,
        error: error,
      };
    }
  }
  async compareSelfie(externalId, imageId) {
    try {
      const applicantData = await Sumsub.getApplicant(externalId);
      const inspectionId = applicantData.inspectionId;
      const uri = `/resources/inspections/${inspectionId}/faceMatchWithSelfie/${imageId}`;
      const headers = signRequest(uri, "POST", null);
      const option = {
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      };
      const result = await axios({
        method: "POST",
        url: `${SUMSUB_BASE_URL}${uri}`,
        data: null,
        headers: option.headers,
      });
      return {
        code: 200,
        data: result.data,
      };
    } catch (error) {
      throw {
        code: 404,
        error: error,
      };
    }
  }
  async flipImage(externalId, imageId, body) {
    try {
      const applicantData = await Sumsub.getApplicant(externalId);
      const inspectionId = applicantData.inspectionId;
      const uri = `/resources/inspections/${inspectionId}/resources/${imageId}/modifyImage`;
      const data = JSON.stringify({
        modificationType: body.modificationType,
        rotationDegree: body.rotationDegree,
      });
      const headers = signRequest(uri, "POST", data);
      const option = {
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      };
      const result = await axios({
        method: "POST",
        url: `${SUMSUB_BASE_URL}${uri}`,
        data: data,
        headers: option.headers,
      });
      return {
        code: 200,
        data: result.data,
      };
    } catch (error) {
      throw {
        code: 404,
        error: error,
      };
    }
  }
  // async updateApplicants(body) {
  //   try {
  //     const applicants = await Applicant.aggregate([
  //     {
  //       $match: {
  //         review: { $exists: true, $ne: null }
  //       }
  //     },
  //     {
  //       $project: {
  //         "review.levelName": 1,
  //         "review.reviewStatus": 1,
  //         "review.reviewResult.reviewAnswer": 1
  //       }
  //     },
  //     {
  //       $group: {
  //         _id: "$review.reviewStatus",
  //         count: { $sum: 1 }
  //       }
  //     }
  //   ]);
  //   const statusCounts = {
  //     totalCount: 0,
  //     RED: 0,
  //     GREEN: 0,
  //     pending: 0,
  //     init: 0,
  //     onHold: 0,
  //     completed: 0
  //   };

  //   applicants.forEach(status => {
  //     switch (status._id) {
  //       case 'RED':
  //         statusCounts.RED = status.count;
  //         break;
  //       case 'GREEN':
  //         statusCounts.GREEN = status.count;
  //         break;
  //       case 'pending':
  //         statusCounts.pending = status.count;
  //         break;
  //       case 'init':
  //         statusCounts.init = status.count;
  //         break;
  //       case 'onHold':
  //         statusCounts.onHold = status.count;
  //         break;
  //       case 'completed':
  //         statusCounts.completed = status.count;
  //         break;
  //       default:
  //         break;
  //     }
  //     statusCounts.totalCount += status.count;
  //   });

  //   return {
  //     code: 200,
  //     data: statusCounts,
  //   };
  // } catch (error) {
  //   throw {
  //     code: 404,
  //     error: error,
  //   };
  // }
  // }

  async updateApplicants(body) {
    try {
      const uri = `/resources/applicants/-;type=individual%2C/withStatuses?offset=0&limit=1000&order=-review.createDate`;
      const headers = signRequest(uri, "GET");
      const response = await axios({
        method: "GET",
        url: `${SUMSUB_BASE_URL}${uri}`,
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      });

      const applicants = response.data.list.items;

      const statusCounts = {
        totalCount: 0,
        RED: 0,
        GREEN: 0,
        pending: 0,
        init: 0,
        onHold: 0,
        completed: 0,
      };
      applicants.forEach((applicant) => {
        const reviewStatus = applicant.applicant.review?.reviewStatus;
        const reviewAnswer =
          applicant.applicant.review?.reviewResult?.reviewAnswer;

        if (reviewStatus) {
          switch (reviewStatus) {
            case "pending":
              statusCounts.pending += 1;
              break;
            case "init":
              statusCounts.init += 1;
              break;
            case "onHold":
              statusCounts.onHold += 1;
              break;
            case "completed":
              statusCounts.completed += 1;
              if (reviewAnswer === "RED") {
                statusCounts.RED += 1;
              } else if (reviewAnswer === "GREEN") {
                statusCounts.GREEN += 1;
              }
              break;
            default:
              break;
          }
          statusCounts.totalCount += 1;
        }
      });

      return {
        code: 200,
        data: statusCounts,
      };
    } catch (error) {
      return {
        code: 404,
        error: error.message,
      };
    }
  }

  async filterApplicants(body, page) {
    const limit = 10;
    const skip = (page - 1) * limit;
    let matchStage = {};

    if (body.search) {
      const globalSearch = body.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      matchStage.$or = [
        { "applicant.externalUserId": { $regex: globalSearch, $options: "i" } },
        { "applicant.applicantId": { $regex: globalSearch, $options: "i" } },
        { "applicant.info.firstName": { $regex: globalSearch, $options: "i" } },
        { "applicant.info.lastName": { $regex: globalSearch, $options: "i" } },
        {
          "applicant.requiredIdDocs.docType": {
            $regex: globalSearch,
            $options: "i",
          },
        },
        {
          "applicant.review.reviewStatus": {
            $regex: globalSearch,
            $options: "i",
          },
        },
        {
          "applicant.review.levelName": { $regex: globalSearch, $options: "i" },
        },
      ];
    }

    if (body.level && body.level !== "All") {
      matchStage["applicant.review.levelName"] = body.level;
    }

    if (body.status && body.status !== "All") {
      matchStage["applicant.review.reviewStatus"] = body.status;
    }

    if (body.document && body.document !== "All") {
      matchStage["applicant.requiredIdDocs.docType"] = {
        $regex: body.document,
        $options: "i",
      };
    }

    if (body.date) {
      matchStage["applicant.createdAt"] = { $regex: body.date, $options: "i" };
    }
    if (body.completeStatus && body.completeStatus !== "All") {
      if (body.completeStatus === "Accepted") {
        matchStage["applicant.review.reviewResult.reviewAnswer"] = "GREEN";
      } else if (body.completeStatus === "Rejected") {
        matchStage["applicant.review.reviewResult.reviewAnswer"] = "RED";
      }
    }
    try {
      const uri = `/resources/applicants/-;type=individual%2C/withStatuses?offset=0&limit=1000&order=-review.createDate`;
      const headers = signRequest(uri, "GET");
      const response = await axios({
        method: "GET",
        url: `${SUMSUB_BASE_URL}${uri}`,
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      });
      const allApplicants = response.data.list.items;
      const filteredApplicants = allApplicants.filter((applicant) => {
        let match = true;
        if (matchStage.$or) {
          match = matchStage.$or.some((condition) => {
            return Object.keys(condition).some((key) => {
              const regex = condition[key].$regex;
              const options = condition[key].$options;
              return new RegExp(regex, options).test(
                applicant.applicant[key.split(".").pop()]
              );
            });
          });
        }
        if (matchStage["applicant.review.levelName"]) {
          match =
            match &&
            applicant.applicant.review?.levelName ===
              matchStage["applicant.review.levelName"];
        }
        if (matchStage["applicant.review.reviewStatus"]) {
          match =
            match &&
            applicant.applicant.review?.reviewStatus ===
              matchStage["applicant.review.reviewStatus"];
        }
        if (matchStage["applicant.requiredIdDocs.docType"]) {
          match =
            match &&
            applicant.applicant.requiredIdDocs?.docSets?.some((doc) =>
              new RegExp(
                matchStage["applicant.requiredIdDocs.docType"].$regex,
                matchStage["applicant.requiredIdDocs.docType"].$options
              ).test(doc.docType)
            );
        }
        if (matchStage["applicant.createdAt"]) {
          match =
            match &&
            new RegExp(
              matchStage["applicant.createdAt"].$regex,
              matchStage["applicant.createdAt"].$options
            ).test(applicant.applicant.createdAt);
        }
        if (body.completeStatus !== "All") {
          const reviewAnswer =
            applicant.applicant.review?.reviewResult?.reviewAnswer;
          if (body.completeStatus === "Accepted") {
            match = match && reviewAnswer === "GREEN";
          } else if (body.completeStatus === "Rejected") {
            match = match && reviewAnswer === "RED";
          }
        }
        return match;
      });
      const totalCount = allApplicants.length;
      const totalPages = Math.ceil(filteredApplicants.length / limit);
      const paginatedApplicants = filteredApplicants.slice(skip, skip + limit);
      const data = paginatedApplicants.map((obj) => {
        const currentDate = new Date();
        const reviewCreateDate = obj.applicant.review?.createDate
          ? new Date(obj.applicant.review.createDate)
          : null;
        const formatDateDifference = (date) => {
          if (!date) return "";
          const diffTime = Math.abs(currentDate - date);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const diffMonths = Math.floor(diffDays / 30);
          const diffYears = Math.floor(diffDays / 365);
          if (diffDays < 30) {
            return `(${diffDays - 1} day${diffDays > 1 ? "s" : ""})`;
          } else if (diffMonths < 12) {
            return `(${diffMonths} month${diffMonths > 1 ? "s" : ""})`;
          } else {
            return `(${diffYears} year${diffYears > 1 ? "s" : ""})`;
          }
        };
        return {
          id: obj.applicant.id,
          externalId: obj.applicant.externalUserId,
          name: obj.applicant.info?.firstName,
          date: obj.applicant.createdAt
            ? new Date(obj.applicant.createdAt).toLocaleDateString()
            : "Invalid Date",
          time: reviewCreateDate
            ? `${formatDateDifference(reviewCreateDate)}`
            : "",
          document:
            obj.applicant.requiredIdDocs.docSets
              .map((doc) => doc.idDocSetType)
              .join(", ") || "No Documents",
          level: obj.applicant.review?.levelName,
          status:
            obj.applicant.review?.reviewStatus === "completed"
              ? obj.applicant.review?.reviewResult?.reviewAnswer === "RED"
                ? "Complete: Rejected"
                : "Complete: Accepted"
              : obj.applicant.review?.reviewStatus,
          tags: obj.applicant.tags ? obj.applicant.tags.join(", ") : "",
          deleted: obj.applicant.deleted || null,
        };
      });
      const finalData = data.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      return {
        code: 200,
        totalPages: totalPages,
        totalCount: totalCount,
        data: finalData,
      };
    } catch (error) {
      return {
        code: 400,
        error: error.message,
      };
    }
  }

  async updateApplicantEvents(applicantId, body) {
    try {
      const response = await Sumsub.updateEvent(applicantId, body);

      return {
        code: response.code,
        data: response.data,
      };
    } catch (error) {
      throw {
        code: 404,
        error: error,
      };
    }
  }
  // async getEvents(applicantId) {
  //   try {
  //     const findApplicant = await Applicant.findOne({ applicantId });
  //     const events = findApplicant.events;
  //     const externalId=findApplicant.externalUserId;
  //     const applicantData = await Sumsub.getApplicant(externalId);
  //     const inspectionId = applicantData.inspectionId;
  //     const imagePromises = events.filter(event => event.imageId).map(async (event) => {
  //           const image =await Sumsub.getImage(event.imageId, inspectionId);
  //           event.imageBase64 = image
  //       }
  //   );await Promise.all(imagePromises);
  //   return { code: 200, data: events };
  //   } catch (error) {
  //     throw {
  //       code: 403,
  //       error: error,
  //     };
  //   }
  // }
  async getVerificationStatus(externalId) {
    try {
      const applicantData = await Sumsub.getApplicant(externalId);
      const inspectionId = applicantData.inspectionId;
      const applicantId = applicantData.id;
      const response = await Sumsub.getDocVerificationStatus(applicantId);
      return {
        code: 200,
        data: response,
      };
    } catch (error) {
      throw {
        code: error.code,
        errro: error.error,
      };
    }
  }

  async changeApplicantInfo(applicantId, body) {
    try {
      const uri = `/resources/applicants/${applicantId}/info`;

      const data = JSON.stringify(body);
      const headers = await signRequest(uri, "PATCH", data);
      const response = await axios({
        method: "PATCH",
        url: `${SUMSUB_BASE_URL}${uri}`,
        data,
        headers: {
          "content-type": "application/json",
          ...headers,
        },
      });
      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        code: 401,
        errro: error,
      };
    }
  }

  async getRequiredDoc(applicantId) {
    try {
      const uri = `/resources/applicants/${applicantId}/requiredIdDocs`;

      const headers = signRequest(uri, "POST", null);
      const option = {
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      };
      const result = await axios({
        method: "POST",
        url: `${SUMSUB_BASE_URL}${uri}`,
        data: null,
        headers: option.headers,
      });
      return {
        code: 200,
        data: result.data,
      };
    } catch (error) {
      throw {
        code: 403,
        error: error,
      };
    }
  }
  async addRiskLevel(applicantId, body) {
    try {
      const uri = `/resources/applicants/${applicantId}/riskLevel/entries`;
      const data = JSON.stringify({
        comment: body.comment,
        riskLevel: body.level,
      });

      const headers = signRequest(uri, "POST", data);
      const option = {
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      };
      const response = await axios.post(
        `${SUMSUB_BASE_URL}${uri}`,
        data,
        option
      );
      const findExistingList = await RiskLevel.findOne({ applicantId });

      if (!findExistingList) {
        const newRiskLevel = new RiskLevel({
          applicantId: applicantId,
        });
        newRiskLevel.riskLevel.push({
          comment: body.comment,
          level: body.level,
        });
        newRiskLevel.save();
      } else {
        findExistingList.riskLevel.push({
          comment: body.comment,
          level: body.level,
        });
        findExistingList.save();
      }

      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        code: 403,
        errro: error,
      };
    }
  }
  async getRiskLevel(applicantId) {
    try {
      const getRiskLevel = await RiskLevel.findOne({ applicantId });
      if (!getRiskLevel) {
        return {
          code: 200,
          data: [],
        };
      }
      return {
        code: 200,
        data: getRiskLevel.riskLevel,
      };
    } catch (error) {
      throw {
        code: 403,
        error: error,
      };
    }
  }
  async changeTopLevelInfo(applicantId, body) {
    try {
      const uri = `/resources/applicants`;
      const data = JSON.stringify({
        id: applicantId,
        ...body,
      });
      const headers = signRequest(uri, "PATCH", data);
      const option = {
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      };
      // const response= await axios.patch(`${SUMSUB_BASE_URL}${uri}`,data, option)
      const response = await axios({
        method: "PATCH",
        url: `${SUMSUB_BASE_URL}${uri}`,
        data: data,
        headers: {
          "content-type": "application/json",
          ...headers,
        },
      });

      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        code: 400,
        errro: error,
      };
    }
  }

  async resetCompleteProfile(applicantId) {
    try {
      const uri = `/resources/applicants/${applicantId}/reset`;
      const headers = signRequest(uri, "POST");
      const response = await axios({
        method: "POST",
        url: `${SUMSUB_BASE_URL}${uri}`,
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      });

      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        code: 400,
        error: error,
      };
    }
  }
  async profileActivationSwitch(applicantId, status) {
    try {
      const uri = `/resources/applicants/${applicantId}/presence/${status}`;

      const headers = signRequest(uri, "PATCH");
      const response = await axios({
        method: "PATCH",
        url: `${SUMSUB_BASE_URL}${uri}`,
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      });

      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        code: 400,
        error: error,
      };
    }
  }
  async changeApplicantLevel(applicantId, name) {
    try {
      const uri = `/resources/applicants/${applicantId}/moveToLevel?name=${encodeURIComponent(
        name
      )}`;

      const headers = signRequest(uri, "POST");
      const response = await axios({
        method: "POST",
        url: `${SUMSUB_BASE_URL}${uri}`,
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      });
      response.data;
      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        code: 400,
        error: error,
      };
    }
  }

  async resetVerification(applicantId, idDocSetType) {
    try {
      const uri = `/resources/applicants/${applicantId}/resetStep/${idDocSetType}`;

      const headers = signRequest(uri, "POST");
      const response = await axios({
        method: "POST",
        url: `${SUMSUB_BASE_URL}${uri}`,
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      });

      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        code: 400,
        error: error,
      };
    }
  }
  async reviewApplicantSandbox(applicantId, body) {
    try {
      const uri = `/resources/applicants/${applicantId}/status/testCompleted`;
      const data = JSON.stringify({
        ...body,
      });
      const headers = signRequest(uri, "POST", data);
      const response = await axios({
        method: "POST",
        url: `${SUMSUB_BASE_URL}${uri}`,
        data: data,
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      });

      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        code: 400,
        error: error,
      };
    }
  }
  async requestApplicantCheck(applicantId, body) {
    try {
      const uri = `/resources/applicants/${applicantId}/status/pending?reason=${body.reason}`;
      const data = {
        ...body,
      };
      const headers = signRequest(uri, "POST", data);
      const response = await axios({
        method: "POST",
        url: `${SUMSUB_BASE_URL}${uri}`,
        data,
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      });

      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        code: 400,
        error: error,
      };
    }
  }
  async addIdDocuments(applicantId, data, fileData, warning) {
    try {
      const uri = `/resources/applicants/${applicantId}/info/idDoc?detectTypeAndCountry=false`;
      const fileContent = fs.readFileSync(fileData.path, "base64");
      const payload = {
        metadata: data,
        content: fileContent,
      };
      const headers = signRequest(uri, "POST", payload);
      const response = await axios.post(`${SUMSUB_BASE_URL}${uri}`, payload, {
        headers: {
          "content-type": "multipart/form-data",
          "X-Return-Doc-Warnings": warning,
          ...headers,
        },
      });
      const image = new Image({
        ImageId: response.data.id,
        applicantId,
        country: metadata.country,
        type: metadata.type,
        imageBase64: fileData,
      });
      await image.save();

      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        code: 400,
        error: error,
      };
    }
  }
  async addIdDocument(applicantId, data, warning) {
    try {
      const queryString = "unsetFields=bgCheckViolations,uncertainFields";
      const uri = `/resources/applicants/${applicantId}/info/idDoc?${queryString}`;
      // const formData = data
      const formData = new FormData();
      formData.append("metadata", JSON.stringify(data));
      const headers = signRequest(uri, "POST", formData);

      const response = await axios.post(`${SUMSUB_BASE_URL}${uri}`, formData, {
        headers: {
          "content-type": "multipart/form-data",
          "X-Return-Doc-Warnings": warning,
          ...headers,
        },
      });
      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        code: 400,
        error: error,
      };
    }
  }

  // async addIdDocuments(applicantId, metadata, fileData, warning) {
  //   try {
  //     const uri = `/resources/applicants/${applicantId}/info/idDoc`;
  //     const filePath = fs.readFileSync(fileData.path);
  //     const base64Data = filePath.toString("base64");
  //     const file = `data:${fileData.mimetype};name:${fileData.originalname};base64,${base64Data}`;
  //     const data = JSON.stringify({
  //       // "content-type":"multipart/form-data",
  //       metadata: metadata,
  //       content: file,
  //     });
  //     const headers = signRequest(uri, "POST", data);
  //     const response = await axios({
  //       method: "POST",
  //       url: `${SUMSUB_BASE_URL}${uri}`,
  //       data: data,
  //       headers: {
  //         "content-type": "application/json",
  //         "X-Return-Doc-Warnings": warning,
  //         ...headers,
  //       },
  //     });
  //     const image = new ImageModel({
  //       ImageId: response.data.id,
  //       applicantId,
  //       country: metadata.country,
  //       type: metadata.type,
  //       fileName: fileData.originalname,
  //       fileSize: fileData.size,
  //       filePath: fileData.path,
  //     });
  //     await image.save();
  //     return {
  //       code: 200,
  //       data: response.data,
  //     };
  //   } catch (error) {
  //     throw {
  //       code: 400,
  //       error: error,
  //     };
  //   }
  // }
  async deleteIdDocuments(applicantId, body) {
    try {
      const data = JSON.stringify({
        idDocType: body.idDocType,
        country: body.country,
      });
      const uri = `/resources/applicants/${applicantId}/info/idDoc`;
      const headers = signRequest(uri, "DELETE", data);
      const response = await axios({
        method: "DELETE",
        url: `${SUMSUB_BASE_URL}${uri}`,
        data,
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      });

      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        code: 400,
        error: error,
      };
    }
  }
  async resetRevertImage(inspectionId, imageId, data) {
    try {
      const { revert } = data;
      let uri = `/resources/inspections/${inspectionId}/resources/${imageId}`;

      if (revert !== undefined) {
        uri += `?revert=${revert}`;
      }

      const headers = signRequest(uri, "DELETE");
      const response = await axios({
        method: "DELETE",
        url: `${SUMSUB_BASE_URL}${uri}`,
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      });

      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        code: 400,
        error: error,
      };
    }
  }

  async fetchImages(externalId) {
    try {
      const response = await Sumsub.fetchImages(externalId);
      return {
        code: 200,
        data: response,
      };
    } catch (error) {
      throw {
        code: 403,
        error: error,
      };
    }
  }

  async updateApplicantInfo(applicantId, body) {
    try {
      const uri = `/resources/applicants/${applicantId}/info`;
      const data = JSON.stringify({
        ...body,
      });
      const headers = signRequest(uri, "PATCH", data);
      const response = await axios({
        method: "PATCH",
        url: `${SUMSUB_BASE_URL}${uri}`,
        data,
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      });
      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        code: 400,
        error: error,
      };
    }
  }
  async getApplicantCheckData(applicantId) {
    try {
      const uri = `/resources/checks/latest?type=COMPANY&applicantId=${applicantId}`;

      const headers = signRequest(uri, "GET");
      const response = await axios({
        method: "GET",
        url: `${SUMSUB_BASE_URL}${uri}`,
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      });

      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        code: 400,
        error: error,
      };
    }
  }
  async getApplicantLevels() {
    try {
      const uri = `/resources/applicants/-/levels`;

      const headers = signRequest(uri, "GET");
      const response = await axios({
        method: "GET",
        url: `${SUMSUB_BASE_URL}${uri}`,
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      });

      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      throw {
        code: 400,
        error: error,
      };
    }
  }
  async getImageId(inspectionId, imageId) {
    try {
      const response = await Sumsub.getImage(imageId, inspectionId);
      return {
        code: 200,
        data: response,
      };
    } catch (error) {
      throw {
        code: error.code,
        errro: error.error,
      };
    }
  }
  async getEvents(applicantId, inspectionId) {
    try {
      const uri = `/resources/applicantTimeline/${applicantId}`;
      const headers = signRequest(uri, "GET");
      const response = await axios({
        method: "GET",
        url: `${SUMSUB_BASE_URL}${uri}`,
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      });

      const events = await Promise.all(
        response.data.items.map(async (item) => {
          if (item.imageId) {
            try {
              const imageResponse = await this.getImageId(
                inspectionId,
                item.imageId
              );
              if (imageResponse.code === 200) {
                const base64Image = imageResponse.data;
                return {
                  ...item,
                  imageBase64: `${base64Image}`,
                };
              }
            } catch (error) {
              console.error(
                `Error processing image for item ${item.imageId}: ${error.message}`
              );
              return {
                ...item,
                imageBase64: null,
              };
            }
          }
          return item;
        })
      );

      return {
        code: 200,
        data: {
          ...response.data,
          items: events,
        },
      };
    } catch (error) {
      console.error(`Error fetching events: ${error.message}`);
      return {
        code: 400,
        error: "invalid",
      };
    }
  }

  async getSummary(applicantId) {
    try {
      const uri = `/resources/applicants/${applicantId}/summary`;
      // const uri = `/resources/applicantTimeline/${applicantId}`;
      // const uri = `/resources/featureFlags/frontend?clientId=${applicantId}`;
      // const uri = `/resources/moderationComments?${clientId}&applicantId=${applicantId}`;
      // const uri = `/resources/moderationStates/-;applicantId=${applicantId}`;

      const headers = signRequest(uri, "GET");

      const response = await axios({
        method: "GET",
        url: `${SUMSUB_BASE_URL}${uri}`,
        headers: {
          ...headers,
          "content-type": "application/json",
        },
      });
      return {
        code: 200,
        data: response.data,
      };
    } catch (error) {
      return {
        code: 400,
        error: "invalid",
      };
    }
  }
}

module.exports = applicantController;
