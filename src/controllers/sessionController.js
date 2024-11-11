const User= require('../model/user')



class sessionController {
  async getSessionInfo(req) {
    
    const { email } = req.user
    let existingUser = await User.findOne({ email })
    if (!existingUser) throw { code: 403, message: 'User Does not exist' }

    let newUser = {
      _id: existingUser._id,
      email: existingUser.email
    }

    return newUser
  }
}
module.exports= sessionController