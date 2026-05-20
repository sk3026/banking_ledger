const accountModel = require("../models/accounts.model");

async function createAccount(req, res) {

    try {

        const account = await accountModel.create({
            user: req.user._id
        });

        res.status(201).json({
            message: "Account created successfully",
            account
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

}

module.exports = { createAccount };