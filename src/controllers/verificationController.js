const axios = require("axios")
const signRequest = require("../utils/signRequest");
const { getDocVerificationStatus } = require("../utils/sumsub");
require('dotenv').config();


const SUMSUB_BASE_URL= process.env.SUMSUB_BASE_URL
class verificationController{
    async getApplicantReviewStatus(applicantId){

        try {
            const uri=`/resources/applicants/${applicantId}/status`
            const headers= signRequest(uri, "GET")
            const option={
                headers:{...headers,
                "content-type":"application/json"}
            }
            const response= await axios.get(`${SUMSUB_BASE_URL}${uri}`, option)
            return {
                code:200,
                data: response.data
            }
        } catch (error) {
            throw{
                code: 401,
                errro:error
            }
        }

    }
    async docVerificationStatus(applicantId, data){

        try {
            const uri=`/resources/checks/latest`
            const data= JSON.stringify({applicantId:applicantId,type: 'EMAIL_CONFIRMATION'})
            // const params= JSON.stringify({applicantId})

            const headers= signRequest(uri, "GET")

            const option={
                headers:{
                    ...headers,
                    "content-type":"application/json",
            }
            }
            const options = {
                method: 'GET',
                url: 'https://api.sumsub.com/resources/checks/latest',
                params: {applicantId:applicantId,type: 'EMAIL_CONFIRMATION'},
                headers: option.headers
              };
              
              axios
                .request(options)
                .then(function (response) {
                })
                .catch(function (error) {
                  console.error(error);
                });
            // const response= await axios.get(`${SUMSUB_BASE_URL}${uri}`,{params:params, headers:options})
            
            // const response= await axios({
            //     method: "GET",
            //     url: `${SUMSUB_BASE_URL}${uri}`,
            //     params,
            //     headers:option.headers,
            // })
            return {
                code:200,
                data: response.data
            }
        } catch (error) {
            throw{
                code: 401,
                errro:error
            }
        }

    }

    async getRejectionReason(applicantId){

        try {
            const uri=`/resources/moderationStates/-;applicantId=${applicantId}`
            const headers= signRequest(uri, "GET")
            const option={
                headers:{
                    ...headers,
                    "content-type":"application/json"}
            }
            const response= await axios.get(`${SUMSUB_BASE_URL}${uri}`, option)
            
            return {
                code:200,
                data: response.data
            }
        } catch (error) {
            throw{
                code: 401,
                errro:error
            }
        }

    }
    // async getVerificationStatus(applicantId){
    //     try {
    //         const response= await getDocVerificationStatus(applicantId)
    //         return {
    //             code: response.code,
    //             data: response.data
    //         }
    //     } catch (error) {
    //         throw{
    //             code: error.code,
    //             error: error.error
    //         }
    //     }
    // }
    // async getImageDocument(inspectionId,imageId){

    //     try {
    //         const uri=`/resources/inspections/${inspectionId}/resources/${imageId}`
    //         const headers= signRequest(uri, "GET")
    //         const option={
    //             headers:{
    //                 ...headers,
    //                 "content-type":"application/json"}
    //         }
    //         const response= await axios.get(`${SUMSUB_BASE_URL}${uri}`, option)
            
    //         return {
    //             code:200,
    //             data: response.data
    //         }
    //     } catch (error) {
    //         throw{
    //             code: 401,
    //             errro:error
    //         }
    //     }

    // }
    
    
}

module.exports= verificationController