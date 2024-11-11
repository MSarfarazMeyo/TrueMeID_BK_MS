const Jwt = require("jsonwebtoken");
const User = require("../model/user");

const verifyAuth = async (req, res, next) => {
    try {
        let token = req.headers['authorization'];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized token' });
        }
        token = token.split(' ')[1];
        const data = await Jwt.verify(token, process.env.ACCESS_SECERET_KEY);
     
        const user = await User.findOne({ email: data.email });
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized user' });
        }

        // Set user data in the request object if needed
        req.user = {
            _id: user._id,
            email: user.email
        };

        return next();
    } catch (error) {
        // Handle errors by sending an appropriate response
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

module.exports = verifyAuth;
