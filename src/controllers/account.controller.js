const accountModel = require("../models/accounts.model");

/**
 * ---------------------------------------------------
 * CREATE ACCOUNT
 * ---------------------------------------------------
 */

async function createAccount(req, res) {

    try {

        console.log("===== CREATE ACCOUNT =====");

        console.log("LOGGED IN USER:", req.user);

        /**
         * Create new account
         */

        const account = await accountModel.create({
            user: req.user._id
        });

        console.log("ACCOUNT CREATED:", account);

        return res.status(201).json({
            message: "Account created successfully",
            status: "success",
            account
        });

    } catch (error) {

        console.log(
            "CREATE ACCOUNT ERROR:",
            error
        );

        return res.status(500).json({
            message: error.message,
            status: "failed"
        });
    }
}

/**
 * ---------------------------------------------------
 * GET ALL USER ACCOUNTS
 * ---------------------------------------------------
 */

async function getuserAccountController(
    req,
    res
) {

    try {

        console.log(
            "===== GET USER ACCOUNTS ====="
        );

        console.log(
            "LOGGED IN USER:",
            req.user
        );

        /**
         * Find all accounts
         */

        const accounts =
            await accountModel.find({
                user: req.user._id
            });

        console.log(
            "ACCOUNTS FOUND:",
            accounts
        );

        return res.status(200).json({
            message:
                "Accounts fetched successfully",

            status: "success",

            accounts
        });

    } catch (error) {

        console.log(
            "GET USER ACCOUNT ERROR:",
            error
        );

        return res.status(500).json({
            message: error.message,
            status: "failed"
        });
    }
}

/**
 * ---------------------------------------------------
 * GET ACCOUNT BALANCE
 * ---------------------------------------------------
 */

async function getAccountBalanceController(
    req,
    res
) {

    try {

        console.log(
            "===== GET ACCOUNT BALANCE ====="
        );

        const accountId =
            req.params.accountId;

        console.log(
            "ACCOUNT ID:",
            accountId
        );

        console.log(
            "LOGGED IN USER:",
            req.user._id
        );

        /**
         * Find account
         */

        const account =
            await accountModel.findOne({

                _id: accountId,

                user: req.user._id
            });

        console.log(
            "ACCOUNT FOUND:",
            account
        );

        if (!account) {

            console.log(
                "ACCOUNT NOT FOUND"
            );

            return res.status(404).json({
                message: "Account not found",
                status: "failed"
            });
        }

        /**
         * Get balance
         */

        const balance =
            await account.getBalance();

        console.log(
            "BALANCE:",
            balance
        );

        return res.status(200).json({
            message:
                "Account balance fetched successfully",

            status: "success",

            balance
        });

    } catch (error) {

        console.log(
            "GET BALANCE ERROR:",
            error
        );

        return res.status(500).json({
            message: error.message,
            status: "failed"
        });
    }
}

module.exports = {
    createAccount,
    getuserAccountController,
    getAccountBalanceController
};