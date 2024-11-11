const { default: axios } = require("axios");
const signRequest = require("../utils/signRequest");
const SUMSUB_BASE_URL = process.env.SUMSUB_BASE_URL || 'https://api.sumsub.com';


class tagsController{

    async addTags(id){
        try {
            const uri=`/resources/kyt/txns/${id}/tags`
           
            const headers= signRequest(uri, "POST")
            const response = await axios({
                method: 'POST',
                url: `${SUMSUB_BASE_URL}${uri}`,
                headers: {
                    ...headers,
                    'content-type': 'application/json',
                },
              });  
       
            return {    
                code:200,
                data: response.data
            }
        } catch (error) {
            throw{
                code: 400,
                error:error
            }
        }
    }
}

module.exports= tagsController