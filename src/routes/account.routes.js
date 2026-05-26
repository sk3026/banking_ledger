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

/**
 * -get /api/accounts/
 * -get all account of the logged-in user
 * -protected Route
 */
router.get("/",authMiddleware.authMiddleware,accountController.getuserAccountController)

/**
 * -get /api/accounts/balance/:accountId
 * -get balance of a particular account of the logged-in user
 * -protected Route
 */

router.get("/balance/:accountId",authMiddleware.authMiddleware,accountController.getAccountBalanceController)

module.exports = router;