const { default: axios } = require("axios");
const signRequest = require("./signRequest");
const Applicant = require("../model/applicantModel");
const SUMSUB_BASE_URL = process.env.SUMSUB_BASE_URL || "https://api.sumsub.com";
const fs = require("fs");
const crypto = require("crypto");

class Sumsub {
  static async getApplicant(externalId) {
    try {
      const findApplicant = await Applicant.findOne({
        externalUserId: externalId,
      });
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
        code: 403,
        error: error,
      };
    }
  }
  static async updateApplicantData(externalId) {
    try {
      const findApplicant = await Applicant.findOne({
        externalUserId: externalId,
      });
      const uri = `/resources/applicants/-;externalUserId=${encodeURIComponent(
        externalId
      )}/one`;
      const headers = signRequest(uri, "GET");
      let response;
      response = await axios({
        method: "GET",
        url: `${SUMSUB_BASE_URL}${uri}`,
        headers: headers,
      });

      const data = response.data;
      // findApplicant.review.levelName= data.review?.levelName
      findApplicant.review.reviewStatus = data.review?.reviewStatus;
      findApplicant.review.reviewResult.reviewAnswer =
        data.review?.reviewResult?.reviewAnswer;
      findApplicant.deleted = data?.deleted;
      findApplicant.createdAt = data.createdAt;
      findApplicant.ipCountry = data.ipCountry;
      findApplicant.lang = data.lang;
      findApplicant.info.firstName = data.info?.firstName
        ? data.info?.firstName
        : "unknown";
      findApplicant.info.lastName = data.info?.lastName;
      findApplicant.info.middleName = data.info?.middleName;
      findApplicant.info.legalName = data.info?.legalName;
      findApplicant.info.nationality = data.info?.nationality;
      findApplicant.info.country = data.info?.country;
      findApplicant.info.countryOfBirth = data.info?.countryOfBirth;
      findApplicant.info.dob = data.info?.dob;
      findApplicant.info.gender = data.info?.gender;
      if (data.info?.idDocs) {
        const d = data.info.idDocs.map((doc) => {
          const newDoc = {
            idDocType: doc?.idDocType,
            country: doc?.country,
          };
          return newDoc;
        });
        findApplicant.info.idDocs = d;
      }

      const docs = data.requiredIdDocs?.docSets?.map((data) => {
        return data.idDocSetType;
      });
      findApplicant.requiredIdDocs.docType = docs;
      await findApplicant.save();

      const applicant = {
        id: findApplicant.id,
        externalId: findApplicant.externalUserId,
        name: findApplicant.info?.firstName
          ? findApplicant.info.firstName
          : "unknown",
        date: findApplicant.createdAt,
        document: findApplicant.requiredIdDocs.docType,
        level: findApplicant.review.levelName,
        status: (() => {
          if (findApplicant.review.reviewStatus === "completed") {
            if (findApplicant.review.reviewResult.reviewAnswer === "RED") {
              return "Complete: Rejected";
            } else {
              return "Complete: Accepted";
            }
          }
          return findApplicant.review.reviewStatus;
        })(),
        tags: findApplicant.tags || "Documents",
        deleted: findApplicant.deleted ? findApplicant.deleted : null,
      };

      return applicant;
    } catch (error) {
      throw {
        code: 403,
        error: error,
      };
    }
  }
  static async getDocVerificationStatus(applicantId) {
    try {
      const uri = `/resources/applicants/${applicantId}/requiredIdDocsStatus`;
      const headers = signRequest(uri, "GET");

      const response = await axios({
        method: "GET",
        url: `${SUMSUB_BASE_URL}${uri}`,
        headers: headers,
      });
      return response.data;
    } catch (error) {
      throw {
        code: 403,
        error: "internal server error",
      };
    }
  }

  static async updateEvent(externalUserId, body) {
    try {
      const findApplicant = await Applicant.findOne({
        externalUserId: externalUserId,
      });
      if (body.imageId) {
        const checkEventExist = findApplicant.events.filter(
          (event) => event.imageId === body.imageId
        );
        if (checkEventExist.length > 0) {
          return;
        }
      }
      findApplicant.events.push({
        ...body,
      });
      await findApplicant.save();
      return {
        code: 200,
        data: "applicant Updated successfully",
      };
    } catch (error) {
      throw {
        error: "internal server error",
      };
    }
  }
  static async request(uri, httpMethod, requestBody = "") {
    const ts = Math.floor(Date.now() / 1000);

    const dataToSign = `${ts}${httpMethod}${uri}${requestBody}`;
    const secretKey = process.env.SUMSUB_SECRET_KEY;
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(dataToSign)
      .digest("hex");

    return {
      Accept: "application/json",
      "X-App-Token": process.env.SUMSUB_APP_TOKEN,
      "X-App-Access-Ts": ts,
      "X-App-Access-Sig": signature,
      // 'Content-Type': 'image/jpeg',
      // 'Content-Disposition': 'attachment'
    };
  }
  static async getImage(imageId, inspectionId) {
    try {
      const uri = `/resources/inspections/${inspectionId}/resources/${imageId}`;
      const headers = await this.request(uri, "GET");
      const response = await axios({
        method: "GET",
        url: `${SUMSUB_BASE_URL}${uri}`,
        headers: headers,
        responseType: 'arraybuffer'
      });
      // const base64Data = btoa(String.fromCharCode(...new Uint8Array(data)));
      // fs.writeFileSync(`./${imageId}.jpeg`, resp.data, { encoding: "base64" })

      const data = Buffer.from(response.data, "binary").toString("base64");
      // fs.writeFileSync(`./${imageId}.jpeg`, response.data);

      return data;
    } catch (error) {
      throw {
        code: 403,
        error: "internal server error",
      };
    }
  }
  static async fetchImagesByIds(imageIds, inspectionId) {
      try {
          const imagePromises = imageIds.map((imageId) => Sumsub.getImage(imageId, inspectionId));
          const resolvedImages = await Promise.all(imagePromises);
          return resolvedImages;
      } catch (error) {
          console.error('Error fetching images by IDs:', error);
          throw {
              code: 500,
              error: 'Error fetching images by IDs',
          };
      }
  }

  static async fetchImages(externalId) {
    try {
      const applicantData = await Sumsub.getApplicant(externalId);
      const inspectionId = applicantData.inspectionId;
      const applicantId = applicantData.id;

      const docStatus = await Sumsub.getDocVerificationStatus(applicantId);
      const identityImageIds = docStatus.IDENTITY?.imageIds || [];
      const selfieImageIds = docStatus.SELFIE?.imageIds || [];
      const [identityImages, selfieImages] = await Promise.all([
          this.fetchImagesByIds(identityImageIds, inspectionId),
          this.fetchImagesByIds(selfieImageIds, inspectionId)
      ]);

        return {
          identity: identityImages.map((image, index) => ({ imageId: identityImageIds[index], image })),
          selfie: selfieImages.map((image, index) => ({ imageId: selfieImageIds[index], image })),
          company: [], 
        };
    } catch (error) {
        console.error('Error fetching images:', error);
        throw {
            code: 500,
            error: 'Error fetching images',
        };
    }
  }
}

module.exports = Sumsub;
