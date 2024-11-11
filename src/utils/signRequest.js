const crypto = require('crypto');

function signRequest(uri, httpMethod, requestBody = '') {
    const ts = Math.floor(Date.now() / 1000);

    const dataToSign = `${ts}${httpMethod}${uri}${requestBody}`;
    const secretKey = process.env.SUMSUB_SECRET_KEY;
    const signature = crypto.createHmac('sha256', secretKey).update(dataToSign).digest('hex');
  
    return {
      'Accept': 'application/json',
      'X-App-Token': process.env.SUMSUB_APP_TOKEN,
      'X-App-Access-Ts': ts,
      'X-App-Access-Sig': signature,
    };    
  }

module.exports= signRequest