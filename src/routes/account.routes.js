const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");

const accountController = require("../controllers/account.controller");

const router = express.Router();

/**
 * POST /api/accounts/
 * Create new account for logged in user
 * Protected Route
 */

router.post(
    "/",
    authMiddleware.authMiddleware,
    accountController.createAccount
);

module.exports = router;