const { default: mongoose } = require("mongoose");


const riskSchema= new mongoose.Schema({
    applicantId: {type:String},
    riskLevel: [
        {

            comment: {type: String},    
            level: {type:String}
        }
    ]
})


const RiskLevel= mongoose.model('RiskLevel', riskSchema)
module.exports= RiskLevel