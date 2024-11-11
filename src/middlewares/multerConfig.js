const multer= require('multer')
const path= require('path')

const storage= multer.diskStorage({
    diskStorage:(req, file, callback)=>{
        callback(null, path.resolve(__dirname, '../../images'))
    },
    filename:(req, file, callback)=>{
        callback(null, file.originalname)
    }
})
const upload= multer({storage:storage})
module.exports=upload