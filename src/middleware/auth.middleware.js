const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

/**
 * ---------------------------------------------------
 * NORMAL AUTH MIDDLEWARE
 * ---------------------------------------------------
 */

async function authMiddleware(req, res, next) {

    const token =
        req.cookies.token ||
        req.headers.authorization?.split(" ")[1];

    console.log("=================================");
    console.log("AUTH MIDDLEWARE STARTED");
    console.log("TOKEN:", token);

    if (!token) {

        console.log("NO TOKEN FOUND");

        return res.status(401).json({
            message:
                "Unauthorized access, token missing",
            status: "failed"
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log(
            "DECODED TOKEN:",
            decoded
        );

        const user = await userModel
            .findById(decoded.userId)
            .select("-password");

        console.log("USER FOUND:", user);

        if (!user) {

            console.log("USER NOT FOUND");

            return res.status(401).json({
                message: "User not found",
                status: "failed"
            });
        }

        console.log(
            "USER EMAIL:",
            user.email
        );

        req.user = user;

        console.log(
            "AUTH MIDDLEWARE PASSED"
        );

        return next();

    } catch (error) {

        console.log(
            "AUTH ERROR:",
            error
        );

        return res.status(401).json({
            message:
                "Unauthorized access, invalid token",
            status: "failed"
        });
    }
}

/**
 * ---------------------------------------------------
 * SYSTEM USER AUTH MIDDLEWARE
 * ---------------------------------------------------
 */

async function authsystemUserMiddleware(
    req,
    res,
    next
) {

    const token =
        req.cookies.token ||
        req.headers.authorization?.split(" ")[1];

    console.log("=================================");
    console.log(
        "SYSTEM USER MIDDLEWARE STARTED"
    );

    console.log("TOKEN:", token);

    if (!token) {

        console.log("NO TOKEN FOUND");

        return res.status(401).json({
            message:
                "Unauthorized access, token missing",
            status: "failed"
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log(
            "DECODED TOKEN:",
            decoded
        );

        const user = await userModel
            .findById(decoded.userId)
            .select("-password");

        console.log("USER FOUND:", user);

        if (!user) {

            console.log("USER NOT FOUND");

            return res.status(401).json({
                message: "User not found",
                status: "failed"
            });
        }

        console.log(
            "USER EMAIL:",
            user.email
        );

        console.log(
            "SYSTEM USER VALUE:",
            user.systemUser
        );

        if (!user.systemUser) {

            console.log(
                "ACCESS DENIED: NOT SYSTEM USER"
            );

            return res.status(403).json({
                message:
                    "Forbidden access, system user only",
                status: "failed"
            });
        }

        console.log(
            "ACCESS GRANTED"
        );

        req.user = user;

        return next();

    } catch (error) {

        console.log(
            "JWT VERIFY ERROR:",
            error
        );

        return res.status(401).json({
            message:
                "Unauthorized access, invalid token",
            status: "failed"
        });
    }
}

module.exports = {
    authMiddleware,
    authsystemUserMiddleware
};