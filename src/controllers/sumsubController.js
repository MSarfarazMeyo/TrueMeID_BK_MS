const Applicant = require("../model/applicantModel");
const signRequest = require("../utils/signRequest");
const axios = require('axios');
const Sumsub = require("../utils/sumsub");
const verificationController = require("./verificationController");
const SUMSUB_BASE_URL = process.env.SUMSUB_BASE_URL || 'https://api.sumsub.com';

class sumsubController{

    async generateAccessToken(externalUserId, levelName){
        // const externalUserId = "random-NodeJSToken-" + Math.random().toString(36).substr(2, 9);
        // const levelName = 'basic-kyc-level';
        const uri = `/resources/accessTokens?userId=${encodeURIComponent(externalUserId)}&ttlInSecs=12000&levelName=${encodeURIComponent(levelName)}`;
        const headers = signRequest(uri, 'POST');
        try {
            const data= await axios({
                method: 'POST',
                url: `${SUMSUB_BASE_URL}${uri}`,
                data: null,
                headers: headers,
            });
            
            return {
                code:200,
                data:data.data
            }
    
        } catch (error) {
             throw{
                code: 400,
                error: error
            }
        }
       
    }

    async webhookUpdate(body){
        try {
            
            const data= {
                levelName: body.levelName,
                date: body.createdAt,
            }
            const applicantData = await Applicant.findOne({externalUserId:body.externalUserId});
            
            if(body.type==='verify'){


                const applicantId = applicantData.applicantId;
                const verificationStatus = await Sumsub.getDocVerificationStatus(applicantId);
               if(verificationStatus.IDENTITY){
                   
                   const filter=applicantData.events.filter(obj => verificationStatus.IDENTITY.imageIds.includes(parseInt(obj.imageId)));
                   if(filter.length===0){
                    const fetchImages=  await Sumsub.fetchImages(body.externalUserId)
                    fetchImages.identity.map(async(id)=> await Sumsub.updateEvent(body.externalUserId, {...data,type:'image', imageId:id.imageId, imageBase64: id.image}))
                   }
                }
                if(verificationStatus.SELFIE){
                   const filter=applicantData.events.filter(obj => verificationStatus.SELFIE.imageIds.includes(parseInt(obj.imageId)));
                   if(filter.length===0){
                    const fetchImages=  await Sumsub.fetchImages(body.externalUserId)
                    fetchImages.selfie.map(async(id)=> await Sumsub.updateEvent(body.externalUserId, {...data,type:'image', imageId:id.imageId, imageBase64: id.image}))
                    
                   }
                }
                if(verificationStatus.COMPANY){
                    const filter= applicantData.events.filter(obj => {
                        const imageIds=verificationStatus.COMPANY.stepStatuses.images.map(imageId=> imageId.imageId)
                        return imageIds.includes(parseInt(obj.imageId))
                    })
                    if(filter.length===0){
                        const fetchImages= await Sumsub.fetchImages(body.externalUserId)
                        fetchImages.company[0].COMPANY_DOC.map((async(img)=> await Sumsub.updateEvent(body.externalUserId, {...data, type:'image',imageId: img.imageId, imageBase64: id.image})))
                    }
               }
                if(verificationStatus.PHONE_VERIFICATION){
                    if(verificationStatus.PHONE_VERIFICATION.reviewResult.reviewAnswer==="GREEN"){
                        const filter= applicantData.events.filter((event)=> event.type==='Phone Verification')
                        if(filter.length===0){
                            await Sumsub.updateEvent(body.externalUserId, {...data, type:'Phone Verification', verificationStatus:"GREEN"})
                        }
                    }
                }
                if(verificationStatus.EMAIL_VERIFICATION){
                    if(verificationStatus.EMAIL_VERIFICATION.reviewResult.reviewAnswer==="GREEN"){
                        const filter= applicantData.events.filter((event)=> event.type==='Email Verification')
                        if(filter.length===0){
                            await Sumsub.updateEvent(body.externalUserId, {...data, type:'Email Verification', verificationStatus:"GREEN"})
                        }
                    }
                }
               
            }else{
                if(body.type==='Consent Accepted'){
                    const response= applicantData.events.filter((event)=>event.type===body.type)
                    if(response.length===0){
                        await Sumsub.updateEvent(body.externalUserId, {...data, type: body.type})
                    }
                }else{
                    await Sumsub.updateEvent(body.externalUserId, {...data, type: body.type})
                }
            }
            return {
                code: 200,
                data: 'DB updated successfully'
            }
        } catch (error) {
            throw{
                code: 403,
                error: error
            }
        }
    }

  

    async generateSDKLink(levelName, externalUserId){
    try {
    

        const uri= `/resources/sdkIntegrations/levels/${levelName}/websdkLink`
        const data= JSON.stringify({
            externalUserId:externalUserId
        })
        const headers= signRequest(uri, "POST",data)
        const option= {
            headers:{
                ...headers,
                "content-type":"application/json"
            }
        }

        const result= await axios({
            method: 'POST',
            url: `${SUMSUB_BASE_URL}${uri}`,
            data: data,
            headers: option.headers,
        });        
        return {
            code: 200,
            data: result.data
        }
    } catch (error) {
        throw{
            code: 401,
            error: error
        }
    }
}


    
    
}

module.exports= sumsubController