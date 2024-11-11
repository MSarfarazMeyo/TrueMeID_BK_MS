const User = require("../model/user");
const generateAccessToken = require("../utils/accessToken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

class authController {
  async signup(req, res) {
    try {
      const { name, email, companyName, password, confirmPassword } =
        req.body;
      if (password !== confirmPassword) {
        throw {
          code: 400,
          message: "passwordnot matched",
        };
      }

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        throw {
          code: 400,
          message: "already exist",
        };
      }

      const newUser = new User({
        name,
        email,
        companyName,
        password,
      });

      await newUser.save();
      return { message: "account created", data: newUser };
    } catch (error) {
      console.error("Signup failed:", error);
      return res.status(500).send("Internal server error");
    }
  }

  async login(email, password) {
    try {
      const user = await User.findOne({ email: email });

      if (!user) {
        throw {
          code: 401,
          message: "User not found",
        };
      }

      if (user.password !== password) {
        throw {
          code: 401,
          message: "Invalid Credentials",
        };
      }

      if (!user?.two_factor_enabled) {
        const speakeasySecret = speakeasy.generateSecret();
        let url;

        const otpauthUrl = speakeasy.otpauthURL({
          secret: speakeasySecret.ascii,
          label: `TruMeID: ${email}`,
          algorithm: "sha1",
          digits: 6,
          period: 30,
        });

        QRCode.toDataURL(otpauthUrl, function (err, data_url) {
          url = data_url;
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));

        return {
          code: 200,
          data: {
            message: "Verify 2factor Authentication",
            qrUrl: url,
            secret: speakeasySecret.base32,
          },
        };
      } else {
        return {
          code: 200,
          data: {
            message: "Verify 2factor Authentication",
            secret: user.speakeasySecret,
          },
        };
      }
    } catch (error) {
      throw {
        code: 403,
        error: error,
      };
    }
  }

  async verifyQrCode(email, secret, token) {
    try {
      var verified = await speakeasy.totp.verify({
        secret: secret,
        encoding: "base32",
        token: token,
      });
      const user = await User.findOne({ email: email });
      if (verified) {
        user.two_factor_enabled = true;
        user.speakeasySecret = secret;
        await user.save();

        const accessToken = generateAccessToken({
          id: user._id,
          email: user.email,
        });

        return {
          code: 201,
          data: {
            message: "User Verified Successfully",
            accessToken: accessToken,
          },
        };
      } else {
        throw {
          code: 400,
          message: "SomeThing went wrong",
        };
      }
    } catch (error) {
      throw {
        code: 403,
        error: error,
      };
    }
  }

  async getAdminCredentials(email) {
    try {
      const admin = await User.findOne({ email });
      if (!admin) {
        throw {
          code: 404,
          message: "Admin not found",
        };
      }

      return {
        name: admin.name,
        password: admin.password,
      };
    } catch (error) {
      throw {
        code: 500,
        error: error,
      };
    }
  }

  async updateAdmin(body, email) {
    try {
      const admin = await User.findOneAndUpdate({ email }, { ...body });
      if (!admin) {
        throw {
          code: 404,
          message: "Admin not found",
        };
      }
      return {
        code: 200,
        data: {
          message: "Admin updated successfully.",
        },
      };
    } catch (error) {
      throw {
        code: 500,
        error: error,
      };
    }
  }

  async createAdmin(adminCredentials) {
    const existingAdmin = await this.findAdminByEmail(adminCredentials.email);
    if (existingAdmin) {
      throw {
        code: 400,
        message: "Admin credentials already exist.",
      };
    }

    const admin = new User(adminCredentials);
    await admin.save();
    return {
      code: 201,
      data: {
        message: "Admin created successfully.",
      },
    };
  }
}

module.exports = authController;
