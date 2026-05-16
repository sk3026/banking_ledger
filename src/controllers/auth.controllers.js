const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

const emailService=require("../services/email.service");

/**
 *- User Register Controller
 * -POST /api/auth/register
 */

async function userRegistrationController(req, res) {
  try {
    const { email, name, password } = req.body;

    const isExists = await userModel.findOne({
      email: email,
    });

    if (isExists) {
      return res.status(422).json({
        message: "User already exists",
        status: "failed",
      });
    }

    const user = await userModel.create({
      email,
      name,
      password,
    });

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "3d",
      }
    );

    res.cookie("token", token);
    await emailService.sendRegistrationEmail(user.email, user.name);

    return res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
  
}

/**
 *- User Login Controller
 * -POST /api/auth/login
 */

 async function userLoginController(req, res) {
  try {
    const { email, password } = req.body;

    const user = await userModel
      .findOne({ email: email })
      .select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: "failed",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
        status: "failed",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "3d",
      }
    );

    res.cookie("token", token);

    return res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}
module.exports = { userRegistrationController,userLoginController };  
